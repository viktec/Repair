import { db } from "@/lib/db";
import { blogPosts } from "@/db/schema";
import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Plus, Pencil, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const CATEGORY_COLORS: Record<string, string> = {
  Gestione: "bg-blue-100 text-blue-700",
  Normativa: "bg-amber-100 text-amber-700",
  Marketing: "bg-violet-100 text-violet-700",
  Tecnologia: "bg-emerald-100 text-emerald-700",
  Prodotto: "bg-teal-100 text-teal-700",
};

export default async function AdminBlogPage() {
  const session = await auth();
  if (!(session?.user as { isSuperAdmin?: boolean })?.isSuperAdmin) redirect("/dashboard");

  const posts = await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));

  const published = posts.filter((p) => p.status === "published").length;
  const drafts = posts.filter((p) => p.status === "draft").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blog</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {published} pubblicati · {drafts} bozze
          </p>
        </div>
        <Link href="/admin/blog/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Nuovo articolo
          </Button>
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center text-muted-foreground">
          <p className="mb-4">Nessun articolo ancora.</p>
          <Link href="/admin/blog/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Crea il primo articolo
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50 text-xs text-muted-foreground uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Titolo</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Categoria</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Stato</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Data</th>
                <th className="px-4 py-3 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium leading-snug">{post.title}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{post.slug}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${CATEGORY_COLORS[post.category] ?? "bg-slate-100 text-slate-700"}`}>
                      {post.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${
                      post.status === "published"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {post.status === "published" ? "Pubblicato" : "Bozza"}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                    {post.publishedAt
                      ? post.publishedAt.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })
                      : post.createdAt.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {post.status === "published" && (
                        <a
                          href={`https://my-repair.it/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="Vedi live"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Modifica
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
