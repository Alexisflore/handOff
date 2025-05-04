import { Skeleton } from "@/components/ui/skeleton"

export function LoadingSkeleton() {
  return (
    <div className="flex h-screen w-full bg-white">
      <div className="hidden md:flex w-64 flex-col border-r bg-white">
        <div className="p-4 border-b">
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
        <div className="p-4 border-b">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="p-4 flex-1">
          <Skeleton className="h-4 w-1/3 mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      </div>
      <div className="flex-1 p-4">
        <Skeleton className="h-9 w-96 mb-4" />
        <Skeleton className="h-32 w-full mb-4" />
        <div className="flex flex-col lg:flex-row gap-4">
          <Skeleton className="h-96 w-full lg:w-2/3" />
          <Skeleton className="h-96 w-full lg:w-1/3" />
        </div>
      </div>
    </div>
  )
} 