import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "./db";
import { users, memberships } from "@/db/schema";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      organizationId: string | null;
      role: string | null;
      isSuperAdmin: boolean;
    } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      id: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user?.passwordHash) return null;
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        const [membership] = await db
          .select({ organizationId: memberships.organizationId, role: memberships.role })
          .from(memberships)
          .where(eq(memberships.userId, user.id))
          .limit(1);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          organizationId: membership?.organizationId ?? null,
          role: membership?.role ?? null,
          isSuperAdmin: user.isSuperAdmin,
        };
      },
    }),
    Credentials({
      id: "magic",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        const rawToken = credentials?.token as string | undefined;
        if (!rawToken) return null;

        const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

        const [user] = await db
          .select()
          .from(users)
          .where(
            and(
              eq(users.magicLinkToken, hashedToken),
              gt(users.magicLinkExpiresAt, new Date()),
            )
          )
          .limit(1);

        if (!user) return null;

        // Invalida token — uso singolo
        await db.update(users).set({
          magicLinkToken: null,
          magicLinkExpiresAt: null,
          updatedAt: new Date(),
        }).where(eq(users.id, user.id));

        const [membership] = await db
          .select({ organizationId: memberships.organizationId, role: memberships.role })
          .from(memberships)
          .where(eq(memberships.userId, user.id))
          .limit(1);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          organizationId: membership?.organizationId ?? null,
          role: membership?.role ?? null,
          isSuperAdmin: user.isSuperAdmin,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.organizationId = (user as { organizationId?: string | null }).organizationId ?? null;
        token.role = (user as { role?: string | null }).role ?? null;
        token.isSuperAdmin = (user as { isSuperAdmin?: boolean }).isSuperAdmin ?? false;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.organizationId = (token.organizationId as string | null) ?? null;
      session.user.role = (token.role as string | null) ?? null;
      session.user.isSuperAdmin = (token.isSuperAdmin as boolean) ?? false;
      return session;
    },
  },
});
