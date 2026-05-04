import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const body = await request.json();
  const endpoint: string | undefined = body?.endpoint;

  if (!endpoint) {
    return NextResponse.json({ error: "endpoint mancante" }, { status: 400 });
  }

  await db
    .delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.endpoint, endpoint),
        eq(pushSubscriptions.userId, session.user.id),
      ),
    );

  return NextResponse.json({ ok: true });
}
