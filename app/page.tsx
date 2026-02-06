import { siteData } from "@/lib/data";
import { getBlogPosts } from "@/lib/mdx";

export default function Home() {
  const currentWork = siteData.work.filter((w) => w.current);
  const posts = getBlogPosts().slice(0, 3);

  return (
    <main className="min-h-screen py-12 sm:py-20 px-4">
      <div className="max-w-xl mx-auto space-y-4">
        {/* Hero Card */}
        <section className="bg-white rounded-xl border border-gray-200 p-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            {siteData.name}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{siteData.tagline}</p>
          <p className="text-base text-gray-600 mt-4 leading-relaxed">
            {siteData.bio}
          </p>
          <div className="flex items-center flex-wrap gap-3 mt-5">
            {siteData.socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </section>

        {/* Currently Card */}
        <section className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-5">
            Currently
          </h2>
          <div className="space-y-0">
            {currentWork.map((item, i) => (
              <div key={item.company}>
                <div className="py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {item.company}
                      </a>
                      <span className="text-gray-400 text-sm ml-2">
                        {item.role}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {item.description}
                  </p>
                </div>
                {i < currentWork.length - 1 && (
                  <div className="border-t border-gray-100" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Writing Card */}
        <section className="bg-white rounded-xl border border-gray-200 p-8">
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
                  <span className="text-gray-900 group-hover:text-blue-600 transition-colors text-sm font-medium">
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

        {/* Connect Card */}
        <section className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Want to chat?
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            I&apos;m always happy to grab a coffee or jump on a quick call.
          </p>
          <div className="flex items-center flex-wrap gap-4">
            <a
              href={`mailto:${siteData.email}`}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Book a chat &rarr;
            </a>
            {siteData.socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center pt-4 pb-8">
          <p className="text-gray-400 text-xs">
            &copy; 2026 Gabriel Keller
          </p>
        </footer>
      </div>
    </main>
  );
}
