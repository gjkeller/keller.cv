import { siteData } from "@/lib/data";
import { getBlogPosts } from "@/lib/mdx";

function GithubIcon() {
  return (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-[16px] h-[16px]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function DevpostIcon() {
  return (
    <svg className="w-[16px] h-[16px]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.002 1.61L0 12.004 6.002 22.39h11.996L24 12.004 17.998 1.61zm1.593 4.084h3.947c3.605 0 6.276 1.695 6.276 6.31 0 4.436-3.21 6.302-6.456 6.302H7.595zm2.517 2.449v7.714h1.241c2.646 0 3.862-1.55 3.862-3.861.009-2.569-1.096-3.853-3.767-3.853z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
      <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
    </svg>
  );
}

const socialIcons: Record<string, React.ReactNode> = {
  GitHub: <GithubIcon />,
  LinkedIn: <LinkedinIcon />,
  X: <XIcon />,
  Devpost: <DevpostIcon />,
};

const hackathonWins = [
  {
    name: "HackTX 2025",
    prize: "1st Place — $4,000",
    project: "Rocket Racer",
    url: "https://devpost.com/software/rocket-racer-l1hmn6",
  },
  {
    name: "RecordHacks",
    prize: "Winner",
    project: "The Beat Box",
    url: "https://devpost.com/software/the-beat-box",
  },
];

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
                <MailIcon />
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

        {/* Hackathon Wins */}
        <section>
          <h2 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-5">
            Hackathons
          </h2>
          <div className="space-y-4">
            {hackathonWins.map((win) => (
              <div
                key={win.name}
                className="flex items-start justify-between gap-6"
              >
                <div className="min-w-0">
                  <a
                    href={win.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-gray-900 hover:text-blue-600 transition-colors text-[15px]"
                  >
                    {win.project}
                  </a>
                  <p className="text-sm text-gray-500 mt-0.5">{win.name}</p>
                </div>
                <span className="text-xs text-gray-400 shrink-0 mt-1">
                  {win.prize}
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
            <CalendarIcon />
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
