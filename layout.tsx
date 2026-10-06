import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = { title: "Mon espace de révision", description: "Planner de révision simple et clair" };
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">{children}</body>
    </html>
  );
}
