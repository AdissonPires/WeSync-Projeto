import { Skeleton } from "@/components/ui/skeleton";
import { CardGridSkeleton } from "@/components/ui/table-skeleton";

export default function TemplatesLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-4 w-96" />
      <CardGridSkeleton items={6} />
    </div>
  );
}
