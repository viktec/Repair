import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Repair — Gestionale per centri di riparazione",
  description:
    "Ticket, foto pre/post, tracking cliente, magazzino ricambi. Tutto in un posto.",
  keywords: ["gestionale riparazioni", "software officina", "ticket riparazione", "IMEI tracking"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
