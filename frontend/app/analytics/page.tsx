"use client"

import { useQuery } from "@tanstack/react-query"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { getDashboardMetrics } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, CheckCircle, Clock, BarChart as BarChartIcon } from "lucide-react"

export default function AnalyticsPage() {
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ["dashboardMetrics"],
    queryFn: getDashboardMetrics,
  })

  if (isLoading) return <DashboardLayout><p>Loading dashboard...</p></DashboardLayout>
  if (error) return <DashboardLayout><p>Error loading metrics: {error.message}</p></DashboardLayout>
  if (!metrics) return <DashboardLayout><p>No metrics available.</p></DashboardLayout>

  const chartData = metrics.failure_breakdown ? Object.entries(metrics.failure_breakdown).map(([name, value]) => ({ name, count: value })) : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard 
            title="Total Test Runs" 
            value={metrics.total_runs?.toLocaleString() ?? '0'} 
            icon={<BarChartIcon className="h-6 w-6 text-muted-foreground" />}
            description={`${(metrics.total_test_cases ?? 0).toLocaleString()} total tests`}
          />
          <MetricCard 
            title="Active Runs" 
            value={metrics.active_runs ?? '0'} 
            icon={<Clock className="h-6 w-6 text-muted-foreground" />} 
          />
          <MetricCard 
            title="Failure Rate" 
            value={`${(metrics.failure_rate ?? 0).toFixed(2)}%`} 
            icon={<AlertTriangle className="h-6 w-6 text-muted-foreground" />} 
          />
          <MetricCard 
            title="Hallucination Rate" 
            value={`${(metrics.hallucination_rate ?? 0).toFixed(2)}%`} 
            icon={<CheckCircle className="h-6 w-6 text-muted-foreground" />} 
          />
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Failure Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No failure data to display.</p>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

function MetricCard({ title, value, icon, description }: { title: string, value: string | number, icon: React.ReactNode, description?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  )
}



