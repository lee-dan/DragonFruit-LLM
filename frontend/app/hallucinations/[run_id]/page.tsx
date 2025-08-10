"use client"

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  getHallucinationTestRun,
  cancelHallucinationTestRun,
  HallucinationTestRun,
  HallucinationTestCase,
} from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, CheckCircle, XCircle, FileText, ChevronRight, Loader2, StopCircle } from "lucide-react";
import { groupBy } from "lodash";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { toast } from "sonner";

type FilterType = "all" | "hallucination" | "normal";

export default function HallucinationTestRunPage() {
  const params = useParams();
  const runId = parseInt(params.run_id as string, 10);
  const [testRun, setTestRun] = useState<HallucinationTestRun | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [isStopping, setIsStopping] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const router = useRouter();

  // Move all computed values and useMemo hooks here, before any conditional returns
  const progress = testRun?.total_questions ? (testRun.completed_questions / testRun.total_questions) * 100 : 0;
  const progressColor = testRun?.status === 'COMPLETED' ? "bg-green-500" : "";

  const filteredTestCases = useMemo(() => {
    if (!testRun?.test_cases) return [];
    return testRun.test_cases.filter(tc => {
      if (filter === "all") return true;
      if (filter === "hallucination") return tc.is_hallucination;
      if (filter === "normal") return !tc.is_hallucination;
      return true;
    });
  }, [testRun?.test_cases, filter]);

  const groupedAndFilteredTestCases = useMemo(() => {
    return groupBy(filteredTestCases, 'dataset') as Record<string, HallucinationTestCase[]>;
  }, [filteredTestCases]);

  const hallucinationData = useMemo(() => {
    if (!testRun?.test_cases) return [];
    return Object.entries(
      groupBy(testRun.test_cases.filter(tc => tc.is_hallucination), 'dataset')
    ).map(([dataset, cases]) => ({
      name: dataset.replace(/_/g, " "),
      total: (cases as HallucinationTestCase[]).length,
    }));
  }, [testRun?.test_cases]);

  useEffect(() => {
    if (!runId) return;

    const fetchTestRun = async () => {
      try {
        const response = await getHallucinationTestRun(runId);
        setTestRun(response);
        if (isLoading) setIsLoading(false);
        return response;
      } catch (error) {
        console.error("Failed to fetch test run details:", error);
        setIsLoading(false);
        return null;
      }
    };

    fetchTestRun();

    const intervalId = setInterval(async () => {
      const updatedRun = await fetchTestRun();
      if (updatedRun && (updatedRun.status === "COMPLETED" || updatedRun.status === "FAILED" || updatedRun.status === "CANCELLED")) {
        clearInterval(intervalId);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [runId, isLoading]);

  useEffect(() => {
    if (testRun?.status === 'RUNNING') {
      const timer = setInterval(() => {
        setElapsedTime(prevTime => prevTime + 1000);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [testRun?.status]);

  const handleStop = async () => {
    if (!runId) return
    setIsStopping(true)
    try {
      const updatedRun = await cancelHallucinationTestRun(runId);
      setTestRun(updatedRun);
    } catch (error) {
      console.error("Failed to stop test run:", error);
    } finally {
      setIsStopping(false)
    }
  }

  const formatPST = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString + "Z").toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const formatElapsedTime = (start: string, end: string | null | undefined) => {
    if (!start) return "00:00:00";
    const startTime = new Date(start + "Z").getTime();
    const endTime = end ? new Date(end + "Z").getTime() : new Date().getTime();
    
    let totalSeconds = Math.floor((endTime - startTime) / 1000);
    totalSeconds = Math.max(0, totalSeconds); // Ensure it's not negative

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Early returns after all hooks
  if (isLoading) return <DashboardLayout><p>Loading details...</p></DashboardLayout>
  if (!testRun) return <DashboardLayout><p>Test run not found.</p></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="space-y-6">

        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Hallucination Test Run #{runId}</h1>
            <div className="flex items-center space-x-2">
              {testRun.status === 'RUNNING' && (
                  <Button variant="destructive" onClick={handleStop} disabled={isStopping}>
                      {isStopping ? "Stopping..." : "Stop Test Run"}
                  </Button>
              )}
              <Badge variant={testRun.status === 'RUNNING' ? 'default' : 'outline'}>{testRun.status}</Badge>
            </div>
        </div>

        <Card>
            <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-3">
                    <Metric title="Model" value={testRun.model_name} />
                    <Metric title="Time Elapsed" value={formatElapsedTime(testRun.created_at, testRun.completed_at)} />
                    <Metric title="Progress" value={<Progress value={progress} className="w-full" indicatorClassName={progressColor} />} />
                </div>
            </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="font-semibold">Datasets</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {Object.entries(testRun.datasets).map(([name, count]) => (
                              <Badge key={name} variant="secondary">{name} ({count})</Badge>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold">Total Questions</h4>
                        <p>{testRun.total_questions}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold">Completed Questions</h4>
                        <p>{testRun.completed_questions}</p>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="font-semibold">Created At</h4>
                        <p>{formatPST(testRun.created_at)}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold">Completed At</h4>
                        <p>{formatPST(testRun.completed_at)}</p>
                    </div>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader><CardTitle>Hallucination Breakdown</CardTitle></CardHeader>
            <CardContent>
                <HallucinationBreakdownChart hallucinations={hallucinationData} />
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Test Cases ({filteredTestCases.length} / {testRun.total_questions})</CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>All</Button>
                <Button variant={filter === 'hallucination' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('hallucination')}>Hallucination</Button>
                <Button variant={filter === 'normal' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('normal')}>Normal</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {Object.entries(groupedAndFilteredTestCases).map(([dataset, cases]) => (
              <div key={dataset} className="mb-6">
                <h3 className="text-lg font-semibold mb-2 capitalize">{dataset.replace(/_/g, " ")}</h3>
                <Accordion type="single" collapsible className="w-full">
                  {cases.map((testCase) => (
                    <AccordionItem value={`item-${testCase.id}`} key={testCase.id}>
                      <AccordionTrigger>
                        <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="text-xs font-mono">
                                #{testCase.id}
                              </Badge>
                              <span className="truncate max-w-md">{testCase.question}</span>
                            </div>
                            <Badge variant={testCase.is_hallucination ? "destructive" : "secondary"}>
                                {testCase.is_hallucination ? "Hallucination" : "Normal"}
                            </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline" className="text-sm font-mono">
                            Test Case #{testCase.id}
                          </Badge>
                          <Badge variant="secondary" className="text-sm">
                            {testCase.dataset}
                          </Badge>
                        </div>
                        <div>
                            <h5 className="font-semibold">Question:</h5>
                            <pre className="mt-1 p-3 bg-background border rounded-md whitespace-pre-wrap font-sans text-sm">
                                {testCase.question}
                            </pre>
                        </div>
                        <div>
                            <h5 className="font-semibold">Answer:</h5>
                            <div className="mt-1 p-3 bg-background border rounded-md prose prose-sm max-w-none">
                                <ReactMarkdown>
                                    {testCase.answer}
                                </ReactMarkdown>
                            </div>
                        </div>
                        <div>
                            <h5 className="font-semibold">Confidence:</h5>
                            <p>{(testCase.confidence * 100).toFixed(1)}%</p>
                        </div>
                        <div>
                            <h5 className="font-semibold">Latency:</h5>
                            <p>{testCase.latency_ms.toFixed(2)} ms</p>
                        </div>
                        {testCase.average_entropy && (
                            <div>
                                <h5 className="font-semibold">Entropy Analysis:</h5>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium">Average Entropy:</span> {testCase.average_entropy.toFixed(3)}
                                    </div>
                                    <div>
                                        <span className="font-medium">Entropy Std:</span> {testCase.entropy_std?.toFixed(3) || "N/A"}
                                    </div>
                                </div>
                            </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

const Metric = ({ title, value }: { title: string, value: React.ReactNode }) => (
    <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="text-2xl font-bold">{value}</div>
    </div>
);

const HallucinationBreakdownChart = ({ hallucinations }: { hallucinations: any[] }) => {
  if (hallucinations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
        <h3 className="text-lg font-semibold">No Hallucinations Detected</h3>
        <p className="text-sm text-muted-foreground">
          This test run completed without any hallucinations.
        </p>
      </div>
    );
  }

  const totalHallucinations = hallucinations.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-red-600">{totalHallucinations}</div>
        <div className="text-sm text-muted-foreground">Total Hallucinations</div>
      </div>
      <div className="space-y-2">
        {hallucinations.map((item, index) => {
          const percentage = ((item.total / totalHallucinations) * 100).toFixed(1);
          return (
            <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="font-medium">{item.name}</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">{item.total}</div>
                <div className="text-xs text-muted-foreground">{percentage}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 