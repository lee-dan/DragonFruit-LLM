"use client"

import {
  AlertTriangle,
  Shield,
  TestTube2,
  Zap,
  CheckCircle,
} from "lucide-react"
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
  } from "recharts"
import { LucideIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getDashboardMetrics } from "@/lib/api"
import { useQuery } from "@tanstack/react-query"

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  color?: 'primary' | 'destructive' | 'success';
  children?: React.ReactNode;
}

function MetricCard({ title, value, description, icon: Icon, color, children }: MetricCardProps) {
    const colorClasses = {
      primary: "text-primary",
      destructive: "text-destructive",
      success: "text-success",
    }
  
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className={`h-4 w-4 md:h-5 md:w-5 ${color && colorClasses[color] ? colorClasses[color] : 'text-muted-foreground'}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl md:text-4xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
          {children && <div className="h-20 md:h-24">{children}</div>}
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
    return (
        <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="h-4 w-2/3 rounded bg-muted"></div>
                        <div className="h-6 w-6 md:h-8 md:w-8 rounded-lg bg-muted"></div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-8 w-1/2 md:h-10 rounded bg-muted"></div>
                        <div className="mt-2 h-3 w-full rounded bg-muted"></div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
  }

  if (isError || !metrics) {
    return (
        <div className="flex items-center justify-center rounded-lg border bg-card p-6 md:p-8 text-center text-muted-foreground">
            <AlertTriangle className="mr-2 h-4 w-4" />
            <span className="text-sm md:text-base">Error loading dashboard metrics.</span>
        </div>
    )
  }
  const failureBreakdownData = Object.entries(metrics.failure_breakdown ?? {}).map(
    ([name, total]) => ({ name, total })
  );

  return (
    <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
      <MetricCard
        title="Success Rate"
        value={`${(metrics.success_rate ?? 0).toFixed(2)}%`}
        description="24-hour trend"
        icon={CheckCircle}
        color="success"
      >
        {metrics.success_rate_trend && metrics.success_rate_trend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.success_rate_trend}>
                    <defs>
                        <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="rate" stroke="#22c55e" fillOpacity={1} fill="url(#colorRate)" />
                </AreaChart>
            </ResponsiveContainer>
        ) : (
            <div className="flex h-full items-center justify-center">
                <p className="text-xs text-muted-foreground">No trend data available</p>
            </div>
        )}
      </MetricCard>
      <MetricCard
        title="Total Test Runs"
        value={(metrics.total_runs ?? 0).toLocaleString()}
        description={`${(metrics.total_test_cases ?? 0).toLocaleString()} total tests`}
        icon={TestTube2}
      />
      <MetricCard
        title="Active Runs"
        value={(metrics.active_runs ?? 0).toLocaleString()}
        description="Test runs currently in progress"
        icon={Zap}
        color="primary"
      />
    </div>
  )
}
