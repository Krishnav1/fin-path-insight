/**
 * Markdown Renderer Component
 * Renders markdown content with syntax highlighting and styling
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Custom styling for different markdown elements
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl font-bold mt-4 mb-2 text-slate-900 dark:text-slate-100" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl font-bold mt-3 mb-2 text-slate-900 dark:text-slate-100" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-semibold mt-2 mb-1 text-slate-900 dark:text-slate-100" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="mb-2 text-slate-700 dark:text-slate-300 leading-relaxed" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside mb-2 space-y-1 text-slate-700 dark:text-slate-300" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside mb-2 space-y-1 text-slate-700 dark:text-slate-300" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="ml-4" {...props} />
          ),
          code: ({ node, inline, className, children, ...props }: any) => {
            if (inline) {
              return (
                <code
                  className="bg-slate-200 dark:bg-slate-700 text-fin-teal dark:text-fin-teal-light px-1.5 py-0.5 rounded text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className={`${className} block bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto text-sm font-mono my-2`}
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ node, ...props }) => (
            <pre className="bg-slate-900 rounded-lg overflow-hidden my-2" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-fin-teal pl-4 italic text-slate-600 dark:text-slate-400 my-2"
              {...props}
            />
          ),
          a: ({ node, ...props }) => (
            <a
              className="text-fin-teal hover:text-fin-teal-dark underline"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full border border-slate-300 dark:border-slate-600" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-slate-100 dark:bg-slate-800" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-left font-semibold" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="border border-slate-300 dark:border-slate-600 px-4 py-2" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-slate-900 dark:text-slate-100" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-slate-700 dark:text-slate-300" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
