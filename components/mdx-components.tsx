import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import { ReactNode } from "react";
import { ExpandableImage } from "@/components/blog/expandable-image";
import { CodeBlock } from "@/components/blog/code-block";

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function getTextContent(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(getTextContent).join("");
  if (children && typeof children === "object" && "props" in children) {
    return getTextContent((children as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Use semantic HTML elements and let global CSS handle styling
    h1: ({ children }: { children?: ReactNode }) => <h1>{children}</h1>,
    h2: ({ children }: { children?: ReactNode }) => {
      const id = slugify(getTextContent(children));
      return (
        <h2 id={id} className="group scroll-mt-24">
          <a href={`#${id}`} className="inline-flex items-center gap-2 no-underline">
            <span>{children}</span>
            <span
              className="text-base opacity-0 scale-100 transition-all duration-150 group-hover:opacity-100 group-hover:scale-125"
              aria-hidden="true"
            >
              #
            </span>
          </a>
        </h2>
      );
    },
    h3: ({ children }: { children?: ReactNode }) => {
      const id = slugify(getTextContent(children));
      return (
        <h3 id={id} className="group scroll-mt-24">
          <a href={`#${id}`} className="inline-flex items-center gap-2 no-underline">
            <span>{children}</span>
            <span
              className="text-base opacity-0 scale-100 transition-all duration-150 group-hover:opacity-100 group-hover:scale-125"
              aria-hidden="true"
            >
              #
            </span>
          </a>
        </h3>
      );
    },
    h4: ({ children }: { children?: ReactNode }) => <h4>{children}</h4>,
    p: ({ children }: { children?: ReactNode }) => {
      // If the paragraph contains only an image (MDX wraps ![...] in <p>),
      // render the children directly to avoid <div> inside <p> hydration error.
      const childArray = Array.isArray(children) ? children : [children];
      const hasBlockChild = childArray.some(
        (child) =>
          child &&
          typeof child === "object" &&
          "type" in child &&
          (child.type === "img" || (child.props && child.props.src !== undefined))
      );
      if (hasBlockChild) return <>{children}</>;
      return <p>{children}</p>;
    },

    a: ({ href, children }: { href?: string; children?: ReactNode }) => {
      if (href?.startsWith("http")) {
        return (
          <a href={href} target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        );
      }
      return <Link href={href || "#"}>{children}</Link>;
    },

    ul: ({ children }: { children?: ReactNode }) => <ul>{children}</ul>,
    ol: ({ children }: { children?: ReactNode }) => <ol>{children}</ol>,
    li: ({ children }: { children?: ReactNode }) => <li>{children}</li>,

    // Blockquote, pre, and code styling lives in app/globals.css under
    // `.blog-prose` so it can react to the active theme via CSS variables
    // (see lib/theme-context.tsx). The components here just forward children
    // so MDX retains the right semantic structure for rehype-highlight and
    // remark-gfm to layer on top.
    blockquote: ({ children }: { children?: ReactNode }) => (
      <blockquote>{children}</blockquote>
    ),

    pre: ({ children }: { children?: ReactNode }) => {
      // rehype-highlight stamps `language-XXX` onto the inner <code>; lift
      // it so the CodeBlock client wrapper can render the language pill and
      // expose a hover-revealed copy button without re-walking the tree.
      let language: string | undefined;
      if (
        children &&
        typeof children === "object" &&
        "props" in children &&
        children.props &&
        typeof (children.props as { className?: unknown }).className === "string"
      ) {
        const className = (children.props as { className: string }).className;
        const match = className.match(/language-([a-z0-9+#.-]+)/i);
        if (match) language = match[1];
      }
      return <CodeBlock language={language}>{children}</CodeBlock>;
    },

    code: ({ children, ...props }: { children?: ReactNode; className?: string }) => (
      <code {...props}>{children}</code>
    ),

    img: ({
      src,
      alt,
      width,
      height,
      ...props
    }: React.ImgHTMLAttributes<HTMLImageElement>) => (
      <figure style={{ margin: "2rem 0", textAlign: "center" }}>
        <ExpandableImage
          src={typeof src === "string" ? src : ""}
          alt={alt || ""}
          width={
            typeof width === "number"
              ? width
              : typeof width === "string"
                ? parseInt(width) || 800
                : 800
          }
          height={
            typeof height === "number"
              ? height
              : typeof height === "string"
                ? parseInt(height) || 400
                : 400
          }
          className="h-auto max-w-full rounded-lg"
          caption={alt || undefined}
          {...props}
        />
      </figure>
    ),

    hr: () => <hr />,

    strong: ({ children }: { children?: ReactNode }) => (
      <strong>{children}</strong>
    ),

    // Allow passing through any other components
    ...components,
  };
}
