import type { NextAuthConfig } from "next-auth";

/**
 * Configuração "Edge-safe" — sem Prisma nem bcrypt — usada tanto pelo
 * middleware (que roda no Edge Runtime) quanto pela config completa em
 * auth.ts. Middleware só precisa verificar o JWT da sessão, não acessar o
 * banco, então este arquivo nunca deve importar módulos Node-only.
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role ?? "EMPLOYEE";
        token.orgId = (user as { orgId?: string }).orgId ?? "";
        // Presente apenas no login por credenciais (ver authorize() em auth.ts);
        // o login OAuth preenche isso depois, no override do jwt callback em auth.ts.
        const orgName = (user as { orgName?: string }).orgName;
        if (orgName) token.orgName = orgName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.orgId = token.orgId as string;
        session.user.orgName = (token.orgName as string) ?? "Sua empresa";
      }
      return session;
    },
  },
};
