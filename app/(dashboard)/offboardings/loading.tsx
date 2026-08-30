import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function OffboardingsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-80" />
        <Skeleton className="h-10 w-44" />
      </div>
      <TableSkeleton rows={6} />
    </div>
  );
}
