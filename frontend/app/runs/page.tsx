"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import { getTestRuns, deleteTestRun } from "@/lib/api"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { buttonVariants } from "@/components/ui/button"
import { CreateTestRunForm } from "@/components/forms/create-test-run-form"

interface TestRun {
  id: number
  model_name: string
  status: string
  created_at: string
  completed_at: string | null
}

const formatPST = (dateString: string | null) => {
  if (!dateString) return "N/A";
  return new Date(dateString + "Z").toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
};

export default function TestRunsPage() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null)
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: testRuns, isLoading, isError, error } = useQuery({
    queryKey: ["testRuns"],
    queryFn: getTestRuns,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTestRun,
    onSuccess: () => {
      toast.success("Test run deleted successfully.")
      queryClient.invalidateQueries({ queryKey: ["testRuns"] })
    },
    onError: (error) => {
      toast.error(`Failed to delete test run: ${error.message}`)
    },
  })

  const handleDeleteClick = (e: React.MouseEvent, runId: number) => {
    e.stopPropagation()
    setSelectedRunId(runId)
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    if (selectedRunId) {
      deleteMutation.mutate(selectedRunId)
      setShowDeleteDialog(false)
    }
  }

  useEffect(() => {
    // The refetch call is removed as the data is now managed by useQuery
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Test Runs</h1>
          <CreateTestRunForm />
        </div>
        <div>
          {isLoading ? (
            <p>Loading...</p>
          ) : isError ? (
            <p>Error: {error.message}</p>
          ) : testRuns.length === 0 ? (
            <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/20">
              <p className="text-muted-foreground">No test runs found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Completed At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testRuns.map((run) => (
                  <TableRow 
                    key={run.id} 
                    onClick={() => router.push(`/runs/${run.id}`)}
                    className="cursor-pointer"
                  >
                    <TableCell>{run.id}</TableCell>
                    <TableCell>{run.model_name}</TableCell>
                    <TableCell>{run.status}</TableCell>
                    <TableCell>{formatPST(run.created_at)}</TableCell>
                    <TableCell>{formatPST(run.completed_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={(e) => handleDeleteClick(e, run.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the test run and all of its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}



