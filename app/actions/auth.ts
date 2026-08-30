"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { auth, signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { loginSchema, registerSchema } from "@/lib/validations";

export async function loginAction(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    return ok();
  } catch (error) {
    if (error instanceof AuthError) {
      return fail("E-mail ou senha inválidos.");
    }
    console.error(error);
    return fail("Não foi possível entrar. Tente novamente.");
  }
}

export async function registerAction(input: unknown): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) return fail("Já existe uma conta com este e-mail.");

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({ data: { name: parsed.data.orgName } });
      await tx.user.create({
        data: {
          orgId: org.id,
          name: parsed.data.name,
          email: parsed.data.email,
          passwordHash,
          role: "ADMIN",
        },
      });
    });

    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    return ok();
  } catch (error) {
    console.error(error);
    return fail("Não foi possível criar sua conta. Tente novamente.");
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirect: false });
}

export async function getCurrentSession() {
  return auth();
}
