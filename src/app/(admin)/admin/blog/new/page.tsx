import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlogForm } from "../[id]/blog-form";

export default async function NewBlogPostPage() {
  const session = await auth();
  if (!(session?.user as { isSuperAdmin?: boolean })?.isSuperAdmin) redirect("/dashboard");

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Link href="/admin/blog">
        <Button variant="ghost" size="sm" className="gap-1.5 -ml-2">
          <ArrowLeft className="h-3.5 w-3.5" /> Blog
        </Button>
      </Link>
      <BlogForm post={null} />
    </div>
  );
}
