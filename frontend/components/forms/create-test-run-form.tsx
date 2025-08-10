"use client"

import { useState, useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createTestRun, getBigBenchTasks } from "@/lib/api"
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
const availableModels = [
    { id: "gpt-4o-mini", name: "GPT-4o Mini" },
    { id: "gpt-4o", name: "GPT-4o" },
    { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
    { id: "claude-3-sonnet", name: "Claude 3 Sonnet" },
    { id: "llama-3.2-1b", name: "Llama 3.2 1B" },
]

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
    datasets: [],
    use_evolved_cases: true,
    detect_hallucinations: true,
    detect_failures_llm: true,
  });

  const { data: bigbenchTasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ["bigbenchTasks"],
    queryFn: getBigBenchTasks,
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
      <DialogContent className="sm:max-w-xl font-sans">
        <DialogHeader>
          <DialogTitle>Create a New Test Run</DialogTitle>
          <DialogDescription>
            Configure and launch a new stress test in three steps.
          </DialogDescription>
        </DialogHeader>
        
        <StepIndicator currentStep={step} />

        <form onSubmit={handleSubmit}>
          <div className="py-6 space-y-6 max-h-[60vh] overflow-y-auto pr-4">
            {step === 1 && <Tier1 formData={formData} setFormData={setFormData} />}
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
          
          <DialogFooter className="pt-6">
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
function Tier1({ formData, setFormData }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Basic Setup</h3>
        <p className="text-sm text-muted-foreground">Define the model you want to test.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="model-name">Target Model</Label>
        <Select value={formData.model_name} onValueChange={(value) => setFormData(d => ({ ...d, model_name: value }))}>
            <SelectTrigger id="model-name" className="font-sans">
                <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent className="font-sans">
                {availableModels.map(model => (
                    <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>
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
        <p className="text-sm text-muted-foreground">Configure how failures are detected and analyzed.</p>
      </div>
      <FormSwitch id="detect-hallucinations" label="ShED-HD Hallucination" description="Uses entropy analysis to detect hallucinations." checked={formData.detect_hallucinations} onCheckedChange={(c) => setFormData(d => ({ ...d, detect_hallucinations: c }))} />
      <FormSwitch id="detect-failures-llm" label="LLM-as-a-Judge" description="Uses a powerful LLM to classify failures." checked={formData.detect_failures_llm} onCheckedChange={(c) => setFormData(d => ({ ...d, detect_failures_llm: c }))} />
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
