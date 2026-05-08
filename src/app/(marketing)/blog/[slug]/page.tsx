import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock, BookOpen } from "lucide-react";
import { db } from "@/lib/db";
import { blogPosts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

const CATEGORY_COLORS: Record<string, string> = {
  Gestione:   "bg-blue-100 text-blue-700",
  Normativa:  "bg-amber-100 text-amber-700",
  Marketing:  "bg-violet-100 text-violet-700",
  Tecnologia: "bg-emerald-100 text-emerald-700",
  Prodotto:   "bg-teal-100 text-teal-700",
};

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const [post] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);
  if (!post || post.status !== "published") return {};
  const url = `https://my-repair.it/blog/${slug}`;
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || (post.intro.length > 160 ? post.intro.slice(0, 157) + "..." : post.intro);
  const keywords = post.seoKeywords ? post.seoKeywords.split(",").map((k) => k.trim()) : undefined;
  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      publishedTime: post.publishedAt?.toISOString(),
      authors: ["My-Repair"],
      tags: [post.category, "gestionale riparazioni"],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [post] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);

  if (!post || post.status !== "published") notFound();

  // Prev / next navigation
  const allPublished = await db
    .select({ id: blogPosts.id, slug: blogPosts.slug, title: blogPosts.title })
    .from(blogPosts)
    .where(eq(blogPosts.status, "published"))
    .orderBy(desc(blogPosts.publishedAt));

  const currentIdx = allPublished.findIndex((p) => p.slug === slug);
  const prevPost = currentIdx < allPublished.length - 1 ? allPublished[currentIdx + 1] : null;
  const nextPost = currentIdx > 0 ? allPublished[currentIdx - 1] : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.seoTitle || post.title,
    description: post.seoDescription || post.intro,
    datePublished: post.publishedAt?.toISOString(),
    author: { "@type": "Organization", name: "My-Repair", url: "https://my-repair.it" },
    publisher: { "@type": "Organization", name: "My-Repair", url: "https://my-repair.it" },
    url: `https://my-repair.it/blog/${slug}`,
    inLanguage: "it",
    keywords: post.seoKeywords || `gestionale riparazioni, ${post.category}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <div className="border-b bg-slate-50">
        <div className="container py-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate max-w-[200px]">{post.title}</span>
        </div>
      </div>

      {/* Header */}
      <section className="py-12 bg-slate-50 border-b">
        <div className="container max-w-2xl mx-auto">
          <span className={`inline-block text-[11px] font-semibold rounded-full px-2.5 py-1 mb-4 ${CATEGORY_COLORS[post.category] ?? "bg-slate-100 text-slate-700"}`}>
            {post.category}
          </span>
          <h1 className="text-3xl font-bold leading-snug mb-4">{post.title}</h1>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> My-Repair Blog</span>
            <span>·</span>
            <span>{post.publishedAt?.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readMin} min</span>
          </div>
        </div>
      </section>

      {/* Content */}
      <article className="py-12">
        <div className="container max-w-2xl mx-auto">
          <p className="text-base text-muted-foreground leading-relaxed mb-8 border-l-4 border-primary/30 pl-4">
            {post.intro}
          </p>

          <div className="space-y-8">
            {post.sections.map((s, i) => (
              <div key={i}>
                {s.heading && <h2 className="text-xl font-bold mb-3">{s.heading}</h2>}
                <p className="text-foreground leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>

          {post.cta && (
            <div className="mt-12 rounded-2xl bg-gradient-to-br from-teal-700 to-emerald-600 p-6 text-white">
              <p className="font-semibold text-lg mb-2">{post.cta}</p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 mt-1 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-primary hover:bg-white/90 transition-colors"
              >
                Inizia gratis <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </article>

      {/* Navigation */}
      <div className="border-t py-8 bg-slate-50">
        <div className="container max-w-2xl mx-auto flex items-center justify-between gap-4">
          {prevPost ? (
            <Link href={`/blog/${prevPost.slug}`} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors max-w-[45%]">
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span className="truncate">{prevPost.title}</span>
            </Link>
          ) : <span />}
          {nextPost ? (
            <Link href={`/blog/${nextPost.slug}`} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors max-w-[45%] text-right">
              <span className="truncate">{nextPost.title}</span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
          ) : <span />}
        </div>
      </div>
    </>
  );
}
