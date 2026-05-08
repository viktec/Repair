"use server";

import { db } from "@/lib/db";
import { blogPosts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function requireSuperAdmin() {
  const session = await auth();
  if (!(session?.user as { isSuperAdmin?: boolean })?.isSuperAdmin) redirect("/dashboard");
}

function parseFormData(formData: FormData) {
  const title = (formData.get("title") as string).trim();
  const slug = (formData.get("slug") as string).trim();
  const category = (formData.get("category") as string).trim();
  const excerpt = (formData.get("excerpt") as string).trim();
  const readMin = parseInt(formData.get("readMin") as string, 10) || 5;
  const intro = (formData.get("intro") as string).trim();
  const sectionsRaw = formData.get("sections") as string;
  const sections = JSON.parse(sectionsRaw || "[]");
  const cta = ((formData.get("cta") as string) || "").trim() || null;
  const seoTitle = ((formData.get("seoTitle") as string) || "").trim() || null;
  const seoDescription = ((formData.get("seoDescription") as string) || "").trim() || null;
  const seoKeywords = ((formData.get("seoKeywords") as string) || "").trim() || null;
  return { title, slug, category, excerpt, readMin, intro, sections, cta, seoTitle, seoDescription, seoKeywords };
}

export async function createBlogPostAction(formData: FormData): Promise<{ error?: string }> {
  await requireSuperAdmin();
  const data = parseFormData(formData);
  if (!data.title || !data.slug) return { error: "Titolo e slug sono obbligatori." };

  try {
    const [post] = await db.insert(blogPosts).values({
      ...data,
      status: "draft",
      updatedAt: new Date(),
    }).returning({ id: blogPosts.id });
    revalidatePath("/admin/blog");
    redirect(`/admin/blog/${post.id}`);
  } catch {
    return { error: "Slug già in uso. Scegli uno slug diverso." };
  }
}

export async function updateBlogPostAction(id: string, formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  await requireSuperAdmin();
  const data = parseFormData(formData);
  if (!data.title || !data.slug) return { error: "Titolo e slug sono obbligatori." };

  try {
    await db.update(blogPosts).set({ ...data, updatedAt: new Date() }).where(eq(blogPosts.id, id));
  } catch {
    return { error: "Slug già in uso. Scegli uno slug diverso." };
  }

  revalidatePath("/admin/blog");
  revalidatePath(`/admin/blog/${id}`);
  revalidatePath("/blog");
  return { ok: true };
}

export async function publishBlogPostAction(id: string): Promise<{ error?: string }> {
  await requireSuperAdmin();
  await db.update(blogPosts).set({
    status: "published",
    publishedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(blogPosts.id, id));
  revalidatePath("/admin/blog");
  revalidatePath(`/admin/blog/${id}`);
  revalidatePath("/blog");
  return {};
}

export async function unpublishBlogPostAction(id: string): Promise<{ error?: string }> {
  await requireSuperAdmin();
  await db.update(blogPosts).set({
    status: "draft",
    updatedAt: new Date(),
  }).where(eq(blogPosts.id, id));
  revalidatePath("/admin/blog");
  revalidatePath(`/admin/blog/${id}`);
  revalidatePath("/blog");
  return {};
}

export async function deleteBlogPostAction(id: string): Promise<void> {
  await requireSuperAdmin();
  await db.delete(blogPosts).where(eq(blogPosts.id, id));
  revalidatePath("/admin/blog");
  redirect("/admin/blog");
}
