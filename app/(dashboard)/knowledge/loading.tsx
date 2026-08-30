import { Skeleton } from "@/components/ui/skeleton";
import { CardGridSkeleton } from "@/components/ui/table-skeleton";

export default function KnowledgeLoading() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-4 w-96" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-32" />
        <CardGridSkeleton items={3} />
      </div>
    </div>
  );
}
