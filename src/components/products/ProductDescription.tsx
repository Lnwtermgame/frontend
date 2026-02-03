"use client";

import * as React from "react";
import { CheckCircle2, LucideIcon } from "lucide-react";
// Import all icons dynamically
const iconModules = require("lucide-react");

interface ProductDescriptionProps {
  description: string;
  className?: string;
}

// Map of available icons for product descriptions
export const DESCRIPTION_ICONS: Record<string, string> = {
  // Gaming & Fun
  Sparkles: "Sparkles",
  Zap: "Zap",
  Gamepad2: "Gamepad2",
  Trophy: "Trophy",
  Target: "Target",
  Swords: "Swords",
  Crown: "Crown",
  Star: "Star",
  // Security & Trust
  Shield: "Shield",
  ShieldCheck: "ShieldCheck",
  Lock: "Lock",
  BadgeCheck: "BadgeCheck",
  // Speed & Delivery
  Rocket: "Rocket",
  Bolt: "Bolt",
  Timer: "Timer",
  Clock: "Clock",
  // Payment & Shopping
  CreditCard: "CreditCard",
  Wallet: "Wallet",
  Banknote: "Banknote",
  ShoppingCart: "ShoppingCart",
  ShoppingBag: "ShoppingBag",
  Gift: "Gift",
  // Support & Help
  Headphones: "Headphones",
  MessageCircle: "MessageCircle",
  HelpCircle: "HelpCircle",
  // Device & Platform
  Smartphone: "Smartphone",
  Tablet: "Tablet",
  Monitor: "Monitor",
  Laptop: "Laptop",
  // General
  Check: "Check",
  CheckCircle2: "CheckCircle2",
  AlertCircle: "AlertCircle",
  Info: "Info",
  Flame: "Flame",
  TrendingUp: "TrendingUp",
  Heart: "Heart",
  ThumbsUp: "ThumbsUp",
  Award: "Award",
  Gem: "Gem",
  Diamond: "Diamond",
  Key: "Key",
  Unlock: "Unlock",
  RefreshCw: "RefreshCw",
  RotateCcw: "RotateCcw",
  Send: "Send",
  Mail: "Mail",
  Bell: "Bell",
  Notifications: "Bell",
};

// Default icon size and styling
const ICON_SIZE = 18;
const ICON_CLASS = "inline-block align-text-bottom mx-1 text-mali-blue";

export function ProductDescription({
  description,
  className = "",
}: ProductDescriptionProps) {
  // Parse description and replace [IconName] with actual icon components
  const parseContent = (text: string): React.ReactNode[] => {
    // Pattern to match [IconName] - supports letters, numbers, and some special chars
    const iconPattern = /\[([A-Za-z0-9]+)\]/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    // Reset regex
    iconPattern.lastIndex = 0;

    while ((match = iconPattern.exec(text)) !== null) {
      const [fullMatch, iconName] = match;
      const matchIndex = match.index;

      // Add text before the icon
      if (matchIndex > lastIndex) {
        const textBefore = text.slice(lastIndex, matchIndex);
        // Split by newlines and preserve them
        const lines = textBefore.split("\n");
        lines.forEach((line, lineIndex) => {
          parts.push(line);
          if (lineIndex < lines.length - 1) {
            parts.push(React.createElement("br", { key: `br-${parts.length}` }));
          }
        });
      }

      // Get the icon component
      const iconKey = DESCRIPTION_ICONS[iconName];
      if (iconKey && iconModules[iconKey]) {
        const IconComponent = iconModules[iconKey] as LucideIcon;
        parts.push(
          React.createElement(IconComponent, {
            key: `icon-${parts.length}`,
            size: ICON_SIZE,
            className: ICON_CLASS,
            strokeWidth: 2,
          })
        );
      } else {
        // Icon not found, show the bracket text
        parts.push(fullMatch);
      }

      lastIndex = matchIndex + fullMatch.length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      const textAfter = text.slice(lastIndex);
      const lines = textAfter.split("\n");
      lines.forEach((line, lineIndex) => {
        parts.push(line);
        if (lineIndex < lines.length - 1) {
          parts.push(React.createElement("br", { key: `br-${parts.length}` }));
        }
      });
    }

    return parts;
  };

  // Split by double newlines to create paragraphs
  const paragraphs = description.split("\n\n");

  return (
    <div className={`prose prose-invert max-w-none ${className}`}>
      {paragraphs.map((paragraph, index) => {
        // Check if paragraph starts with a header pattern (**text**)
        const headerMatch = paragraph.match(/^\*\*(.+?)\*\*[:\s]/);
        if (headerMatch) {
          const [, headerText] = headerMatch;
          const restOfParagraph = paragraph.slice(headerMatch[0].length);
          return (
            <div key={index} className="mb-4">
              <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                {parseContent(headerText)}
              </h4>
              <p className="text-gray-300 leading-relaxed">
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
                    className="flex items-start gap-2 text-gray-300"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                    <span>{parseContent(itemContent)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Regular paragraph
        return (
          <p key={index} className="text-gray-300 leading-relaxed mb-4">
            {parseContent(paragraph)}
          </p>
        );
      })}
    </div>
  );
}

export default ProductDescription;
