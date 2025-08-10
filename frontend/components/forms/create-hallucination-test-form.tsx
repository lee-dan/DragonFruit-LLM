"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createHallucinationTestRun } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { PlusCircle, ArrowRight, ArrowLeft, Check } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const AVAILABLE_DATASETS = [
  { id: "TriviaQA", name: "TriviaQA", description: "General knowledge questions from TriviaQA dataset" },
  { id: "Jeopardy", name: "Jeopardy", description: "Jeopardy-style questions from the Jeopardy dataset" },
  { id: "Biology", name: "Biology", description: "Biology and medical questions from the Biology dataset" },
];

const DEFAULT_MODEL = "llama-3.2-8B";

export function CreateHallucinationTestForm() {
  const [step, setStep] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [lastRunId, setLastRunId] = useState<number | null>(null);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    model_name: DEFAULT_MODEL,
    datasets: {
      "TriviaQA": 10,
      "Jeopardy": 10,
      "Biology": 10
    } as Record<string, number>,
    max_tokens: 256,
    temperature: 0.7,
    top_p: 0.9,
  });

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createHallucinationTestRun,
    onSuccess: (data) => {
      toast.success("Hallucination test run successfully started!");
      queryClient.invalidateQueries({ queryKey: ["hallucinationTestRuns"] });
      setLastRunId(data.id);
      setStep(3); // Move to success step
    },
    onError: (error) => {
      toast.error(`Failed to create hallucination test run: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Apply default 10 for empty fields
    const datasetsWithDefaults = Object.fromEntries(
      Object.entries(formData.datasets).map(([key, value]) => [key, value === '' ? 10 : value])
    );
    
    // Check if at least one dataset has questions
    const totalQuestions = Object.values(datasetsWithDefaults).reduce((sum, count) => sum + count, 0);
    if (totalQuestions === 0) {
      toast.error("Please select at least one question from any dataset.");
      return;
    }
    
    mutation.mutate({
      model_name: formData.model_name,
      datasets: datasetsWithDefaults,
      max_tokens: formData.max_tokens,
      temperature: formData.temperature,
      top_p: formData.top_p,
    });
  };

  const handleNext = () => setStep(s => Math.min(s + 1, 2));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleViewRun = () => {
    if (lastRunId) {
      router.push(`/hallucinations/${lastRunId}`);
      setIsOpen(false);
    }
  };

  const updateDatasetCount = (datasetId: string, value: string) => {
    setFormData(d => ({
      ...d,
      datasets: {
        ...d.datasets,
        [datasetId]: value === '' ? '' : parseInt(value) || 0
      }
    }));
  };

  const totalQuestions = Object.values(formData.datasets).reduce((sum, count) => sum + count, 0);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Run Hallucination Test
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col font-sans">
        <DialogHeader>
          <DialogTitle>Create Hallucination Test Run</DialogTitle>
          <DialogDescription>
            Test the Llama-3.2-8B model for hallucinations using entropy analysis.
          </DialogDescription>
        </DialogHeader>
        
        <StepIndicator currentStep={step} />

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-4">
            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Model Selection</h3>
                  <p className="text-sm text-muted-foreground">
                    Currently only Llama-3.2-8B is supported for hallucination testing.
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge variant="secondary">Llama</Badge>
                      Llama-3.2-8B
                    </CardTitle>
                    <CardDescription>
                      Local model using entropy-based hallucination detection
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Context:</span> 8K tokens
                      </div>
                      <div>
                        <span className="font-medium">Detection:</span> ShED-HD
                      </div>
                      <div>
                        <span className="font-medium">Model Size:</span> 8B parameters
                      </div>
                      <div>
                        <span className="font-medium">Type:</span> Local inference
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Dataset Selection</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose how many questions to test from each dataset.
                  </p>
                </div>

                <div className="space-y-4">
                  {AVAILABLE_DATASETS.map((dataset) => (
                    <Card key={dataset.id}>
                      <CardHeader>
                        <CardTitle className="text-base">{dataset.name}</CardTitle>
                        <CardDescription>{dataset.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <Label htmlFor={`count-${dataset.id}`}>Number of Questions</Label>
                            <Input
                              id={`count-${dataset.id}`}
                              type="number"
                              min="0"
                              max="100"
                              value={formData.datasets[dataset.id] === '' ? '' : formData.datasets[dataset.id] || 0}
                              onChange={(e) => updateDatasetCount(dataset.id, e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Available: {dataset.id === "Biology" ? "575" : "600"} questions
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Advanced Settings</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure the model parameters for hallucination testing.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="max_tokens" className="text-sm">Max Tokens</Label>
                      <Input
                        id="max_tokens"
                        type="number"
                        value={formData.max_tokens}
                        onChange={(e) => setFormData(prev => ({ ...prev, max_tokens: parseInt(e.target.value) || 256 }))}
                        min={1}
                        max={1024}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="temperature" className="text-sm">Temperature</Label>
                      <Input
                        id="temperature"
                        type="number"
                        step="0.1"
                        value={formData.temperature}
                        onChange={(e) => setFormData(prev => ({ ...prev, temperature: parseFloat(e.target.value) || 0.7 }))}
                        min={0}
                        max={2}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="top_p" className="text-sm">Top P</Label>
                      <Input
                        id="top_p"
                        type="number"
                        step="0.1"
                        value={formData.top_p}
                        onChange={(e) => setFormData(prev => ({ ...prev, top_p: parseFloat(e.target.value) || 0.9 }))}
                        min={0}
                        max={1}
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {step === 3 && (
              <div className="text-center p-8">
                <h3 className="text-xl font-semibold mb-4">Hallucination Test Started!</h3>
                <p className="text-muted-foreground mb-6">
                  The test is now running against Llama-3.2-8B. You can view the live progress and results.
                </p>
                <Button type="button" onClick={handleViewRun}>
                  View Live Results
                </Button>
              </div>
            )}
          </div>
          
          <DialogFooter className="border-t pt-4 flex-shrink-0">
            {step > 1 && step < 3 && <Button type="button" variant="outline" onClick={handleBack}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>}
            {step < 2 && <Button type="button" onClick={handleNext}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>}
            {step === 2 && <Button type="submit" disabled={mutation.isPending || totalQuestions === 0}>{mutation.isPending ? "Starting..." : "Start Test"}</Button>}
            {step === 3 && <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Close</Button>}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Step Indicator Component
const StepIndicator = ({ currentStep }: { currentStep: number }) => (
  <div className="flex items-center justify-center space-x-4 py-4">
    {[1, 2].map((step) => (
      <div key={step} className="flex items-center">
        <div className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full font-semibold transition-all duration-300",
          currentStep >= step ? "bg-primary text-primary-foreground scale-110" : "bg-muted text-muted-foreground"
        )}>
          {step}
        </div>
        {step < 2 && <div className="h-0.5 w-16 bg-muted relative"><div className={cn("absolute top-0 left-0 h-full bg-primary transition-all duration-500", currentStep > step ? "w-full" : "w-0")} /></div>}
      </div>
    ))}
  </div>
); 