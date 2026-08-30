import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function KnowledgeDetailLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-8 w-64" />
      </div>
      <Card>
        <CardContent className="flex flex-col gap-3 p-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" style={{ maxWidth: `${90 - i * 5}%` }} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
