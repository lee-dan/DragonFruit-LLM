"use client"

import { useQuery } from "@tanstack/react-query";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getDashboardMetrics } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart as BarChartIcon,
  Lightbulb,
} from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { getDeveloperInsights } from "@/lib/api";

const COLORS = ["#FF8042", "#FFBB28", "#00C49F", "#0088FE", "#AF19FF"];

const FailureBreakdownChart = ({ data }: { data: { name: string; value: number }[] }) => {
  
  const totalFailures = useMemo(() => data.reduce((acc, item) => acc + item.value, 0), [data]);

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
        <h3 className="text-lg font-semibold">No Failures Detected</h3>
        <p className="text-sm text-muted-foreground">
          Congratulations! There is no failure data to display.
        </p>
      </div>
    );
  }

  const CustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul className="flex flex-col space-y-2 text-sm text-muted-foreground">
        {payload.map((entry: any, index: number) => {
          const { value, payload } = entry;
          const percentage = ((payload.value / totalFailures) * 100).toFixed(1);
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
              <span className="font-semibold">{payload.value} ({percentage}%)</span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-80">
      <div className="w-full h-full">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              innerRadius={80}
              outerRadius={110}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
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
        <CustomLegend payload={data.map((item, index) => ({
          value: item.name,
          color: COLORS[index % COLORS.length],
          payload: { value: item.value }
        }))} />
      </div>
    </div>
  );
};


export default function AnalyticsPage() {
  const {
    data: metrics,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["dashboardMetrics"],
    queryFn: getDashboardMetrics,
  });

  if (isLoading)
    return (
      <DashboardLayout>
        <p>Loading dashboard...</p>
      </DashboardLayout>
    );
  if (error)
    return (
      <DashboardLayout>
        <p>Error loading metrics: {error.message}</p>
      </DashboardLayout>
    );
  if (!metrics)
    return (
      <DashboardLayout>
        <p>No metrics available.</p>
      </DashboardLayout>
    );

  const chartData = metrics.failure_breakdown
    ? Object.entries(metrics.failure_breakdown).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Test Runs"
            value={metrics.total_runs?.toLocaleString() ?? "0"}
            icon={<BarChartIcon className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />}
            description={`${(
              metrics.total_test_cases ?? 0
            ).toLocaleString()} total tests`}
          />
          <MetricCard
            title="Active Runs"
            value={metrics.active_runs ?? "0"}
            icon={<Clock className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />}
          />
          <MetricCard
            title="Success Rate"
            value={`${(metrics.success_rate ?? 0).toFixed(2)}%`}
            icon={<CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />}
          />
          <MetricCard
            title="Hallucination Rate"
            value={`${(metrics.hallucination_rate ?? 0).toFixed(2)}%`}
            icon={<CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Failure Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <FailureBreakdownChart data={chartData} />
            </CardContent>
          </Card>
          <ActionableInsights />
        </div>
      </div>
    </DashboardLayout>
  );
}

const ActionableInsights = () => {
  const { data: insights, isLoading, error } = useQuery({
      queryKey: ["developerInsights"],
      queryFn: getDeveloperInsights,
  });

  if (isLoading) return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg md:text-xl">
          <Lightbulb className="mr-2 h-5 w-5 md:h-6 md:w-6 text-yellow-400" />
          Actionable Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-32 md:h-40">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
            <p className="text-xs md:text-sm text-muted-foreground">Loading insights...</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  if (error) {
    console.error("Insights error:", error);
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg md:text-xl">
            <Lightbulb className="mr-2 h-5 w-5 md:h-6 md:w-6 text-yellow-400" />
            Actionable Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 md:h-40">
            <div className="text-center">
              <AlertTriangle className="w-6 h-6 md:w-8 md:h-8 text-red-500 mx-auto mb-2" />
              <p className="text-xs md:text-sm text-red-600 font-medium">Error loading insights</p>
              <p className="text-xs text-muted-foreground mt-1">Check console for details</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg md:text-xl">
            <Lightbulb className="mr-2 h-5 w-5 md:h-6 md:w-6 text-yellow-400" />
            Actionable Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 md:h-40">
            <div className="text-center">
              <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-green-500 mx-auto mb-2" />
              <p className="text-xs md:text-sm text-muted-foreground">No insights available</p>
              <p className="text-xs text-muted-foreground mt-1">Run some tests to generate insights</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSeverityBadge = (severity: string) => {
      switch (severity.toLowerCase()) {
          case 'high':
              return "destructive";
          case 'medium':
              return "secondary";
          default:
              return "outline";
      }
  }

  return (
      <Card>
          <CardHeader>
              <CardTitle className="flex items-center text-lg md:text-xl">
                  <Lightbulb className="mr-2 h-5 w-5 md:h-6 md:w-6 text-yellow-400" />
                  Actionable Insights
              </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
              {insights.map((insight, index) => (
                  <div key={index} className="p-3 md:p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                          <h3 className="font-semibold text-base md:text-lg leading-tight">{insight.title}</h3>
                          <Badge variant={getSeverityBadge(insight.severity)} className="self-start sm:self-auto">{insight.severity}</Badge>
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground mb-2 leading-relaxed">{insight.description}</p>
                      <p className="text-xs md:text-sm">
                          <strong className="font-semibold">Recommendation:</strong> {insight.recommendation}
                      </p>
                  </div>
              ))}
          </CardContent>
      </Card>
  );
};

function MetricCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs md:text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-xl md:text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}



