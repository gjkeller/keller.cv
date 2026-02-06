import { siteData } from "@/lib/data";
import { getBlogPosts } from "@/lib/mdx";
import { Github, Linkedin, Twitter, Mail, Calendar } from "lucide-react";

const socialIcons: Record<string, React.ReactNode> = {
  GitHub: <Github className="w-4 h-4" />,
  LinkedIn: <Linkedin className="w-4 h-4" />,
  X: <Twitter className="w-4 h-4" />,
};

export default function Home() {
  const currentWork = siteData.work.filter((w) => w.current);
  const posts = getBlogPosts().slice(0, 3);

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-xl mx-auto px-6 py-20 sm:py-28">
        {/* Header */}
        <header>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {siteData.name}
              </h1>
              <p className="text-sm text-gray-500 mt-1.5">{siteData.tagline}</p>
            </div>
            <div className="flex items-center gap-3 mt-1">
              {siteData.socialLinks
                .filter((link) => socialIcons[link.label])
                .map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gray-700 transition-colors"
                    aria-label={link.label}
                  >
                    {socialIcons[link.label]}
                  </a>
                ))}
              <a
                href={`mailto:${siteData.email}`}
                className="text-gray-400 hover:text-gray-700 transition-colors"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>
          <p className="text-[15px] text-gray-600 mt-6 leading-relaxed">
            {siteData.bio}
          </p>
        </header>

        <hr className="border-gray-200 my-10" />

        {/* Currently */}
        <section>
          <h2 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-5">
            Currently
          </h2>
          <div className="space-y-4">
            {currentWork.map((item) => (
              <div
                key={item.company}
                className="flex items-start justify-between gap-6"
              >
                <div className="min-w-0">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-gray-900 hover:text-blue-600 transition-colors text-[15px]"
                  >
                    {item.company}
                  </a>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {item.description}
                  </p>
                </div>
                <span className="text-xs text-gray-400 shrink-0 mt-1">
                  {item.role}
                </span>
              </div>
            ))}
          </div>
        </section>

        <hr className="border-gray-200 my-10" />

        {/* Writing */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Writing
            </h2>
            <a
              href="/blog"
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              View all &rarr;
            </a>
          </div>
          {posts.length > 0 ? (
            <div className="space-y-3">
              {posts.map((post) => (
                <a
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="flex items-baseline justify-between gap-4 group"
                >
                  <span className="text-gray-900 group-hover:text-blue-600 transition-colors text-[15px] font-medium">
                    {post.title}
                  </span>
                  <span className="text-gray-400 text-xs shrink-0 tabular-nums">
                    {new Date(post.date).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Coming soon.</p>
          )}
        </section>

        <hr className="border-gray-200 my-10" />

        {/* Connect */}
        <section>
          <p className="text-[15px] text-gray-600 mb-4">
            Always happy to grab a coffee or jump on a quick call.
          </p>
          <a
            href="https://cal.com/gjkeller"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Grab a coffee &rarr;
          </a>
        </section>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-100">
          <p className="text-gray-300 text-xs">
            &copy; 2026 Gabriel Keller
          </p>
        </footer>
      </div>
    </main>
  );
}
