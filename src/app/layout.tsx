import "./globals.css";
import type { Metadata } from "next";
import { Space_Grotesk, Be_Vietnam_Pro } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/Toaster";

const spaceGrotesk = Space_Grotesk({
  weight: ["500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-display",
});

const beVietnamPro = Be_Vietnam_Pro({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "EV Charge — Smart Charging",
  description: "Smart EV charging network in Vietnam",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#10b981",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning className={`${spaceGrotesk.variable} ${beVietnamPro.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="font-body">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
        <script dangerouslySetInnerHTML={{ __html: `
          if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js").catch(console.error);
          }
        ` }} />
      </body>
    </html>
  );
}