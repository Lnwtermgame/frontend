"use client";

import * as React from "react";

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
                <span className="w-1.5 h-5 bg-brutal-pink"></span>
                {parseContent(headerText)}
              </h4>
              <p className="text-gray-600 leading-relaxed">
                {parseContent(restOfParagraph.trim())}
              </p>
            </div>
          );
        }

        // Mixed content parser: Split paragraph into text, ul, and ol blocks
        const lines = paragraph.split("\n").filter((line) => line.trim());
        const blocks: { type: "text" | "ul" | "ol"; items: string[] }[] = [];
        let currentBlock: {
          type: "text" | "ul" | "ol";
          items: string[];
        } | null = null;

        lines.forEach((line) => {
          let lineType: "text" | "ul" | "ol" = "text";
          if (line.match(/^-\s+/)) lineType = "ul";
          else if (line.match(/^\d+\.\s+/)) lineType = "ol";

          if (!currentBlock || currentBlock.type !== lineType) {
            if (currentBlock) blocks.push(currentBlock);
            currentBlock = { type: lineType, items: [line] };
          } else {
            currentBlock.items.push(line);
          }
        });
        if (currentBlock) blocks.push(currentBlock);

        return (
          <div key={index} className="mb-4">
            {blocks.map((block, blockIndex) => {
              if (block.type === "ul") {
                return (
                  <ul
                    key={blockIndex}
                    className="list-disc pl-6 space-y-2 mb-4 text-gray-700"
                  >
                    {block.items.map((item, itemIndex) => {
                      const itemContent = item.replace(/^-\s+/, "");
                      return (
                        <li key={itemIndex}>{parseContent(itemContent)}</li>
                      );
                    })}
                  </ul>
                );
              } else if (block.type === "ol") {
                return (
                  <ol
                    key={blockIndex}
                    className="list-decimal pl-6 space-y-2 mb-4 text-gray-700"
                  >
                    {block.items.map((item, itemIndex) => {
                      const itemContent = item.replace(/^\d+\.\s+/, "");
                      return (
                        <li key={itemIndex}>{parseContent(itemContent)}</li>
                      );
                    })}
                  </ol>
                );
              } else {
                return (
                  <p
                    key={blockIndex}
                    className="text-gray-700 leading-relaxed mb-4"
                  >
                    {parseContent(block.items.join("\n"))}
                  </p>
                );
              }
            })}
          </div>
        );
      })}
    </div>
  );
}

export default ProductDescription;
