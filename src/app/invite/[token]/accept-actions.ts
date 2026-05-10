"use server";

import { db } from "@/lib/db";
import { users, memberships, organizationInvites } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

export type AcceptState = { error?: string; success?: string } | null;

// Logged-in user accepts invite
export async function acceptInviteAction(token: string): Promise<AcceptState> {
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?next=/invite/${token}`);

  const [invite] = await db
    .select()
    .from(organizationInvites)
    .where(and(eq(organizationInvites.token, token), gt(organizationInvites.expiresAt, new Date())))
    .limit(1);

  if (!invite) return { error: "Invito non valido o scaduto." };

  const userEmail = session.user.email?.toLowerCase();
  if (userEmail !== invite.email.toLowerCase()) {
    return { error: `Questo invito è per ${invite.email}. Sei loggato con un account diverso.` };
  }

  // Check not already a member
  const [existing] = await db
    .select({ userId: memberships.userId })
    .from(memberships)
    .where(and(eq(memberships.userId, session.user.id), eq(memberships.organizationId, invite.organizationId)))
    .limit(1);

  if (!existing) {
    await db.insert(memberships).values({
      userId: session.user.id,
      organizationId: invite.organizationId,
      role: invite.role,
    });
  }

  await db.delete(organizationInvites).where(eq(organizationInvites.id, invite.id));
  revalidatePath("/settings/team");
  redirect("/dashboard");
}

// New user creates account to accept invite
export async function registerAndAcceptAction(
  token: string,
  _prev: AcceptState,
  formData: FormData,
): Promise<AcceptState> {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const password = formData.get("password") as string | null;

  if (!name) return { error: "Nome obbligatorio" };
  if (!password || password.length < 8) return { error: "Password minima 8 caratteri" };

  const [invite] = await db
    .select()
    .from(organizationInvites)
    .where(and(eq(organizationInvites.token, token), gt(organizationInvites.expiresAt, new Date())))
    .limit(1);

  if (!invite) return { error: "Invito non valido o scaduto." };

  // Check email not already taken
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, invite.email))
    .limit(1);

  if (existing) return { error: "Esiste già un account con questa email. Accedi per accettare l'invito." };

  const passwordHash = await bcrypt.hash(password, 13);

  const [newUser] = await db
    .insert(users)
    .values({ email: invite.email, name, passwordHash, isSuperAdmin: false })
    .returning({ id: users.id });

  await db.insert(memberships).values({
    userId: newUser.id,
    organizationId: invite.organizationId,
    role: invite.role,
  });

  await db.delete(organizationInvites).where(eq(organizationInvites.id, invite.id));

  return { success: "Account creato! Accedi con la tua email e password." };
}
