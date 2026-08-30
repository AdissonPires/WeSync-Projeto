import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  progress?: number;
  sparkline?: number[];
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  progress,
  sparkline,
}: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-brand-muted">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-brand-text">{value}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary/10">
            <Icon className="h-4.5 w-4.5 text-brand-primary" />
          </div>
        </div>

        {trend && (
          <p
            className={cn(
              "mt-3 text-xs font-medium",
              trend.positive ? "text-emerald-400" : "text-red-400"
            )}
          >
            {trend.positive ? "↑" : "↓"} {trend.value}
          </p>
        )}

        {typeof progress === "number" && (
          <div className="mt-4 space-y-1.5">
            <Progress value={progress} />
            <p className="text-xs text-brand-muted">{progress}% em média</p>
          </div>
        )}

        {sparkline && (
          <div className="mt-4 flex h-8 items-end gap-1">
            {sparkline.map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-brand-secondary"
                style={{ height: `${v}%` }}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
