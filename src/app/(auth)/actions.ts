"use server";

import { signIn, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, organizations, memberships, stores, ticketStatuses } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { generateSlug } from "@/lib/utils";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { sendNewRegistrationEmail } from "@/lib/email";

const registerSchema = z.object({
  name: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
  email: z.string().email("Email non valida"),
  password: z.string().min(8, "La password deve avere almeno 8 caratteri"),
  shopName: z.string().min(2, "Il nome del negozio deve avere almeno 2 caratteri"),
});

type RegisterState = {
  errors?: { name?: string[]; email?: string[]; password?: string[]; shopName?: string[]; _form?: string[] };
} | null;

export async function registerAction(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { name, email, password, shopName } = parsed.data;

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    return { errors: { email: ["Questa email è già registrata."] } };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({ email, name, passwordHash })
        .returning({ id: users.id });

      const slug = generateSlug(shopName);
      const [org] = await tx
        .insert(organizations)
        .values({
          name: shopName,
          slug,
          plan: "start",
          registrationStatus: "pending",
          subscriptionStatus: "trial",
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        })
        .returning({ id: organizations.id });

      await tx.insert(memberships).values({
        userId: user.id,
        organizationId: org.id,
        role: "owner",
      });

      await tx.insert(stores).values({
        organizationId: org.id,
        name: shopName,
        isDefault: true,
      });

      const defaultStatuses = [
        { name: "In attesa", color: "#6B7280", sortOrder: 0, isDefault: true },
        { name: "Diagnosi", color: "#F59E0B", sortOrder: 1 },
        { name: "In riparazione", color: "#3B82F6", sortOrder: 2 },
        { name: "Pronto", color: "#10B981", sortOrder: 3 },
        { name: "Consegnato", color: "#8B5CF6", sortOrder: 4, isFinal: true },
      ];
      await tx.insert(ticketStatuses).values(
        defaultStatuses.map((s) => ({ ...s, organizationId: org.id })),
      );
    });
  } catch {
    return { errors: { _form: ["Errore durante la registrazione. Riprova."] } };
  }

  // Fire-and-forget: non blocca il signup se SMTP non è configurato
  const [newUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  const [newOrg] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .innerJoin(memberships, eq(memberships.organizationId, organizations.id))
    .where(eq(memberships.userId, newUser.id))
    .limit(1);

  sendNewRegistrationEmail({
    shopName,
    ownerName: name,
    ownerEmail: email,
    orgId: newOrg.id,
  }).catch(() => {});

  await signIn("credentials", { email, password, redirectTo: "/pending" });
  return null;
}

const loginSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(1, "Inserisci la password"),
});

type LoginState = { error?: string } | null;

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Dati non validi." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email o password non corretti." };
    }
    throw error;
  }
  return null;
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function completeOnboardingAction(formData: FormData) {
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const shopName = formData.get("shopName") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const city = formData.get("city") as string;
  const brandingColor = formData.get("brandingPrimaryColor") as string;

  await db
    .update(organizations)
    .set({
      name: shopName || undefined,
      phone: phone || undefined,
      address: address || undefined,
      city: city || undefined,
      brandingPrimaryColor: brandingColor || undefined,
      onboardingCompletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, session.user.organizationId));

  redirect("/dashboard");
}
