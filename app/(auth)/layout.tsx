import { Sparkles } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-bg px-4 py-12">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary/10">
          <Sparkles className="h-4.5 w-4.5 text-brand-primary" />
        </div>
        <span className="text-xl font-semibold tracking-tight text-brand-text">WSync</span>
        <span className="ml-1 text-xs text-brand-muted">por wedpp</span>
      </div>
      {children}
    </div>
  );
}
