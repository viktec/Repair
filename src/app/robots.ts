import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/funzionalita/", "/blog/", "/novita"],
        disallow: [
          "/api/",
          "/sign/",
          "/dashboard",
          "/tickets",
          "/customers",
          "/settings",
          "/support",
          "/inventory",
          "/registry",
          "/pos",
          "/reports",
          "/invite/",
          "/perizia/",
        ],
      },
    ],
    sitemap: "https://my-repair.it/sitemap.xml",
  };
}
