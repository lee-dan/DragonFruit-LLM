"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function ModelsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Models</h1>
        <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/20">
          <p className="text-muted-foreground">Models will be displayed here.</p>
        </div>
      </div>
    </DashboardLayout>
  )
}



