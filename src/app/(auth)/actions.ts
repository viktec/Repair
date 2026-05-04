"use server";

import { signIn, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, organizations, memberships, stores, ticketStatuses } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { generateSlug } from "@/lib/utils";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { sendNewRegistrationEmail, sendPasswordResetEmail, sendTrialExpiryEmail } from "@/lib/email";

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

  const [user] = await db
    .select({ id: users.id, isSuperAdmin: users.isSuperAdmin })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  // Check trial expiry reminder (only send once, 3 days before)
  if (user) {
    const [membership] = await db
      .select({ organizationId: memberships.organizationId })
      .from(memberships)
      .where(eq(memberships.userId, user.id))
      .limit(1);

    if (membership?.organizationId) {
      const [org] = await db
        .select({
          name: organizations.name,
          subscriptionStatus: organizations.subscriptionStatus,
          trialEndsAt: organizations.trialEndsAt,
          trialReminderSentAt: organizations.trialReminderSentAt,
        })
        .from(organizations)
        .where(eq(organizations.id, membership.organizationId))
        .limit(1);

      if (
        org?.subscriptionStatus === "trial" &&
        org.trialEndsAt &&
        !org.trialReminderSentAt
      ) {
        const daysLeft = Math.ceil((org.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysLeft > 0 && daysLeft <= 3) {
          await db
            .update(organizations)
            .set({ trialReminderSentAt: new Date() })
            .where(eq(organizations.id, membership.organizationId));
          sendTrialExpiryEmail({
            to: parsed.data.email,
            shopName: org.name,
            daysLeft,
          }).catch(() => {});
        }
      }
    }
  }

  const redirectTo = user?.isSuperAdmin ? "/admin" : "/dashboard";

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo,
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

export async function forgotPasswordAction(
  _prev: { ok?: boolean; error?: string } | null,
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const email = (formData.get("email") as string)?.toLowerCase().trim();
  if (!email) return { error: "Email obbligatoria" };

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);

  if (user) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 ora

    await db.update(users).set({
      passwordResetToken: hashedToken,
      passwordResetExpiresAt: expiresAt,
      updatedAt: new Date(),
    }).where(eq(users.id, user.id));

    await sendPasswordResetEmail({ to: email, token: rawToken });
  }

  // Sempre ok per non rivelare se email esiste
  return { ok: true };
}

export async function resetPasswordAction(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;

  if (!token) return { error: "Token mancante" };
  if (!password || password.length < 8) return { error: "Password troppo corta (min 8 caratteri)" };
  if (password !== confirm) return { error: "Le password non coincidono" };

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const [user] = await db.select({
    id: users.id,
    passwordResetExpiresAt: users.passwordResetExpiresAt,
  }).from(users).where(eq(users.passwordResetToken, hashedToken)).limit(1);

  if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
    return { error: "Link non valido o scaduto. Richiedine uno nuovo." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.update(users).set({
    passwordHash,
    passwordResetToken: null,
    passwordResetExpiresAt: null,
    updatedAt: new Date(),
  }).where(eq(users.id, user.id));

  redirect("/login");
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
