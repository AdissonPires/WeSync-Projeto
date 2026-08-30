"use client";

import { useOptimistic, useTransition } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { PendingTask } from "@prisma/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toggleTask } from "@/app/actions/offboarding";
import { cn } from "@/lib/utils";

export function TasksWidget({ tasks }: { tasks: PendingTask[] }) {
  const [isPending, startTransition] = useTransition();
  const [optimisticTasks, setOptimisticTasks] = useOptimistic(
    tasks,
    (state, updated: { id: string; done: boolean }) =>
      state.map((t) => (t.id === updated.id ? { ...t, done: updated.done } : t))
  );

  function handleToggle(taskId: string, done: boolean) {
    startTransition(async () => {
      setOptimisticTasks({ id: taskId, done });
      const result = await toggleTask(taskId, done);
      if (!result.success) {
        toast.error(result.error ?? "Não foi possível atualizar a tarefa.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-brand-text text-base font-semibold">
          Tarefas Pendentes & Alertas
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-0">
        {optimisticTasks.length === 0 && (
          <p className="text-sm text-brand-muted">Nenhuma tarefa pendente.</p>
        )}
        {optimisticTasks.map((task) => (
          <label
            key={task.id}
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-brand-border p-3 hover:bg-brand-bg/40"
          >
            <Checkbox
              checked={task.done}
              disabled={isPending}
              onCheckedChange={(checked) => handleToggle(task.id, checked === true)}
              className="mt-0.5"
            />
            <div className="min-w-0">
              <p
                className={cn(
                  "flex items-center gap-1.5 text-sm font-medium text-brand-text",
                  task.done && "text-brand-muted line-through"
                )}
              >
                {task.urgent && !task.done && (
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                )}
                {task.title}
              </p>
              <p className="mt-0.5 text-xs text-brand-muted">{task.description}</p>
            </div>
          </label>
        ))}
      </CardContent>
    </Card>
  );
}
