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
            <h1 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4 thai-font flex items-start md:items-center gap-2 mt-5 md:mt-6 first:mt-0 leading-tight">
              <span className="w-1.5 h-6 bg-pink-500 flex-shrink-0 mt-0.5 md:mt-0"></span>
              <span>{children}</span>
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3 thai-font flex items-start md:items-center gap-2 mt-4 md:mt-5 first:mt-0 leading-tight">
              <span className="w-1.5 h-5 bg-pink-500 flex-shrink-0 mt-1 md:mt-0"></span>
              <span>{children}</span>
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base md:text-lg font-bold text-white mb-2 thai-font flex items-start md:items-center gap-2 mt-3 md:mt-4 first:mt-0 leading-tight">
              <span className="w-1.5 h-4 bg-pink-500 flex-shrink-0 mt-1 md:mt-0"></span>
              <span>{children}</span>
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm md:text-base font-bold text-white mb-2 thai-font flex items-start md:items-center gap-2 mt-2 md:mt-3 first:mt-0 leading-tight">
              <span className="w-1.5 h-4 bg-pink-500 flex-shrink-0 mt-1 md:mt-0"></span>
              <span>{children}</span>
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-3 md:mb-4 whitespace-pre-wrap break-words">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 md:pl-6 space-y-1 md:space-y-2 mb-3 md:mb-4 text-sm md:text-base text-gray-700">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 md:pl-6 space-y-1 md:space-y-2 mb-3 md:mb-4 text-sm md:text-base text-gray-700">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-bold text-white">{children}</strong>
          ),
        }}
      >
        {cleanDescription}
      </ReactMarkdown>
    </div>
  );
}

export default ProductDescription;
