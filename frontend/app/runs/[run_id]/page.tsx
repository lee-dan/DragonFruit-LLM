"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { getTestRun, TestRun, TestCase, cancelTestRun } from "@/lib/api"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { groupBy } from "lodash"
import { Markdown } from "@/components/ui/markdown"

type FilterStatus = "all" | "success" | "failure"

export default function TestRunDetailsPage() {
  const params = useParams()
  const runId = parseInt(params.run_id as string, 10)
  const [testRun, setTestRun] = useState<TestRun | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>("all")
  const [isStopping, setIsStopping] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    if (!runId) return;

    const fetchTestRun = async () => {
      try {
        const response = await getTestRun(runId);
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
  }, [runId]);

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

  if (isLoading) return <DashboardLayout><p>Loading details...</p></DashboardLayout>
  if (!testRun) return <DashboardLayout><p>Test run not found.</p></DashboardLayout>

  const progress = testRun.total_cases ? (testRun.completed_cases / testRun.total_cases) * 100 : 0;
  const progressColor = testRun.status === 'COMPLETED' ? "bg-green-500" : ""

  const filteredTestCases = (testRun.test_cases || []).filter(tc => {
    if (filter === "all") return true
    if (filter === "success") return !tc.is_failure
    if (filter === "failure") return tc.is_failure
    return true
  })

  const groupedAndFilteredTestCases = groupBy(filteredTestCases, 'category')

  return (
    <DashboardLayout>
      <div className="space-y-6">
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
                  {(cases as TestCase[]).map((testCase) => (
                    <AccordionItem value={`item-${testCase.id}`} key={testCase.id}>
                      <AccordionTrigger>
                        <div className="flex items-center justify-between w-full pr-4">
                            <span className="truncate max-w-md">{testCase.prompt}</span>
                            <div className="flex items-center space-x-2">
                                <Badge variant={testCase.is_failure ? "destructive" : "secondary"}>
                                    {testCase.is_failure ? "Failure" : "Success"}
                                </Badge>
                                {testCase.hallucination_likelihood !== undefined && testCase.hallucination_likelihood !== null && (
                                    <span className="text-sm text-muted-foreground">
                                        {testCase.hallucination_likelihood.toFixed(1)}%
                                    </span>
                                )}
                            </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 p-4 bg-muted/50 rounded-lg">
                        <div>
                            <h5 className="text-xl font-semibold text-blue-600 dark:text-blue-400">Full Prompt:</h5>
                            <div className="mt-1">
                                <Markdown className="text-sm prose-headings:text-base prose-h1:text-base prose-h2:text-base prose-h3:text-base prose-h4:text-base prose-h5:text-base prose-h6:text-base prose-pre:bg-transparent prose-pre:p-0 prose-pre:border-0">
                                    {testCase.prompt}
                                </Markdown>
                            </div>
                        </div>
                        <div>
                            <h5 className="text-xl font-semibold text-blue-600 dark:text-blue-400">Response:</h5>
                            <div className="mt-1">
                                <Markdown className="text-sm prose-headings:text-base prose-h1:text-base prose-h2:text-base prose-h3:text-base prose-h4:text-base prose-h5:text-base prose-h6:text-base prose-pre:bg-transparent prose-pre:p-0 prose-pre:border-0">
                                    {testCase.response}
                                </Markdown>
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
                                    {(testCase.failure_logs || []).map((log: any) => (
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
