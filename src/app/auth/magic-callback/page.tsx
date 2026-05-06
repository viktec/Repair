import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";

interface Props {
  searchParams: Promise<{ token?: string; next?: string }>;
}

export default async function MagicCallbackPage({ searchParams }: Props) {
  const { token, next } = await searchParams;

  if (!token) {
    redirect("/login?error=token_mancante");
  }

  const redirectTo = next && next.startsWith("/") ? next : "/dashboard";

  try {
    await signIn("magic", { token, redirectTo });
  } catch (e) {
    // Next.js usa un'eccezione interna per i redirect — va rilanciata
    if ((e as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    redirect("/login?error=link_scaduto");
  }

  redirect(redirectTo);
}
