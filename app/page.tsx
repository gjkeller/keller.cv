import { siteData } from "@/lib/data";
import { getBlogPosts } from "@/lib/mdx";
import { InteractiveLayout } from "./interactive-layout";

export default function Home() {
  const currentWork = siteData.work.filter((w) => w.current);
  const posts = getBlogPosts().slice(0, 3);

  return (
    <InteractiveLayout
      name={siteData.name}
      tagline={siteData.tagline}
      bio={siteData.bio}
      socialLinks={siteData.socialLinks}
      calLink15={siteData.calLink15}
      calLink30={siteData.calLink30}
      currentWork={currentWork}
      hackathons={siteData.hackathons}
      posts={posts.map((p) => ({
        slug: p.slug,
        title: p.title,
        date: p.date,
        description: p.description,
        content: p.content,
      }))}
    />
  );
}
