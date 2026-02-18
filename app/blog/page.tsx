import type { Metadata } from "next";
import { HomePageContent } from "@/app/home-page-content";

export const metadata: Metadata = {
  title: "Gabe's Blog",
  description:
    "Thoughts on software engineering, AI, and building with agents — by Gabriel Keller.",
  openGraph: {
    title: "Gabe's Blog — Gabriel Keller",
    description:
      "Thoughts on software engineering, AI, and building with agents.",
    url: "https://keller.cv/blog",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gabe's Blog — Gabriel Keller",
    description:
      "Thoughts on software engineering, AI, and building with agents.",
  },
  alternates: { canonical: "https://keller.cv/blog" },
};

export default function BlogPage() {
  return <HomePageContent initialSectionIntent="blog" />;
}
