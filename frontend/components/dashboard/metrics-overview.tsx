"use client"

import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Shield,
  Zap,
  TestTube2,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getDashboardMetrics } from "@/lib/api"
import { useQuery } from "@tanstack/react-query"

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ElementType
  progress?: number
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  progress,
  color,
}: MetricCardProps & { color?: "primary" | "destructive" | "success" }) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    destructive: "bg-destructive/10 text-destructive",
    success: "bg-success/10 text-success",
  }

  const progressColorClasses = {
    primary: "bg-primary",
    destructive: "bg-destructive",
    success: "bg-success",
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            colorClasses[color || "primary"]
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {progress !== undefined && (
          <div className="mt-4 h-2 rounded-full bg-secondary">
            <div
              className={`h-2 rounded-full ${
                progressColorClasses[color || "primary"]
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function MetricsOverview() {
  const {
    data: metrics,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["dashboardMetrics"],
    queryFn: getDashboardMetrics,
  })

  if (isLoading) {
    // A simple skeleton loader
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="h-4 w-2/3 rounded bg-muted"></div>
                        <div className="h-8 w-8 rounded-lg bg-muted"></div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-10 w-1/2 rounded bg-muted"></div>
                        <div className="mt-2 h-3 w-full rounded bg-muted"></div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
  }

  if (isError || !metrics) {
    return (
        <div className="flex items-center justify-center rounded-lg border bg-card p-8 text-center text-muted-foreground">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Error loading dashboard metrics.
        </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <MetricCard
        title="Failure Rate"
        value={`${(metrics.failure_rate ?? 0).toFixed(2)}%`}
        description="Percentage of tests that failed"
        icon={AlertTriangle}
        progress={metrics.failure_rate}
        color="destructive"
      />
      <MetricCard
        title="Hallucination Rate"
        value={`${(metrics.hallucination_rate ?? 0).toFixed(2)}%`}
        description="Detected by ShED-HD & LLM Judge"
        icon={Shield}
        progress={metrics.hallucination_rate}
        color="destructive"
      />
      <MetricCard
        title="Total Test Runs"
        value={(metrics.total_runs ?? 0).toLocaleString()}
        description={`${(metrics.total_test_cases ?? 0).toLocaleString()} total tests`}
        icon={TestTube2}
      />
    </div>
  )
}
