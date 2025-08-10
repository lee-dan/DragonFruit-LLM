"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Brain,
  MessageCircle,
  Play,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
} from "lucide-react";
import { HallucinationChatModal } from "@/components/hallucination-chat-modal";
import { CreateHallucinationTestForm } from "@/components/forms/create-hallucination-test-form";
import { useQuery } from "@tanstack/react-query";
import { getHallucinationDashboardMetrics, getHallucinationTestRuns } from "@/lib/api";
import { HallucinationTestRun } from "@/lib/api";

const formatPST = (dateString: string | null | undefined) => {
  if (!dateString) return "N/A";
  return new Date(dateString + "Z").toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
};

export default function HallucinationsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ["hallucinationDashboardMetrics"],
    queryFn: () => getHallucinationDashboardMetrics(24),
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const { data: testRuns, isLoading: isLoadingRuns } = useQuery({
    queryKey: ["hallucinationTestRuns"],
    queryFn: getHallucinationTestRuns,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "RUNNING":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "FAILED":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "CANCELLED":
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "RUNNING":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "CANCELLED":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Hallucination Detection</h1>
          <Badge variant="secondary" className="text-xs">Beta</Badge>
        </div>

        {/* Metrics Overview */}
        {!isLoadingMetrics && metrics && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Test Runs</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.total_runs}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.active_runs} currently running
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.total_questions}</div>
                <p className="text-xs text-muted-foreground">
                  Questions tested
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hallucination Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.hallucination_rate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Average detection rate
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(metrics.average_confidence * 100).toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Detection confidence
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <CreateHallucinationTestForm />
          <Button 
            variant="outline"
            onClick={() => setIsModalOpen(true)}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Test Single Question
          </Button>
        </div>

        {/* Test Runs Table */}
        {!isLoadingRuns && testRuns && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Test Runs</h2>
            {testRuns.length === 0 ? (
              <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/20">
                <p className="text-muted-foreground">No hallucination test runs found.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Hallucinations</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Completed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testRuns.map((run) => (
                    <TableRow 
                      key={run.id} 
                      onClick={() => router.push(`/hallucinations/${run.id}`)}
                      className="cursor-pointer"
                    >
                      <TableCell>{run.id}</TableCell>
                      <TableCell>{run.model_name}</TableCell>
                      <TableCell>{run.status}</TableCell>
                      <TableCell>{run.completed_questions}/{run.total_questions}</TableCell>
                      <TableCell>{run.hallucination_count}</TableCell>
                      <TableCell>{formatPST(run.created_at)}</TableCell>
                      <TableCell>{formatPST(run.completed_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {/* Chat Modal */}
        <HallucinationChatModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      </div>
    </DashboardLayout>
  );
} 