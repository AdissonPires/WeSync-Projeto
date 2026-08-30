"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { TurnoverReason } from "@/lib/services/ai-analytics";

const COLORS = ["#00FBCF", "#005C61", "#0EA5E9", "#F59E0B", "#EF4444", "#A78BFA"];

export function TurnoverChart({ reasons }: { reasons: TurnoverReason[] }) {
  if (reasons.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-brand-muted">
        Sem dados suficientes para gerar o gráfico.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={reasons}
          dataKey="percent"
          nameKey="label"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
        >
          {reasons.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="#00181A" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "#002428",
            border: "1px solid #003D42",
            borderRadius: 8,
            color: "#ffffff",
            fontSize: 12,
          }}
          formatter={(value) => [`${value}%`, "Percentual"]}
        />
        <Legend
          verticalAlign="bottom"
          height={60}
          wrapperStyle={{ fontSize: 12, color: "#94A3B8" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
