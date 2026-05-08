import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://my-repair.it"),
  title: {
    template: "%s | My-Repair",
    default: "My-Repair — Gestionale per centri di riparazione",
  },
  description:
    "Gestionale italiano per centri di riparazione smartphone, PC e TV. Ticket, magazzino ricambi, cassa POS, firma digitale e registro usato. Prova gratis 14 giorni, nessuna carta di credito.",
  keywords: [
    "gestionale riparazioni",
    "software gestionale centro riparazione",
    "gestionale riparazioni smartphone",
    "gestionale riparazioni computer",
    "gestionale riparazioni televisori",
    "software officina cellulari",
    "ticket riparazione software",
    "magazzino ricambi smartphone",
    "carico scarico merce riparazione",
    "registro usato dispositivi",
    "perizie usato smartphone",
    "cassa pos centro riparazione",
    "fatture centro riparazione",
    "IMEI tracking",
  ],
  authors: [{ name: "My-Repair" }],
  creator: "My-Repair",
  openGraph: {
    type: "website",
    locale: "it_IT",
    url: "https://my-repair.it",
    siteName: "My-Repair",
    title: "My-Repair — Gestionale per centri di riparazione",
    description:
      "Gestionale italiano per centri di riparazione smartphone, PC e TV. Ticket, magazzino, cassa POS, firma digitale. Prova gratis 14 giorni.",
  },
  twitter: {
    card: "summary_large_image",
    title: "My-Repair — Gestionale per centri di riparazione",
    description:
      "Gestionale italiano per centri di riparazione smartphone, PC e TV. Ticket, magazzino, cassa POS, firma digitale. Prova gratis 14 giorni.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
