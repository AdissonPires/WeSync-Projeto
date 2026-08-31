import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { authConfig } from "./auth.config";

const providers: Provider[] = [
  Credentials({
    credentials: { email: {}, password: {} },
    authorize: async (credentials) => {
      const parsed = loginSchema.safeParse(credentials);
      if (!parsed.success) return null;

      // Inclui a organização na mesma consulta — evita uma segunda ida ao banco
      // só para o nome, que fica cravado no JWT e não é buscado de novo a cada
      // navegação (ver callback `jwt` abaixo e `lib/auth/session.ts`).
      const user = await prisma.user.findUnique({
        where: { email: parsed.data.email },
        include: { org: { select: { name: true } } },
      });
      if (!user || !user.passwordHash) return null;

      const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
      if (!valid) return null;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        orgId: user.orgId,
        orgName: user.org.name,
      };
    },
  }),
];

// OAuth só é ativado quando as credenciais reais do provedor estão configuradas.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

if (
  process.env.AZURE_AD_CLIENT_ID &&
  process.env.AZURE_AD_CLIENT_SECRET &&
  process.env.AZURE_AD_TENANT_ID
) {
  providers.push(
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async jwt(params) {
      const token = await authConfig.callbacks!.jwt!(params);
      if (!token) return token;
      // Login via credenciais já resolve orgName em authorize() (ver acima); só
      // busca aqui no primeiro login OAuth, quando `user` não trouxe orgName.
      if (params.user && !(params.user as { orgName?: string }).orgName) {
        const org = await prisma.organization.findUnique({
          where: { id: (params.user as { orgId?: string }).orgId },
          select: { name: true },
        });
        token.orgName = org?.name;
      }
      return token;
    },
    async signIn({ user, account }) {
      // Login via OAuth só é permitido para usuários já provisionados pelo RH/TI
      // da organização (evita que qualquer conta Google/Microsoft externa entre
      // automaticamente em um tenant).
      if (account?.provider !== "credentials") {
        const existing = await prisma.user.findUnique({ where: { email: user.email! } });
        return !!existing;
      }
      return true;
    },
  },
});
