"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { useAuth } from "../hooks/use-auth";
import {
  supportApi,
  Ticket,
  TicketDetail,
  TicketMessage,
  TicketStatus,
  CreateTicketData,
  TicketReplyData,
  FaqCategory,
  FaqArticleListItem,
} from "../services/support-api";
import toast from "react-hot-toast";

type SupportContextType = {
  tickets: Ticket[];
  isLoading: boolean;
  error: string | null;
  fetchTickets: (params?: {
    status?: TicketStatus;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  getTicketDetail: (ticketId: string) => Promise<TicketDetail | null>;
  createTicket: (data: CreateTicketData) => Promise<Ticket | null>;
  replyToTicket: (
    ticketId: string,
    data: TicketReplyData,
  ) => Promise<TicketMessage | null>;
  closeTicket: (ticketId: string) => Promise<boolean>;
  faqCategories: FaqCategory[];
  faqArticles: FaqArticleListItem[];
  fetchFaqCategories: () => Promise<void>;
  fetchFaqArticles: (params?: {
    categoryId?: string;
    search?: string;
  }) => Promise<void>;
};

export const SupportContext = createContext<SupportContextType | undefined>(
  undefined,
);

export function SupportProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [faqCategories, setFaqCategories] = useState<FaqCategory[]>([]);
  const [faqArticles, setFaqArticles] = useState<FaqArticleListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(
    async (params?: {
      status?: TicketStatus;
      page?: number;
      limit?: number;
    }) => {
      if (!user) return;
      setIsLoading(true);
      setError(null);

      try {
        const response = await supportApi.getUserTickets(
          params?.page ?? 1,
          params?.limit ?? 20,
          params?.status,
        );
        if (response.success) {
          setTickets(response.data);
        }
      } catch (err) {
        const message = supportApi.getErrorMessage(err);
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [user],
  );

  const getTicketDetail = useCallback(
    async (ticketId: string): Promise<TicketDetail | null> => {
      try {
        const response = await supportApi.getTicketDetail(ticketId);
        if (response.success) {
          return response.data;
        }
        return null;
      } catch (err) {
        const message = supportApi.getErrorMessage(err);
        toast.error(message);
        return null;
      }
    },
    [],
  );

  const createTicket = useCallback(
    async (data: CreateTicketData): Promise<Ticket | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await supportApi.createTicket(data);
        if (response.success) {
          setTickets((prev) => [response.data, ...prev]);
          toast.success("สร้างตั๋วสำเร็จ");
          return response.data;
        }
        return null;
      } catch (err) {
        const message = supportApi.getErrorMessage(err);
        setError(message);
        toast.error(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const replyToTicket = useCallback(
    async (
      ticketId: string,
      data: TicketReplyData,
    ): Promise<TicketMessage | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await supportApi.addReply(ticketId, data);
        if (response.success) {
          return response.data;
        }
        return null;
      } catch (err) {
        const message = supportApi.getErrorMessage(err);
        setError(message);
        toast.error(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const closeTicket = useCallback(
    async (ticketId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await supportApi.closeTicket(ticketId);
        if (response.success) {
          setTickets((prev) =>
            prev.map((t) =>
              t.id === ticketId ? { ...t, status: "CLOSED" as TicketStatus } : t,
            ),
          );
          toast.success("ปิดตั๋วสำเร็จ");
          return true;
        }
        return false;
      } catch (err) {
        const message = supportApi.getErrorMessage(err);
        setError(message);
        toast.error(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const fetchFaqCategories = useCallback(async () => {
    try {
      const response = await supportApi.getFaqCategories();
      if (response.success) {
        setFaqCategories(response.data);
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to fetch FAQ categories:", err);
      }
    }
  }, []);

  const fetchFaqArticles = useCallback(
    async (params?: { categoryId?: string; search?: string }) => {
      try {
        const response = await supportApi.getFaqArticles(
          1,
          20,
          params?.categoryId,
          params?.search,
        );
        if (response.success) {
          setFaqArticles(response.data);
        }
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to fetch FAQ articles:", err);
        }
      }
    },
    [],
  );

  const contextValue = useMemo(
    () => ({
      tickets,
      isLoading,
      error,
      fetchTickets,
      getTicketDetail,
      createTicket,
      replyToTicket,
      closeTicket,
      faqCategories,
      faqArticles,
      fetchFaqCategories,
      fetchFaqArticles,
    }),
    [
      tickets,
      isLoading,
      error,
      fetchTickets,
      getTicketDetail,
      createTicket,
      replyToTicket,
      closeTicket,
      faqCategories,
      faqArticles,
      fetchFaqCategories,
      fetchFaqArticles,
    ],
  );

  return (
    <SupportContext.Provider value={contextValue}>
      {children}
    </SupportContext.Provider>
  );
}

export function useSupport() {
  const context = useContext(SupportContext);
  if (context === undefined) {
    throw new Error("useSupport must be used within a SupportProvider");
  }
  return context;
}
