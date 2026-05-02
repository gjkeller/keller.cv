import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/lib/theme-context";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: { default: "Gabriel Keller", template: "%s | Gabriel Keller" },
  description: "CS @ UT Austin · Building agent infrastructure",
  metadataBase: new URL("https://keller.cv"),
  openGraph: {
    title: "Gabriel Keller",
    description: "Building agent infrastructure.",
    url: "https://keller.cv",
    siteName: "Gabriel Keller",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@gabrieljkeller",
    creator: "@gabrieljkeller",
  },
  alternates: { canonical: "https://keller.cv" },
  // Icons are provided via Next.js file conventions: app/icon.png + app/apple-icon.png.
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
