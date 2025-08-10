"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, TestTube2, ArrowRight, GitBranch } from "lucide-react"
import Link from "next/link"

const workflowSteps = [
  {
    icon: FileText,
    title: "1. Define Constraints",
    description: "Set non-negotiable business rules and safety policies.",
    href: "/models",
  },
  {
    icon: TestTube2,
    title: "2. Test & Benchmark",
    description: "Generate and run adversarial test cases against your model.",
    href: "/runs",
  },
  {
    icon: GitBranch,
    title: "3. Improve & Integrate",
    description: "Log violations and feed insights back into your workflow.",
    href: "/analytics",
  },
]

export function WorkflowDiagram() {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 md:space-y-0 md:flex-row md:space-x-6">
      {workflowSteps.map((step, index) => (
        <React.Fragment key={step.title}>
          <Link href={step.href} className="w-full md:w-1/3">
            <Card className="h-full transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="flex flex-col items-center p-4 md:p-6 text-center">
                <div className="mb-3 md:mb-4 flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <step.icon className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <h3 className="mb-2 text-base md:text-lg font-semibold leading-tight">{step.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          </Link>
          {index < workflowSteps.length - 1 && (
            <ArrowRight className="hidden h-6 w-6 md:h-8 md:w-8 text-muted-foreground md:block" />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
