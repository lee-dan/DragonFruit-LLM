"use client"

import { useState, useEffect } from "react"
import type { AIModel, ModelsResponse } from "@/lib/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createTestRun, getBigBenchTasks, getAvailableModels } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PlusCircle, ArrowRight, ArrowLeft, Check, ChevronsUpDown } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"

// --- Configuration Data ---
// Models are now fetched from the API instead of hardcoded

const availableMutators = [
  { id: "malformed_json", name: "Malformed JSON", description: "Tests handling of broken JSON inputs." },
  { id: "malformed_csv", name: "Malformed CSV", description: "Tests handling of broken CSV inputs." },
  { id: "malformed_html", name: "Malformed HTML", description: "Tests handling of broken HTML inputs." },
  { id: "weird_unicode", name: "Weird Unicode", description: "Includes homoglyphs, RTL overrides, etc." },
  { id: "mixed_languages", name: "Mixed Languages", description: "Prompts with multiple languages." },
  { id: "contradictory_instructions", name: "Contradictory Instructions", description: "Conflicting prompts to test reasoning." },
  { id: "base64_blobs", name: "Base64 Blobs", description: "Tests handling of encoded text blobs." },
];

// --- Main Component ---
export function CreateTestRunForm() {
  const [step, setStep] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [lastRunId, setLastRunId] = useState<number | null>(null);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    model_name: "gpt-4o-mini",
    mutators: ["malformed_json"],
    datasets: [] as string[],
    use_evolved_cases: true,
    detect_hallucinations: false,
    detect_failures_llm: true,
  });

  const { data: bigbenchTasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ["bigbenchTasks"],
    queryFn: getBigBenchTasks,
  })

  const { data: modelsData, isLoading: isLoadingModels } = useQuery({
    queryKey: ["availableModels"],
    queryFn: getAvailableModels,
  })

  // Set default BigBench tasks once they are loaded
  useEffect(() => {
    if (bigbenchTasks && bigbenchTasks.length > 0 && formData.datasets.length === 0) {
      setFormData(d => ({ ...d, datasets: [bigbenchTasks[0].id] }));
    }
  }, [bigbenchTasks]);

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createTestRun,
    onSuccess: (data) => {
      toast.success("Test run successfully started!");
      queryClient.invalidateQueries({ queryKey: ["testRuns"] });
      setLastRunId(data.id);
      setStep(4); // Move to a new "success" step
    },
    onError: (error) => {
      toast.error(`Failed to create test run: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.mutators.length === 0 && formData.datasets.length === 0 && !formData.use_evolved_cases) {
      toast.error("Please select at least one test case source.");
      return;
    }
    mutation.mutate(formData);
  };

  const handleNext = () => setStep(s => Math.min(s + 1, 3));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleViewRun = () => {
    if (lastRunId) {
      router.push(`/runs/${lastRunId}`);
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Test Run
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col font-sans">
        <DialogHeader>
          <DialogTitle>Create a New Test Run</DialogTitle>
          <DialogDescription>
            Configure and launch a new stress test in three steps.
          </DialogDescription>
        </DialogHeader>
        
        <StepIndicator currentStep={step} />

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-4">
            {step === 1 && <Tier1 formData={formData} setFormData={setFormData} modelsData={modelsData} isLoadingModels={isLoadingModels} />}
            {step === 2 && <Tier2 formData={formData} setFormData={setFormData} bigbenchTasks={bigbenchTasks || []} isLoadingTasks={isLoadingTasks} />}
            {step === 3 && <Tier3 formData={formData} setFormData={setFormData} />}
            {step === 4 && (
              <div className="text-center p-8">
                <h3 className="text-xl font-semibold mb-4">Test Run Started!</h3>
                <p className="text-muted-foreground mb-6">
                  You can now view the live progress of your test run.
                </p>
                <Button type="button" onClick={handleViewRun}>
                  View Live Run
                </Button>
              </div>
            )}
          </div>
          
          <DialogFooter className="border-t pt-4 flex-shrink-0">
            {step > 1 && step < 4 && <Button type="button" variant="outline" onClick={handleBack}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>}
            {step < 3 && <Button type="button" onClick={handleNext}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>}
            {step === 3 && <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Starting..." : "Start Test Run"}</Button>}
            {step === 4 && <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Close</Button>}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Step Indicator ---
const StepIndicator = ({ currentStep }) => (
    <div className="flex items-center justify-center space-x-4 py-4">
        {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
                <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full font-semibold transition-all duration-300",
                    currentStep >= step ? "bg-primary text-primary-foreground scale-110" : "bg-muted text-muted-foreground"
                )}>
                    {step}
                </div>
                {step < 3 && <div className="h-0.5 w-16 bg-muted relative"><div className={cn("absolute top-0 left-0 h-full bg-primary transition-all duration-500", currentStep > step ? "w-full" : "w-0")} /></div>}
            </div>
        ))}
    </div>
);

// --- Tier 1: Basic Setup ---
interface Tier1Props {
  formData: any;
  setFormData: any;
  modelsData?: ModelsResponse;
  isLoadingModels: boolean;
}

function Tier1({ formData, setFormData, modelsData, isLoadingModels }: Tier1Props) {
  const [selectedProvider, setSelectedProvider] = useState("all");
  
  const filteredModels = modelsData?.models?.filter(model => 
    selectedProvider === "all" || model.provider === selectedProvider
  ) || [];

  const providers = modelsData?.providers || [];
  const bridgeStatus = modelsData?.vercel_bridge_available;

  const getProviderColor = (provider) => {
    const colors = {
      'openai': 'bg-green-100 text-green-800',
      'anthropic': 'bg-orange-100 text-orange-800', 
      'google': 'bg-blue-100 text-blue-800',
      'groq': 'bg-purple-100 text-purple-800',
      'mistral': 'bg-red-100 text-red-800',
      'cohere': 'bg-pink-100 text-pink-800',
      'fireworks': 'bg-yellow-100 text-yellow-800',
      'perplexity': 'bg-indigo-100 text-indigo-800',
      'xai': 'bg-gray-100 text-gray-800'
    };
    return colors[provider] || 'bg-gray-100 text-gray-800';
  };

  const getPricingColor = (pricing) => {
    if (pricing.includes('$0.0') || pricing.includes('€0.0')) return 'text-green-600 font-medium';
    if (pricing.includes('$0.') || pricing.includes('€0.')) return 'text-blue-600';
    if (pricing.includes('$1') || pricing.includes('€1')) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">AI Model Selection</h3>
        <p className="text-sm text-muted-foreground">
          Choose from {modelsData?.total_models || 0} available models across {modelsData?.total_providers || 0} providers.
          {bridgeStatus ? (
            <span className="text-green-600 font-medium"> ✅ Vercel AI Bridge Connected</span>
          ) : (
            <span className="text-orange-600"> ⚠️ Bridge disconnected - limited models</span>
          )}
        </p>
      </div>

      {/* Provider Filter */}
      <div className="space-y-2">
        <Label>Filter by Provider</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          <Button
            type="button"
            variant={selectedProvider === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedProvider("all")}
            className="h-auto py-2 px-3 text-xs min-w-0 justify-center"
          >
            <span className="truncate">All ({modelsData?.total_models || 0})</span>
          </Button>
          {providers.map(provider => {
            const count = modelsData?.by_provider?.[provider]?.length || 0;
            return (
              <Button
                key={provider}
                type="button"
                variant={selectedProvider === provider ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedProvider(provider)}
                className="h-auto py-2 px-3 text-xs min-w-0 justify-start"
              >
                <span className={`inline-block w-2 h-2 rounded-full mr-1.5 flex-shrink-0 ${getProviderColor(provider).split(' ')[0]}`}></span>
                <span className="truncate">
                  {provider.charAt(0).toUpperCase() + provider.slice(1)} ({count})
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Model Selection */}
      <div className="space-y-2">
        <Label htmlFor="model-name">Target Model</Label>
        {isLoadingModels ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading models from Vercel AI Bridge...
          </div>
        ) : (
          <div className="border rounded-lg max-h-80 overflow-y-auto">
            {filteredModels.map((model, index) => (
              <div
                key={model.id}
                className={cn(
                  "p-4 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors",
                  formData.model_name === model.id && "bg-blue-50 border-blue-200"
                )}
                onClick={() => setFormData(d => ({ ...d, model_name: model.id }))}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        formData.model_name === model.id ? "bg-blue-500" : "border-2 border-gray-300"
                      )}></div>
                      <span className="font-medium">{model.name || model.id}</span>
                      <Badge className={cn("text-xs", getProviderColor(model.provider))}>
                        {model.provider}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground ml-5 mt-1">
                      <span className="font-medium">Context: {model.context_length}</span>
                      <span className={getPricingColor(model.pricing)}>
                        {model.pricing}
                      </span>
                    </div>
                  </div>
                  {!model.available && (
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      Limited
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            {filteredModels.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No models available for {selectedProvider === "all" ? "any provider" : selectedProvider}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Model Info */}
      {formData.model_name && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm">
            <strong>Selected:</strong> {formData.model_name}
            {(() => {
              const selected = filteredModels.find(m => m.id === formData.model_name) || 
                            modelsData?.models?.find(m => m.id === formData.model_name);
              return selected ? (
                <div className="mt-1 text-xs text-muted-foreground">
                  {selected.provider} • {selected.context_length} context • {selected.pricing}
                </div>
              ) : null;
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Tier 2: Test Case Selection ---
function Tier2({ formData, setFormData, bigbenchTasks, isLoadingTasks }) {
  const toggleSelection = (id, field) => {
    setFormData(d => ({
      ...d,
      [field]: d[field].includes(id)
        ? d[field].filter(i => i !== id)
        : [...d[field], id],
    }));
  };

  return (
    <div className="space-y-6">
       <div className="space-y-2">
        <h3 className="text-lg font-semibold">Test Case Sources</h3>
        <p className="text-sm text-muted-foreground">Choose the inputs to test your model against.</p>
      </div>
      <div className="space-y-4">
        <h4 className="text-sm font-semibold uppercase text-muted-foreground">Adversarial Mutators</h4>
        {availableMutators.map((mutator) => (
          <FormSwitch key={mutator.id} id={mutator.id} label={mutator.name} description={mutator.description} checked={formData.mutators.includes(mutator.id)} onCheckedChange={() => toggleSelection(mutator.id, 'mutators')} />
        ))}
      </div>
      <div className="space-y-4">
        <h4 className="text-sm font-semibold uppercase text-muted-foreground">BIG-bench Datasets</h4>
        {isLoadingTasks ? <p>Loading tasks...</p> : bigbenchTasks.map((task) => (
            <FormSwitch key={task.id} id={task.id} label={task.name} description={task.description} checked={formData.datasets.includes(task.id)} onCheckedChange={() => toggleSelection(task.id, 'datasets')} />
        ))}
      </div>
       <div className="space-y-4">
        <h4 className="text-sm font-semibold uppercase text-muted-foreground">Self-Improving Tests</h4>
          <FormSwitch id="evolved_cases" label="Evolved Test Cases" description="Use hard cases generated from previous failures." checked={formData.use_evolved_cases} onCheckedChange={(c) => setFormData(d => ({ ...d, use_evolved_cases: c }))} />
      </div>
    </div>
  );
}

// --- Tier 3: Analysis & Review ---
function Tier3({ formData, setFormData }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Failure Detectors</h3>
        <p className="text-sm text-muted-foreground">Configure how failures are detected and analyzed. <strong>Enable "LLM-as-a-Judge" to apply business rules and detect policy violations.</strong></p>
      </div>
      <FormSwitch id="detect-hallucinations" label="ShED-HD Hallucination" description="Uses entropy analysis to detect hallucinations." checked={formData.detect_hallucinations} onCheckedChange={(c) => setFormData(d => ({ ...d, detect_hallucinations: c }))} />
      <FormSwitch id="detect-failures-llm" label="LLM-as-a-Judge (Business Rules)" description="Uses a powerful LLM to detect policy violations, safety issues, and business rule failures. This enables comprehensive compliance checking." checked={formData.detect_failures_llm} onCheckedChange={(c) => setFormData(d => ({ ...d, detect_failures_llm: c }))} />
    </div>
  );
}

// --- Reusable Switch Component ---
const FormSwitch = ({ id, label, description, checked, onCheckedChange }) => (
    <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5 pr-4">
            <Label htmlFor={id} className="text-base font-medium">{label}</Label>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Switch
            id={id}
            checked={checked}
            onCheckedChange={onCheckedChange}
        />
    </div>
);


// --- Reusable MultiSelect Component ---
function MultiSelect({ options, selected, onChange, className }) {
  const [open, setOpen] = useState(false)
  const selectedOptions = options.filter(option => selected.includes(option.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
        >
            <div className="flex flex-wrap gap-1">
                {selectedOptions.length > 0 ? (
                    selectedOptions.map(option => <Badge key={option.id} variant="secondary">{option.name}</Badge>)
                ) : (
                    "Select tasks..."
                )}
            </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search tasks..." />
          <CommandList>
            <CommandEmpty>No tasks found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.name}
                  onSelect={() => {
                    onChange(
                      selected.includes(option.id)
                        ? selected.filter((id) => id !== option.id)
                        : [...selected, option.id]
                    )
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected.includes(option.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div>
                    <p className="font-medium">{option.name}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
