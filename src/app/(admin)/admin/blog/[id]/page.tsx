import { db } from "@/lib/db";
import { blogPosts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlogForm } from "./blog-form";

export default async function BlogPostEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!(session?.user as { isSuperAdmin?: boolean })?.isSuperAdmin) redirect("/dashboard");

  const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
  if (!post) notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Link href="/admin/blog">
        <Button variant="ghost" size="sm" className="gap-1.5 -ml-2">
          <ArrowLeft className="h-3.5 w-3.5" /> Blog
        </Button>
      </Link>
      <BlogForm post={post} />
    </div>
  );
}
