import { MDXRemote } from "next-mdx-remote/rsc";
import { useMDXComponents } from "@/components/mdx-components";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

interface MDXContentProps {
  content: string;
}

export function MDXContent({ content }: MDXContentProps) {
  const components = useMDXComponents({});

  return (
    <MDXRemote
      source={content}
      components={components}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeHighlight],
        },
      }}
    />
  );
}
