"use client"

import { useQuery } from "@tanstack/react-query"
import { getTestRuns } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function RecentActivity() {
  const { data: testRuns, isLoading } = useQuery({
    queryKey: ["testRuns"],
    queryFn: () => getTestRuns(),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-xs md:text-sm text-muted-foreground">Loading recent runs...</p>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {(testRuns || []).slice(0, 5).map((run) => (
              <div key={run.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                <div className="flex items-center space-x-3 md:space-x-4">
                  <Badge variant={run.status === 'COMPLETED' ? 'default' : 'outline'} className="text-xs">{run.status}</Badge>
                  <div>
                    <p className="font-semibold text-sm md:text-base">Run #{run.id}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">{run.model_name}</p>
                  </div>
                </div>
                <Button asChild variant="secondary" size="sm" className="self-start sm:self-auto">
                  <Link href={`/runs/${run.id}`}>View Details</Link>
                </Button>
              </div>
            ))}
            {(!testRuns || testRuns.length === 0) && (
                <p className="text-xs md:text-sm text-muted-foreground">No test runs found.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
