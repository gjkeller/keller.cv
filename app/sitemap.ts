import type { MetadataRoute } from "next";
import { getBlogPosts } from "@/lib/mdx";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getBlogPosts();

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `https://keller.cv/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const latestPostDate =
    posts.length > 0 ? new Date(posts[0].date) : new Date();

  return [
    {
      url: "https://keller.cv",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: "https://keller.cv/blog",
      lastModified: latestPostDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...postEntries,
  ];
}
