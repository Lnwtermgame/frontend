"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** เรนเดอร์ markdown จาก backend (คำอธิบายสินค้า, CMS) ด้วยสไตล์ธีม Warm Slate —
 *  h2 มีขีดส้มซ้าย, strong ขาว, ลิสต์เลข/บูลเล็ตชัด */
export function Markdown({ children }: { children: string }) {
  return (
    <div
      className="space-y-3 text-[13px] leading-relaxed text-muted-foreground
        [&_h2]:mt-5 [&_h2]:border-l-2 [&_h2]:border-primary [&_h2]:pb-0.5 [&_h2]:pl-2.5 [&_h2]:text-[13.5px] [&_h2]:font-bold [&_h2]:text-foreground
        [&_h3]:mt-4 [&_h3]:text-[13px] [&_h3]:font-bold [&_h3]:text-foreground
        [&_p]:leading-relaxed
        [&_strong]:font-bold [&_strong]:text-foreground
        [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5
        [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5
        [&_li]:marker:text-muted-foreground/50
        [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2
        [&_hr]:border-border/60"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
