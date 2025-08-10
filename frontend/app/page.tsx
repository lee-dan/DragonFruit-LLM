"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { MetricsOverview } from "@/components/dashboard/metrics-overview"
import { WorkflowDiagram } from "@/components/dashboard/workflow-diagram"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        
        <MetricsOverview />

        <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl font-bold tracking-tight">Start Your Workflow</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 md:pt-6">
              <WorkflowDiagram />
            </CardContent>
          </Card>
          <div className="lg:col-span-1">
            <RecentActivity />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}