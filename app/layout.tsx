import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/lib/theme-context";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Gabriel Keller",
  description: "CS @ UT Austin · Building agent infrastructure",
  metadataBase: new URL("https://keller.cv"),
  openGraph: {
    title: "Gabriel Keller",
    description: "CS @ UT Austin · Building agent infrastructure",
    url: "https://keller.cv",
    siteName: "Gabriel Keller",
    type: "website",
  },
  twitter: {
    card: "summary",
    site: "@gabrieljkeller",
    creator: "@gabrieljkeller",
  },
  alternates: { canonical: "https://keller.cv" },
  icons: { icon: "/favicon.png" },
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
