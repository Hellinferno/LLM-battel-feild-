"use client";

import DOMPurify from "dompurify";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

type Props = {
  text: string;
  /** Tailwind class merged onto the wrapper. */
  className?: string;
};

export function MarkdownContent({ text, className }: Props) {
  return (
    <div className={`markdown-body ${className ?? ""}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code(props) {
            const { className: codeClass, children, ...rest } = props;
            const lang = /language-(\w+)/.exec(codeClass ?? "")?.[1];
            const value = String(children).replace(/\n$/, "");
            if (lang === "mermaid") {
              return <MermaidBlock chart={value} />;
            }
            return (
              <code className={codeClass} {...rest}>
                {children}
              </code>
            );
          }
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

function MermaidBlock({ chart }: { chart: string }) {
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { default: mermaid } = await import("mermaid");
        mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "default" });
        const id = `mmd-${Math.random().toString(36).slice(2)}`;
        const { svg: rendered } = await mermaid.render(id, chart);
        // Mermaid runs in strict mode, but the chart text is LLM output; sanitize
        // the resulting SVG as a second line of defense before injecting it.
        const clean = DOMPurify.sanitize(rendered, {
          USE_PROFILES: { svg: true, svgFilters: true }
        });
        if (!cancelled) {
          setSvg(clean);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Mermaid render failed.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (error) {
    return (
      <pre className="overflow-x-auto rounded-md border border-danger/30 bg-danger/5 p-3 text-xs text-danger">
        Mermaid error: {error}
        {"\n\n"}
        {chart}
      </pre>
    );
  }
  if (!svg) {
    return (
      <pre className="overflow-x-auto rounded-md border border-line bg-slate-50 p-3 text-xs">
        {chart}
      </pre>
    );
  }
  return <div className="my-2" dangerouslySetInnerHTML={{ __html: svg }} />;
}
