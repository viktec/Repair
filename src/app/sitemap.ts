import { MetadataRoute } from "next";

const BASE = "https://my-repair.it";

const FEATURE_SLUGS = [
  "ticket", "clienti", "cassa", "magazzino", "report",
  "assistenza", "imei", "fornitori", "registro",
];

const BLOG_SLUGS = [
  "come-gestire-i-ticket-in-un-centro-di-riparazione",
  "gdpr-centri-riparazione-cosa-sapere",
  "registro-usato-obblighi-rivenditori",
  "come-aumentare-le-riparazioni-con-il-qr-tracking",
  "cassa-pos-centro-riparazione-come-funziona",
  "firma-digitale-modulo-accettazione",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/funzionalita`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    ...FEATURE_SLUGS.map((slug) => ({
      url: `${BASE}/funzionalita/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: `${BASE}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ...BLOG_SLUGS.map((slug) => ({
      url: `${BASE}/blog/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: `${BASE}/novita`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
}
