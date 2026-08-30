import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/ui/table-skeleton";

export default function LegalLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-4 w-96" />
      <Skeleton className="h-9 w-72" />
      <TableSkeleton rows={5} />
    </div>
  );
}
