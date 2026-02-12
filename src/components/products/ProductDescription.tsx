"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ProductDescriptionProps {
  description: string;
  className?: string;
}

export function ProductDescription({
  description,
  className = "",
}: ProductDescriptionProps) {
  // Pre-process description to remove [IconName] patterns
  const cleanDescription = description.replace(/\[([A-Za-z0-9]+)\]/g, "");

  return (
    <div className={`prose max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-black mb-4 thai-font flex items-center gap-2 mt-6 first:mt-0">
              <span className="w-1.5 h-6 bg-brutal-pink"></span>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold text-black mb-3 thai-font flex items-center gap-2 mt-5 first:mt-0">
              <span className="w-1.5 h-5 bg-brutal-pink"></span>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-bold text-black mb-2 thai-font flex items-center gap-2 mt-4 first:mt-0">
              <span className="w-1.5 h-4 bg-brutal-pink"></span>
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-bold text-black mb-2 thai-font flex items-center gap-2 mt-3 first:mt-0">
              <span className="w-1.5 h-4 bg-brutal-pink"></span>
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-gray-600 leading-relaxed mb-4 whitespace-pre-wrap">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-6 space-y-2 mb-4 text-gray-700">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 space-y-2 mb-4 text-gray-700">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-bold text-black">{children}</strong>
          ),
        }}
      >
        {cleanDescription}
      </ReactMarkdown>
    </div>
  );
}

export default ProductDescription;
