import type { Metadata } from "next";
import { HomePageContent } from "../home-page-content";

export const metadata: Metadata = {
  title: "Book a call",
  description: "Find a time for a 15 or 30 minute conversation.",
  openGraph: {
    title: "Book a call",
    description: "Find a time for a 15 or 30 minute conversation.",
    url: "https://keller.cv/call",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Book a call",
    description: "Find a time for a 15 or 30 minute conversation.",
  },
  alternates: { canonical: "https://keller.cv/call" },
};

type CallPageProps = {
  searchParams?: Promise<{
    duration?: string;
  }>;
};

export default async function CallPage({ searchParams }: CallPageProps) {
  const resolvedSearchParams = await searchParams;
  const duration = resolvedSearchParams?.duration;
  const initialCallIntent = duration === "30m" ? "30m" : "15m";

  return (
    <HomePageContent
      initialSectionIntent="home"
      initialCallIntent={initialCallIntent}
    />
  );
}
