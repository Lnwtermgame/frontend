"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";

interface ProductDescriptionProps {
  description: string;
  className?: string;
}

export function ProductDescription({
  description,
  className = "",
}: ProductDescriptionProps) {
  // Simple text content parser - no icons
  const parseContent = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    // Remove any remaining [IconName] patterns from text
    const cleanText = text.replace(/\[([A-Za-z0-9]+)\]/g, "");
    const lines = cleanText.split("\n");
    lines.forEach((line, lineIndex) => {
      parts.push(line);
      if (lineIndex < lines.length - 1) {
        parts.push(React.createElement("br", { key: `br-${parts.length}` }));
      }
    });
    return parts;
  };

  // Split by double newlines to create paragraphs
  const paragraphs = description.split("\n\n");

  return (
    <div className={`prose max-w-none ${className}`}>
      {paragraphs.map((paragraph, index) => {
        // Check if paragraph starts with a header pattern (**text**)
        const headerMatch = paragraph.match(/^\*\*(.+?)\*\*[:\s]/);
        if (headerMatch) {
          const [, headerText] = headerMatch;
          const restOfParagraph = paragraph.slice(headerMatch[0].length);
          return (
            <div key={index} className="mb-4">
              <h4 className="text-lg font-bold text-black mb-2 thai-font flex items-center gap-2">
                <span className="w-1.5 h-5 bg-brutal-pink rounded-sm"></span>
                {parseContent(headerText)}
              </h4>
              <p className="text-gray-600 leading-relaxed">
                {parseContent(restOfParagraph.trim())}
              </p>
            </div>
          );
        }

        // Check if paragraph is a list (starts with number or dash)
        if (paragraph.match(/^(\d+\.\s+|-\s+)/m)) {
          const items = paragraph.split("\n").filter((line) => line.trim());
          return (
            <ul key={index} className="space-y-2 mb-4">
              {items.map((item, itemIndex) => {
                const itemContent = item.replace(/^(\d+\.\s+|-\s+)/, "");
                return (
                  <li
                    key={itemIndex}
                    className="flex items-start gap-2 text-gray-700"
                  >
                    <CheckCircle2 className="w-5 h-5 text-brutal-green shrink-0 mt-0.5" />
                    <span>{parseContent(itemContent)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Regular paragraph
        return (
          <p key={index} className="text-gray-700 leading-relaxed mb-4">
            {parseContent(paragraph)}
          </p>
        );
      })}
    </div>
  );
}

export default ProductDescription;
