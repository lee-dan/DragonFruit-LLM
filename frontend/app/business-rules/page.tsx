import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { BusinessRulesManager } from "@/components/business-rules/business-rules-manager"

export default function BusinessRulesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Business Rules & Constraints</h1>
        <p className="text-muted-foreground">
          Define and manage business rules, safety constraints, and compliance requirements for your AI models.
        </p>
        <BusinessRulesManager />
      </div>
    </DashboardLayout>
  )
}
