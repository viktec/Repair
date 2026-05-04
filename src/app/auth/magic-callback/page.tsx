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
  } catch {
    // signIn lancia un redirect — se arriviamo qui c'è un errore
    redirect("/login?error=link_scaduto");
  }

  // Non raggiunto — signIn redirige sempre
  redirect(redirectTo);
}
