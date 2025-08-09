"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { MetricsOverview } from "@/components/dashboard/metrics-overview"

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <MetricsOverview />
      </div>
    </DashboardLayout>
  )
}