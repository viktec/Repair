import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/app/(app)/settings/change-password-form";

export default async function AdminProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profilo</h1>
        <p className="mt-1 text-sm text-muted-foreground">{session.user.email}</p>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
