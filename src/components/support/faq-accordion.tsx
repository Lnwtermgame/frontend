"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { markFaqHelpful } from "@/lib/api/support";
import type { FaqArticle } from "@/lib/api/support";

export function FaqAccordion({ articles }: { articles: FaqArticle[] }) {
  const t = useTranslations("support");
  const [voted, setVoted] = useState<Record<string, boolean>>({});

  const handleVote = async (articleId: string, isHelpful: boolean) => {
    if (voted[articleId]) return;
    try {
      await markFaqHelpful(articleId, isHelpful);
      setVoted((prev) => ({ ...prev, [articleId]: true }));
    } catch {
      // transient vote failure
    }
  };

  return (
    <Accordion type="single" collapsible className="w-full space-y-3">
      {articles.map((art) => (
        <AccordionItem
          key={art.id}
          value={art.id}
          className="rounded-[14px] border bg-card px-4 shadow-(--shadow-tile)"
        >
          <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">
            {art.title}
          </AccordionTrigger>
          <AccordionContent className="pt-2 text-sm text-muted-foreground">
            <div className="whitespace-pre-line leading-relaxed">{art.content}</div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3 text-xs">
              <span>{t("wasHelpful")}</span>
              {voted[art.id] ? (
                <span className="text-status-success font-semibold">{t("thankYou")}</span>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    onClick={() => handleVote(art.id, true)}
                  >
                    <ThumbsUp className="size-3" />
                    {t("yes")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    onClick={() => handleVote(art.id, false)}
                  >
                    <ThumbsDown className="size-3" />
                    {t("no")}
                  </Button>
                </>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
