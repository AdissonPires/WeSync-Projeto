import { auth } from "@/auth";

export type SessionUser = {
  id: string;
  name?: string | null;
  email: string;
  role: "ADMIN" | "IT_ADMIN" | "HR_MANAGER" | "EMPLOYEE";
  orgId: string;
  /// Cravado no JWT no login — lendo daqui evita uma consulta ao banco em
  /// toda navegação só para exibir o nome da empresa na sidebar.
  orgName: string;
};

/** Retorna o usuário logado (ou null) — uso em Server Actions e Server Components. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id || !session.user.orgId) return null;
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email!,
    role: session.user.role as SessionUser["role"],
    orgId: session.user.orgId,
    orgName: session.user.orgName || "Sua empresa",
  };
}

const ROLE_LABEL: Record<SessionUser["role"], string> = {
  ADMIN: "Administrador",
  IT_ADMIN: "Administrador de TI",
  HR_MANAGER: "Gestor de RH",
  EMPLOYEE: "Colaborador",
};

export function roleLabel(role: SessionUser["role"]) {
  return ROLE_LABEL[role];
}

export function canManageIntegrations(role: SessionUser["role"]) {
  return role === "ADMIN" || role === "IT_ADMIN";
}
