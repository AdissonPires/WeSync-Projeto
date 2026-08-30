import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { TableSkeleton } from "@/components/ui/table-skeleton";

export default function ComplianceLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-4 w-96" />
      <Card>
        <CardContent className="flex flex-col gap-3 p-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
      <TableSkeleton rows={4} />
    </div>
  );
}
