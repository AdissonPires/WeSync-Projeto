import { Skeleton } from "@/components/ui/skeleton";
import { CardGridSkeleton } from "@/components/ui/table-skeleton";

export default function IntegrationsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-4 w-96" />
      <Skeleton className="h-9 w-64" />
      <CardGridSkeleton items={6} />
    </div>
  );
}
