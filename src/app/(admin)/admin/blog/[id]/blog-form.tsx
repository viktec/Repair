"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createBlogPostAction,
  updateBlogPostAction,
  publishBlogPostAction,
  unpublishBlogPostAction,
  deleteBlogPostAction,
} from "./actions";
import {
  Loader2, Save, Globe, EyeOff, Trash2, Plus, Minus,
  ChevronUp, ChevronDown, Check, ExternalLink,
} from "lucide-react";

type Section = { heading: string; body: string };

type Post = {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  readMin: number;
  intro: string;
  sections: { heading?: string; body: string }[];
  cta: string | null;
  status: string;
  publishedAt: Date | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
};

const CATEGORIES = ["Gestione", "Normativa", "Marketing", "Tecnologia", "Prodotto"];

function toSlug(title: string) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function BlogForm({ post }: { post: Post | null }) {
  const isNew = !post;
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(!isNew);
  const [category, setCategory] = useState(post?.category ?? "Gestione");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [readMin, setReadMin] = useState(post?.readMin ?? 5);
  const [intro, setIntro] = useState(post?.intro ?? "");
  const [sections, setSections] = useState<Section[]>(
    post?.sections?.map((s) => ({ heading: s.heading ?? "", body: s.body })) ?? [{ heading: "", body: "" }]
  );
  const [cta, setCta] = useState(post?.cta ?? "");
  const [seoTitle, setSeoTitle] = useState(post?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(post?.seoDescription ?? "");
  const [seoKeywords, setSeoKeywords] = useState(post?.seoKeywords ?? "");
  const [seoOpen, setSeoOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleTitleChange(v: string) {
    setTitle(v);
    if (!slugEdited) setSlug(toSlug(v));
  }

  function addSection() {
    setSections((s) => [...s, { heading: "", body: "" }]);
  }

  function removeSection(i: number) {
    setSections((s) => s.filter((_, idx) => idx !== i));
  }

  function updateSection(i: number, field: keyof Section, value: string) {
    setSections((s) => s.map((sec, idx) => (idx === i ? { ...sec, [field]: value } : sec)));
  }

  function moveSection(i: number, dir: -1 | 1) {
    setSections((s) => {
      const arr = [...s];
      const tmp = arr[i + dir];
      arr[i + dir] = arr[i];
      arr[i] = tmp;
      return arr;
    });
  }

  function buildFormData() {
    const fd = new FormData();
    fd.set("title", title);
    fd.set("slug", slug);
    fd.set("category", category);
    fd.set("excerpt", excerpt);
    fd.set("readMin", String(readMin));
    fd.set("intro", intro);
    fd.set("sections", JSON.stringify(sections.map((s) => ({ heading: s.heading || undefined, body: s.body }))));
    fd.set("cta", cta);
    fd.set("seoTitle", seoTitle);
    fd.set("seoDescription", seoDescription);
    fd.set("seoKeywords", seoKeywords);
    return fd;
  }

  function handleSave() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = isNew
        ? await createBlogPostAction(buildFormData())
        : await updateBlogPostAction(post!.id, buildFormData());
      if (res && "error" in res && res.error) {
        setError(res.error);
      } else if (!isNew) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    });
  }

  function handlePublish() {
    setError(null);
    startTransition(async () => {
      // Save first, then publish
      const saveRes = await updateBlogPostAction(post!.id, buildFormData());
      if (saveRes?.error) { setError(saveRes.error); return; }
      const res = await publishBlogPostAction(post!.id);
      if (res?.error) setError(res.error);
    });
  }

  function handleUnpublish() {
    startTransition(async () => {
      const res = await unpublishBlogPostAction(post!.id);
      if (res?.error) setError(res.error);
    });
  }

  function handleDelete() {
    if (!confirm("Eliminare definitivamente questo articolo?")) return;
    startTransition(async () => { await deleteBlogPostAction(post!.id); });
  }

  const isPublished = post?.status === "published";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">{isNew ? "Nuovo articolo" : "Modifica articolo"}</h1>
          {!isNew && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              isPublished ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
            }`}>
              {isPublished ? "Pubblicato" : "Bozza"}
            </span>
          )}
          {isPublished && post?.slug && (
            <a
              href={`https://my-repair.it/blog/${post.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" /> Vedi live
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {error && <span className="text-xs text-red-600">{error}</span>}
          {saved && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <Check className="h-3.5 w-3.5" /> Salvato
            </span>
          )}
          {!isNew && isPublished && (
            <Button variant="outline" size="sm" onClick={handleUnpublish} disabled={isPending} className="gap-1.5">
              <EyeOff className="h-3.5 w-3.5" /> Metti in bozza
            </Button>
          )}
          {!isNew && !isPublished && (
            <Button size="sm" onClick={handlePublish} disabled={isPending} className="gap-1.5 bg-green-600 hover:bg-green-700">
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
              Pubblica
            </Button>
          )}
          <Button size="sm" variant={isNew ? "default" : "outline"} onClick={handleSave} disabled={isPending} className="gap-1.5">
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {isNew ? "Crea bozza" : "Salva"}
          </Button>
          {!isNew && (
            <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isPending} className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50">
              <Trash2 className="h-3.5 w-3.5" /> Elimina
            </Button>
          )}
        </div>
      </div>

      {/* Base info */}
      <div className="rounded-lg border bg-white p-5 space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Informazioni base</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <Label>Titolo *</Label>
            <Input value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Es. Come gestire 50 ticket al giorno" />
          </div>
          <div className="space-y-1.5">
            <Label>Slug (URL) *</Label>
            <Input
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }}
              placeholder="come-gestire-50-ticket"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">my-repair.it/blog/<span className="font-mono">{slug || "…"}</span></p>
          </div>
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Tempo di lettura (minuti)</Label>
            <Input type="number" min={1} max={60} value={readMin} onChange={(e) => setReadMin(parseInt(e.target.value) || 5)} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Excerpt (per il listing del blog)</Label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              placeholder="Una o due righe che descrivono l'articolo nella lista"
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="rounded-lg border bg-white p-5 space-y-5">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contenuto</h2>

        <div className="space-y-1.5">
          <Label>Paragrafo introduttivo</Label>
          <textarea
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            rows={4}
            placeholder="Il primo paragrafo che appare subito dopo il titolo…"
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Sezioni</Label>
            <Button type="button" variant="outline" size="sm" onClick={addSection} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Aggiungi sezione
            </Button>
          </div>
          {sections.map((section, i) => (
            <div key={i} className="rounded-md border p-4 space-y-2 bg-slate-50/50">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">Sezione {i + 1}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveSection(i, -1)}
                    disabled={i === 0}
                    className="rounded p-1 text-muted-foreground hover:bg-slate-200 disabled:opacity-30"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSection(i, 1)}
                    disabled={i === sections.length - 1}
                    className="rounded p-1 text-muted-foreground hover:bg-slate-200 disabled:opacity-30"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSection(i)}
                    className="rounded p-1 text-red-500 hover:bg-red-50"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <Input
                value={section.heading}
                onChange={(e) => updateSection(i, "heading", e.target.value)}
                placeholder="Titolo sezione (opzionale)"
                className="text-sm"
              />
              <textarea
                value={section.body}
                onChange={(e) => updateSection(i, "body", e.target.value)}
                rows={4}
                placeholder="Testo della sezione…"
                className="flex w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
              />
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <Label>CTA finale (call to action)</Label>
          <textarea
            value={cta}
            onChange={(e) => setCta(e.target.value)}
            rows={2}
            placeholder="Es. Prova My-Repair gratis per 14 giorni e scopri quanto tempo risparmi."
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          />
        </div>
      </div>

      {/* SEO */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <button
          type="button"
          onClick={() => setSeoOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide hover:bg-slate-50 transition-colors"
        >
          <span>SEO</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${seoOpen ? "rotate-180" : ""}`} />
        </button>
        {seoOpen && (
          <div className="px-5 pb-5 space-y-4 border-t">
            <div className="space-y-1.5 pt-4">
              <Label>Titolo SEO <span className="text-muted-foreground font-normal">(lascia vuoto per usare il titolo)</span></Label>
              <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder={title || "Titolo articolo | My-Repair"} />
              <p className="text-xs text-muted-foreground">{(seoTitle || title).length}/60 caratteri</p>
            </div>
            <div className="space-y-1.5">
              <Label>Meta description <span className="text-muted-foreground font-normal">(lascia vuoto per usare l&apos;intro)</span></Label>
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                rows={2}
                placeholder={intro.slice(0, 160) || "Descrizione per i motori di ricerca…"}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
              <p className="text-xs text-muted-foreground">{seoDescription.length}/160 caratteri</p>
            </div>
            <div className="space-y-1.5">
              <Label>Keywords SEO <span className="text-muted-foreground font-normal">(separate da virgola)</span></Label>
              <Input value={seoKeywords} onChange={(e) => setSeoKeywords(e.target.value)} placeholder="gestionale riparazioni, ticket riparazione, …" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
