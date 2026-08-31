import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { getSessionUser } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  // O middleware já bloqueia isso — este redirect é uma segunda camada de defesa.
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen w-full bg-brand-bg">
      <Sidebar role={user.role} orgName={user.orgName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
