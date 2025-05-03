"use client"

import { Calendar, CheckCircle, Clock, FileText, MessageSquare, XCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface ProjectStats {
  progress: number
  totalSteps: number
  completedSteps: number
  totalDeliverables: number
  approvedDeliverables: number
  rejectedDeliverables: number
  totalComments: number
  clientComments: number
  designerComments: number
  totalFiles: number
  clientFiles: number
  designerFiles: number
  daysLeft: number
  startDate: string
  endDate: string
}

export function ProjectStats({ stats }: { stats: ProjectStats }) {
  // Console log pour debug
  console.log("ProjectStats rendering with data:", stats);

  // Calculate approval rate
  const deliverablesApprovalRate = stats.totalDeliverables
    ? Math.round((stats.approvedDeliverables / stats.totalDeliverables) * 100)
    : 0

  // Calculate comment percentages
  const clientCommentsPercentage = stats.totalComments
    ? Math.round((stats.clientComments / stats.totalComments) * 100)
    : 0
  const designerCommentsPercentage = stats.totalComments
    ? Math.round((stats.designerComments / stats.totalComments) * 100)
    : 0

  // Format dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="w-full max-h-[calc(100vh-6rem)] overflow-y-auto pb-8">
      <div className="px-4 py-4 border-b sticky top-0 bg-background z-10 w-full">
        <h2 className="text-xl font-semibold">Project Statistics</h2>
        <p className="text-sm text-muted-foreground">Track the progress of your project</p>
      </div>

      <div className="p-4 grid gap-8 w-full">
        {/* Overview Cards */}
        <section className="w-full">
          <h3 className="text-lg font-semibold mb-4">Overview</h3>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full">
            <Card className="w-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  Project Progress
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.progress}%</div>
                <Progress value={stats.progress} className="h-2 mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.completedSteps} of {stats.totalSteps} milestones completed
                </p>
              </CardContent>
            </Card>

            <Card className="w-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  Time Remaining
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.daysLeft} days</div>
                <p className="text-xs text-muted-foreground mt-2">Due date: {formatDate(stats.endDate)}</p>
              </CardContent>
            </Card>

            <Card className="w-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  Deliverables
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalDeliverables}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.approvedDeliverables} approved, {stats.rejectedDeliverables} rejected
                </p>
              </CardContent>
            </Card>

            <Card className="w-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  Comments
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalComments}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.clientComments} from you, {stats.designerComments} from designer
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Timeline and Files */}
        <section className="grid gap-4 grid-cols-1 lg:grid-cols-2 w-full">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Project Timeline</CardTitle>
              <CardDescription>Project duration and milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Start Date</p>
                    <p className="text-sm text-muted-foreground">{formatDate(stats.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">End Date</p>
                    <p className="text-sm text-muted-foreground">{formatDate(stats.endDate)}</p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span className="font-medium">{stats.progress}%</span>
                  </div>
                  <Progress value={stats.progress} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Milestones</span>
                    <span className="font-medium">
                      {stats.completedSteps}/{stats.totalSteps}
                    </span>
                  </div>
                  <Progress value={(stats.completedSteps / stats.totalSteps) * 100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="w-full">
            <CardHeader>
              <CardTitle>Files & Documents</CardTitle>
              <CardDescription>Shared files and documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Total Files</p>
                    <p className="text-2xl font-bold">{stats.totalFiles}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500" />
                      <p className="text-sm">Your files: {stats.clientFiles}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-teal-500" />
                      <p className="text-sm">Designer files: {stats.designerFiles}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span>Your Files</span>
                    <span>{stats.totalFiles ? Math.round((stats.clientFiles / stats.totalFiles) * 100) : 0}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${stats.totalFiles ? (stats.clientFiles / stats.totalFiles) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span>Designer Files</span>
                    <span>{stats.totalFiles ? Math.round((stats.designerFiles / stats.totalFiles) * 100) : 0}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-teal-500"
                      style={{
                        width: `${stats.totalFiles ? (stats.designerFiles / stats.totalFiles) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Deliverables Section */}
        <section className="w-full">
          <h3 className="text-lg font-semibold mb-4">Deliverables</h3>
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 w-full">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Deliverables Status</CardTitle>
                <CardDescription>Overview of all deliverables</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex flex-col">
                    <span className="text-3xl font-bold">{stats.totalDeliverables}</span>
                    <span className="text-sm text-muted-foreground">Total Deliverables</span>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xl font-bold">{stats.approvedDeliverables}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Approved</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1 text-amber-600">
                        <Clock className="h-4 w-4" />
                        <span className="text-xl font-bold">
                          {stats.totalDeliverables - stats.approvedDeliverables - stats.rejectedDeliverables}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">Pending</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1 text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span className="text-xl font-bold">{stats.rejectedDeliverables}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Rejected</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span>Approval Rate</span>
                    <span className="font-medium">{deliverablesApprovalRate}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${deliverablesApprovalRate}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="w-full">
              <CardHeader>
                <CardTitle>Milestone Progress</CardTitle>
                <CardDescription>Progress through project milestones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex flex-col">
                    <span className="text-3xl font-bold">{stats.totalSteps}</span>
                    <span className="text-sm text-muted-foreground">Total Milestones</span>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xl font-bold">{stats.completedSteps}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Completed</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1 text-amber-600">
                        <Clock className="h-4 w-4" />
                        <span className="text-xl font-bold">{stats.totalSteps - stats.completedSteps}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Remaining</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span>Completion Rate</span>
                    <span className="font-medium">
                      {stats.totalSteps ? Math.round((stats.completedSteps / stats.totalSteps) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{
                        width: `${stats.totalSteps ? (stats.completedSteps / stats.totalSteps) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Communication Section */}
        <section className="w-full">
          <h3 className="text-lg font-semibold mb-4">Communication</h3>
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 w-full">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Comments Overview</CardTitle>
                <CardDescription>Communication between you and the designer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex flex-col">
                    <span className="text-3xl font-bold">{stats.totalComments}</span>
                    <span className="text-sm text-muted-foreground">Total Comments</span>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span className="text-xl font-bold">{stats.clientComments}</span>
                      <span className="text-xs text-muted-foreground">From You</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-xl font-bold">{stats.designerComments}</span>
                      <span className="text-xs text-muted-foreground">From Designer</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-sm">
                      <span>Your Comments</span>
                      <span className="font-medium">{clientCommentsPercentage}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${clientCommentsPercentage}%` }} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-sm">
                      <span>Designer Comments</span>
                      <span className="font-medium">{designerCommentsPercentage}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-teal-500" style={{ width: `${designerCommentsPercentage}%` }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="w-full">
              <CardHeader>
                <CardTitle>File Sharing</CardTitle>
                <CardDescription>Files shared between you and the designer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex flex-col">
                    <span className="text-3xl font-bold">{stats.totalFiles}</span>
                    <span className="text-sm text-muted-foreground">Total Files</span>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span className="text-xl font-bold">{stats.clientFiles}</span>
                      <span className="text-xs text-muted-foreground">Your Files</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-xl font-bold">{stats.designerFiles}</span>
                      <span className="text-xs text-muted-foreground">Designer Files</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-sm">
                      <span>Your Files</span>
                      <span className="font-medium">
                        {stats.totalFiles ? Math.round((stats.clientFiles / stats.totalFiles) * 100) : 0}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: `${stats.totalFiles ? (stats.clientFiles / stats.totalFiles) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-sm">
                      <span>Designer Files</span>
                      <span className="font-medium">
                        {stats.totalFiles ? Math.round((stats.designerFiles / stats.totalFiles) * 100) : 0}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-teal-500"
                        style={{
                          width: `${stats.totalFiles ? (stats.designerFiles / stats.totalFiles) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
} 