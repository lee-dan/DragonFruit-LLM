"use client"

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import {
  getTestRun,
  getEvolvedCases,
  cancelTestRun,
  createTestRun,
  TestCase,
  TestRun,
  EvolvedTestCase,
} from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { AlertTriangle, Clock, Server, BrainCircuit, FlaskConical, Zap, CheckCircle, XCircle, FileText, ChevronRight, Loader2, StopCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { groupBy } from "lodash";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

type FilterType = "all" | "success" | "failure";

export default function TestRunPage() {
  const params = useParams();
  const runId = parseInt(params.run_id as string, 10);
  const [testRun, setTestRun] = useState<TestRun | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [isStopping, setIsStopping] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [evolvedCases, setEvolvedCases] = useState<EvolvedTestCase[]>([]);
  const [previousEvolvedCount, setPreviousEvolvedCount] = useState(0);
  const [showNewCaseNotification, setShowNewCaseNotification] = useState(false);
  const router = useRouter();

  // Move all computed values and useMemo hooks here, before any conditional returns
  const progress = testRun?.total_cases ? (testRun.completed_cases / testRun.total_cases) * 100 : 0;
  const progressColor = testRun?.status === 'COMPLETED' ? "bg-green-500" : "";

  const filteredTestCases = useMemo(() => {
    if (!testRun?.test_cases) return [];
    return testRun.test_cases.filter(tc => {
      if (filter === "all") return true;
      if (filter === "success") return !tc.is_failure;
      if (filter === "failure") return tc.is_failure;
      return true;
    });
  }, [testRun?.test_cases, filter]);

  const groupedAndFilteredTestCases = useMemo(() => {
    return groupBy(filteredTestCases, 'category') as Record<string, TestCase[]>;
  }, [filteredTestCases]);

  const failureData = useMemo(() => {
    if (!testRun?.test_cases) return [];
    return Object.entries(
      groupBy(testRun.test_cases.filter(tc => tc.is_failure), 'category')
    ).map(([category, cases]) => ({
      name: category.replace(/_/g, " ").replace("bigbench:", ""),
      total: cases.length,
    }));
  }, [testRun?.test_cases]);

  useEffect(() => {
    if (!runId) return;

    const fetchTestRun = async () => {
      try {
        const response = await getTestRun(runId);
        setTestRun(response);
        if (isLoading) setIsLoading(false);
        
        // Always fetch evolved cases, regardless of status
        try {
          const evolved = await getEvolvedCases(runId);
          
          // Check if new cases were generated
          if (evolved.length > previousEvolvedCount && previousEvolvedCount > 0) {
            setShowNewCaseNotification(true);
            setTimeout(() => setShowNewCaseNotification(false), 5000);
          }
          
          setEvolvedCases(evolved);
          setPreviousEvolvedCount(evolved.length);
        } catch (error) {
          console.log("No evolved cases yet or error fetching:", error);
        }
        
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
  }, [runId, isLoading, previousEvolvedCount]);

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
      const updatedRun = await cancelTestRun(runId);
      setTestRun(updatedRun);
    } catch (error) {
      console.error("Failed to stop test run:", error);
    } finally {
      setIsStopping(false)
    }
  }

  const handleCreateFollowUp = async () => {
    if (!testRun) return;

    const followUpConfig = {
      model_name: testRun.model_name,
      mutators: [],
      datasets: [],
      use_evolved_cases: true,
      detect_hallucinations: false, // Or carry over settings
      detect_failures_llm: true,  // Or carry over settings
    };

    try {
      const newTestRun = await createTestRun(followUpConfig);
      router.push(`/runs/${newTestRun.id}`);
    } catch (error) {
      console.error("Failed to create follow-up test run:", error);
    }
  };

  const formatPST = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString + "Z").toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const formatElapsedTime = (start: string, end: string | null) => {
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
        {/* New Evolved Case Notification */}
        {showNewCaseNotification && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                <Sparkles className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900">New Hard Cases Generated!</h4>
                <p className="text-sm text-blue-700">
                  {evolvedCases.length - previousEvolvedCount} new evolved test cases have been created from test failures.
                  {evolvedCases.length > 0 && (
                    <span className="block mt-1">
                      Total evolved cases: {evolvedCases.length}
                    </span>
                  )}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewCaseNotification(false)}
                className="text-blue-600 hover:text-blue-800"
              >
                ×
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Test Run #{runId}</h1>
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
                        <h4 className="font-semibold">Mutators</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {(testRun.mutators || []).map(m => <Badge key={m} variant="secondary">{m}</Badge>)}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold">Datasets</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {(testRun.datasets || []).map(d => <Badge key={d} variant="secondary">{d}</Badge>)}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold">Evolved Cases</h4>
                        <p>{testRun.use_evolved_cases ? "Enabled" : "Disabled"}</p>
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
            <CardHeader><CardTitle>Failure Breakdown</CardTitle></CardHeader>
            <CardContent>
                <FailureBreakdownChart failures={failureData} />
            </CardContent>
        </Card>

        {testRun && (
          <Accordion type="single" collapsible className="w-full" defaultValue="evolved-cases">
            <AccordionItem value="evolved-cases">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5" />
                  Evolved Hard Cases 
                  {evolvedCases.length > 0 && (
                    <Badge variant="default" className="ml-2">
                      {evolvedCases.length} Generated
                    </Badge>
                  )}
                  {testRun.status === "RUNNING" && evolvedCases.length === 0 && (
                    <Badge variant="secondary" className="ml-2">
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Mining in Progress
                    </Badge>
                  )}
                  {testRun.status === "RUNNING" && evolvedCases.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Mining Active
                    </Badge>
                  )}
                  {testRun.status === "COMPLETED" && evolvedCases.length === 0 && (
                    <Badge variant="outline" className="ml-2">
                      No Cases Generated
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {evolvedCases.length > 0 ? (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">Generated Hard Cases</CardTitle>
                            <CardDescription>
                              {evolvedCases.length} new challenging prompts were generated from test failures.
                              These can be used to create follow-up test runs for deeper evaluation.
                            </CardDescription>
                          </div>
                          <Button onClick={handleCreateFollowUp} className="flex items-center gap-2">
                            <FlaskConical className="h-4 w-4" />
                            Create Follow-up Run
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>

                    {/* Status Summary */}
                    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium text-blue-900">
                              Hard Case Mining Complete
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-blue-900">
                              {evolvedCases.length} Cases Generated
                            </div>
                            <div className="text-xs text-blue-700">
                              Ready for follow-up testing
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <div className="grid gap-4">
                      {evolvedCases.map((caseItem, index) => {
                        // Find the original test case to get its prompt
                        const originalTestCase = testRun.test_cases?.find(tc => tc.id === caseItem.original_test_case_id);
                        return (
                          <Card 
                            key={caseItem.id} 
                            className="border-l-4 border-l-blue-500 hover:shadow-md transition-all duration-200 animate-in slide-in-from-left-2"
                            style={{ animationDelay: `${index * 100}ms` }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-3">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      Evolved Case #{index + 1}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs">
                                      From Test Case #{caseItem.original_test_case_id}
                                    </Badge>
                                    <Badge variant="default" className="text-xs animate-pulse">
                                      <Sparkles className="h-3 w-3 mr-1" />
                                      New
                                    </Badge>
                                  </div>
                                  
                                  {/* Original Test Case Info */}
                                  {originalTestCase && (
                                    <div className="bg-muted/30 p-3 rounded-md">
                                      <h5 className="font-semibold text-sm text-muted-foreground mb-2">
                                        Original Test Case #{caseItem.original_test_case_id}:
                                      </h5>
                                      <pre className="text-sm bg-background p-2 rounded border whitespace-pre-wrap font-sans">
                                        {originalTestCase.prompt}
                                      </pre>
                                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                        <span>Status: {originalTestCase.is_failure ? "Failed" : "Passed"}</span>
                                        <span>•</span>
                                        <span>Category: {originalTestCase.category}</span>
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div>
                                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                                      Evolved Prompt:
                                    </h4>
                                    <pre className="text-sm bg-muted/50 p-3 rounded-md whitespace-pre-wrap font-sans">
                                      {caseItem.evolved_prompt}
                                    </pre>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>Generated: {formatPST(caseItem.created_at)}</span>
                                    <span>•</span>
                                    <span>Status: Ready for testing</span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ) : testRun.status === "RUNNING" && evolvedCases.length > 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <BrainCircuit className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Loader2 className="h-3 w-3 text-white animate-spin" />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold">Hard Case Mining Active</h3>
                          <p className="text-sm text-muted-foreground max-w-md">
                            {evolvedCases.length} cases generated so far. The system is still analyzing and may generate more evolved prompts.
                          </p>
                        </div>
                        
                        <div className="w-full max-w-md space-y-2">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Current: {evolvedCases.length} cases</span>
                            <span>More may come...</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full animate-pulse transition-all duration-1000" style={{ width: '80%' }}></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : testRun.status === "RUNNING" ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <BrainCircuit className="h-8 w-8 text-blue-600" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <Loader2 className="h-4 w-4 text-white animate-spin" />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold">Hard Case Mining in Progress</h3>
                          <p className="text-sm text-muted-foreground max-w-md">
                            The system is analyzing failed test cases and automatically generating evolved prompts 
                            that are more challenging than the original tests.
                          </p>
                        </div>
                        
                        <div className="w-full max-w-md space-y-2">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Analyzing failures...</span>
                            <span>Generating prompts...</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full animate-pulse transition-all duration-1000" style={{ width: '60%' }}></div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6 text-sm">
                          <div className="text-center">
                            <div className="font-semibold text-blue-600">Phase 1</div>
                            <div className="text-muted-foreground">Failure Analysis</div>
                            <div className="text-xs text-green-600 mt-1">✓ Complete</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-blue-600">Phase 2</div>
                            <div className="text-muted-foreground">Prompt Evolution</div>
                            <div className="text-xs text-blue-600 mt-1">
                              <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
                              In Progress
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <FileText className="h-12 w-12 text-muted-foreground" />
                        <div>
                          <h3 className="text-lg font-semibold">No Evolved Cases Generated</h3>
                          <p className="text-sm text-muted-foreground">
                            {testRun.status === "COMPLETED" 
                              ? "No test failures were detected, so no evolved cases were needed."
                              : "Evolved cases will appear here once the test run completes and hard case mining finishes."
                            }
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Test Cases ({filteredTestCases.length} / {testRun.total_cases})</CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>All</Button>
                <Button variant={filter === 'success' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('success')}>Success</Button>
                <Button variant={filter === 'failure' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('failure')}>Failure</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {Object.entries(groupedAndFilteredTestCases).map(([category, cases]) => (
              <div key={category} className="mb-6">
                <h3 className="text-lg font-semibold mb-2 capitalize">{category.replace(/_/g, " ")}</h3>
                <Accordion type="single" collapsible className="w-full">
                  {cases.map((testCase) => (
                    <AccordionItem value={`item-${testCase.id}`} key={testCase.id}>
                      <AccordionTrigger>
                        <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="text-xs font-mono">
                                #{testCase.id}
                              </Badge>
                              <span className="truncate max-w-md">{testCase.prompt}</span>
                            </div>
                            <Badge variant={testCase.is_failure ? "destructive" : "secondary"}>
                                {testCase.is_failure ? "Failure" : "Success"}
                            </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline" className="text-sm font-mono">
                            Test Case #{testCase.id}
                          </Badge>
                          <Badge variant="secondary" className="text-sm">
                            {testCase.category}
                          </Badge>
                        </div>
                        <div>
                            <h5 className="font-semibold">Full Prompt:</h5>
                            <pre className="mt-1 p-3 bg-background border rounded-md whitespace-pre-wrap font-sans text-sm">
                                {testCase.prompt}
                            </pre>
                        </div>
                        <div>
                            <h5 className="font-semibold">Response:</h5>
                            <div className="mt-1 p-3 bg-background border rounded-md prose prose-sm max-w-none">
                                <ReactMarkdown>
                                    {testCase.response}
                                </ReactMarkdown>
                            </div>
                        </div>
                        <div>
                            <h5 className="font-semibold">Latency:</h5>
                            <p>{testCase.latency_ms.toFixed(2)} ms</p>
                        </div>
                        {testCase.is_failure && (
                            <div>
                                <h5 className="font-semibold">Failure Logs:</h5>
                                <ul className="list-disc pl-5 mt-1">
                                    {(testCase.failure_logs || []).map(log => (
                                        <li key={log.id}><strong>{log.failure_type}:</strong> {log.log_message}</li>
                                    ))}
                                </ul>
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

const FailureBreakdownChart = ({ failures }: { failures: any[] }) => {
  const COLORS = ["#FF8042", "#FFBB28", "#00C49F", "#0088FE", "#AF19FF"];

  const breakdown = useMemo(() => {
    return failures.map(item => ({
      name: item.name,
      value: item.total,
    }));
  }, [failures]);

  if (failures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
        <h3 className="text-lg font-semibold">No Failures Detected</h3>
        <p className="text-sm text-muted-foreground">
          This test run completed without any failures.
        </p>
      </div>
    );
  }

  const totalFailures = failures.reduce((sum, item) => sum + item.total, 0);

  const CustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul className="flex flex-col space-y-2 text-sm text-muted-foreground">
        {payload.map((entry: any, index: number) => {
          const { value, payload: chartPayload } = entry;
          const percentage = ((chartPayload.value / totalFailures) * 100).toFixed(1);
          return (
            <li key={`item-${index}`} className="flex items-center justify-between">
              <div className="flex items-center">
                <span style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: entry.color,
                  marginRight: '8px'
                }}></span>
                <span>{value}</span>
              </div>
              <span className="font-semibold">{chartPayload.value} ({percentage}%)</span>
            </li>
          );
        })}
      </ul>
    );
  };


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
      <div className="w-full h-64">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={breakdown}
              cx="50%"
              cy="50%"
              labelLine={false}
              innerRadius={60}
              outerRadius={90}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
            >
              {breakdown.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col justify-center">
        <CustomLegend payload={breakdown.map((item, index) => ({
          value: item.name,
          color: COLORS[index % COLORS.length],
          payload: { value: item.value }
        }))} />
      </div>
    </div>
  );
};
