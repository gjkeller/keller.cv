import type { MetadataRoute } from "next";
import { getAllSlugs } from "@/lib/mdx";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllSlugs().map((slug) => ({
    url: `https://keller.cv/blog/${slug}`,
    lastModified: new Date(),
  }));

  return [
    { url: "https://keller.cv", lastModified: new Date() },
    { url: "https://keller.cv/blog", lastModified: new Date() },
    ...posts,
  ];
}
