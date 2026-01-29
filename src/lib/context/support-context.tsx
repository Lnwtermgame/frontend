"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/use-local-storage';
import { useAuth } from '../hooks/use-auth';

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  category: 'account' | 'payment' | 'order' | 'technical' | 'other';
  status: 'open' | 'in-progress' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  responses: SupportResponse[];
  attachments?: string[];
}

export interface SupportResponse {
  id: string;
  ticketId: string;
  message: string;
  isStaff: boolean;
  createdAt: string;
  attachments?: string[];
  staffName?: string;
}

export interface ChatMessage {
  id: string;
  message: string;
  isUser: boolean;
  timestamp: string;
  read: boolean;
  agentName?: string;
}

type SupportContextType = {
  tickets: SupportTicket[];
  createTicket: (ticket: Omit<SupportTicket, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status' | 'responses'>) => Promise<SupportTicket>;
  updateTicket: (id: string, updates: Partial<SupportTicket>) => Promise<SupportTicket>;
  replyToTicket: (ticketId: string, message: string, attachments?: string[]) => Promise<SupportResponse>;
  closeTicket: (id: string) => Promise<SupportTicket>;
  chatHistory: ChatMessage[];
  sendChatMessage: (message: string) => Promise<void>;
  chatAvailable: boolean;
  isChatOpen: boolean;
  setChatOpen: (isOpen: boolean) => void;
  isAgentTyping: boolean;
  unreadMessages: number;
  markChatAsRead: () => void;
  faqCategories: string[];
  faqArticles: {
    id: string;
    title: string;
    content: string;
    category: string;
    tags: string[];
    helpful: number;
    views: number;
  }[];
};

export const SupportContext = createContext<SupportContextType | undefined>(undefined);

export function SupportProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id || 'guest';
  
  // Support tickets storage
  const [tickets, setTickets] = useLocalStorage<SupportTicket[]>('mali-gamepass-tickets', []);
  
  // Live chat state
  const [chatHistory, setChatHistory] = useLocalStorage<ChatMessage[]>('mali-gamepass-chat', []);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [chatAvailable, setChatAvailable] = useState(true);
  
  // FAQ Data
  const [faqCategories] = useState([
    'Account & Profile',
    'Payments & Billing',
    'Game Top-ups',
    'Gift Cards',
    'Technical Issues',
    'General Inquiries'
  ]);
  
  const [faqArticles] = useState([
    {
      id: '1',
      title: 'How to change my account email address',
      content: 'To change your email address, go to Account Settings > Personal Information > Edit Email. Follow the verification steps to confirm your new email address.',
      category: 'Account & Profile',
      tags: ['account', 'settings', 'email', 'profile'],
      helpful: 124,
      views: 2340
    },
    {
      id: '2',
      title: 'My payment was declined',
      content: 'If your payment was declined, please check: 1. Your card has sufficient funds, 2. The card details were entered correctly, 3. Your bank hasn\'t blocked the transaction. You can also try a different payment method.',
      category: 'Payments & Billing',
      tags: ['payment', 'declined', 'card', 'error'],
      helpful: 256,
      views: 5432
    },
    {
      id: '3',
      title: 'How long does it take to receive my game top-up?',
      content: 'Most game top-ups are processed instantly. However, during high traffic periods or server maintenance, it may take up to 15 minutes. If you haven\'t received your top-up after 30 minutes, please contact our support team.',
      category: 'Game Top-ups',
      tags: ['top-up', 'delay', 'delivery', 'game'],
      helpful: 189,
      views: 4120
    },
    {
      id: '4',
      title: 'Can I use MaliGamePass gift cards internationally?',
      content: 'Yes, MaliGamePass gift cards can be used globally. However, the currency conversion will be based on the current exchange rate, and some region-specific content may not be available based on your location.',
      category: 'Gift Cards',
      tags: ['gift card', 'international', 'region', 'currency'],
      helpful: 87,
      views: 1560
    }
  ]);

  // Calculate unread messages
  const unreadMessages = chatHistory.filter(msg => !msg.isUser && !msg.read).length;

  const markChatAsRead = () => {
    setChatHistory(current => 
      current.map(msg => !msg.isUser ? { ...msg, read: true } : msg)
    );
  };

  // Support ticket functions
  const createTicket = async (
    ticket: Omit<SupportTicket, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status' | 'responses'>
  ): Promise<SupportTicket> => {
    const now = new Date().toISOString();
    const newTicket: SupportTicket = {
      ...ticket,
      id: `ticket-${Date.now()}`,
      userId,
      status: 'open',
      createdAt: now,
      updatedAt: now,
      responses: []
    };
    
    setTickets(current => [newTicket, ...current]);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return newTicket;
  };

  const updateTicket = async (id: string, updates: Partial<SupportTicket>): Promise<SupportTicket> => {
    let updatedTicket: SupportTicket | undefined;
    
    setTickets(current =>
      current.map(ticket => {
        if (ticket.id === id) {
          updatedTicket = {
            ...ticket,
            ...updates,
            updatedAt: new Date().toISOString()
          };
          return updatedTicket;
        }
        return ticket;
      })
    );
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!updatedTicket) {
      throw new Error('Ticket not found');
    }
    
    return updatedTicket;
  };

  const replyToTicket = async (ticketId: string, message: string, attachments?: string[]): Promise<SupportResponse> => {
    const response: SupportResponse = {
      id: `response-${Date.now()}`,
      ticketId,
      message,
      isStaff: false,
      createdAt: new Date().toISOString(),
      attachments
    };
    
    setTickets(current =>
      current.map(ticket => {
        if (ticket.id === ticketId) {
          return {
            ...ticket,
            responses: [...ticket.responses, response],
            updatedAt: new Date().toISOString(),
            status: 'in-progress'
          };
        }
        return ticket;
      })
    );
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulate staff response after a delay
    setTimeout(() => {
      const staffResponse: SupportResponse = {
        id: `response-${Date.now() + 1}`,
        ticketId,
        message: `Thank you for your message. Our support team is reviewing your case and will respond shortly. Your ticket ID is ${ticketId}.`,
        isStaff: true,
        staffName: 'Support Team',
        createdAt: new Date().toISOString()
      };
      
      setTickets(current =>
        current.map(ticket => {
          if (ticket.id === ticketId) {
            return {
              ...ticket,
              responses: [...ticket.responses, staffResponse],
              updatedAt: new Date().toISOString()
            };
          }
          return ticket;
        })
      );
    }, 5000);
    
    return response;
  };

  const closeTicket = async (id: string): Promise<SupportTicket> => {
    let closedTicket: SupportTicket | undefined;
    
    setTickets(current =>
      current.map(ticket => {
        if (ticket.id === id) {
          closedTicket = {
            ...ticket,
            status: 'closed',
            updatedAt: new Date().toISOString()
          };
          return closedTicket;
        }
        return ticket;
      })
    );
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!closedTicket) {
      throw new Error('Ticket not found');
    }
    
    return closedTicket;
  };

  // Live chat functions
  const sendChatMessage = async (message: string): Promise<void> => {
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      message,
      isUser: true,
      timestamp: new Date().toISOString(),
      read: true
    };
    
    setChatHistory(current => [...current, userMessage]);
    
    // Simulate agent typing
    setIsAgentTyping(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const agentMessage: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      message: getAutomatedResponse(message),
      isUser: false,
      agentName: 'Support Agent',
      timestamp: new Date().toISOString(),
      read: isChatOpen
    };
    
    setChatHistory(current => [...current, agentMessage]);
    setIsAgentTyping(false);
  };

  // Helper function to generate automated responses
  const getAutomatedResponse = (message: string): string => {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey')) {
      return 'Hello there! How can I assist you today with MaliGamePass?';
    }
    
    if (lowerMsg.includes('payment') || lowerMsg.includes('pay') || lowerMsg.includes('transaction')) {
      return 'I see you have a question about payments. Could you provide more details about your issue? If it\'s about a specific transaction, please share the order ID if available.';
    }
    
    if (lowerMsg.includes('refund')) {
      return 'For refund requests, please provide your order ID and the reason for requesting a refund. Our team will review your request within 24-48 hours.';
    }
    
    if (lowerMsg.includes('game') || lowerMsg.includes('top up') || lowerMsg.includes('topup')) {
      return 'For game top-up issues, please let me know which game you\'re referring to and describe the problem you\'re experiencing. I\'ll do my best to help!';
    }
    
    if (lowerMsg.includes('card') || lowerMsg.includes('gift card') || lowerMsg.includes('code')) {
      return 'If you\'re having issues with a gift card or redemption code, please provide the last 4 digits of the code and describe the problem you\'re facing.';
    }
    
    return 'Thank you for contacting MaliGamePass support. How can I assist you with your gaming needs today?';
  };

  return (
    <SupportContext.Provider
      value={{
        tickets,
        createTicket,
        updateTicket,
        replyToTicket,
        closeTicket,
        chatHistory,
        sendChatMessage,
        chatAvailable,
        isChatOpen,
        setChatOpen: setIsChatOpen,
        isAgentTyping,
        unreadMessages,
        markChatAsRead,
        faqCategories,
        faqArticles
      }}
    >
      {children}
    </SupportContext.Provider>
  );
}

// Custom hook to use the support context
export function useSupport() {
  const context = useContext(SupportContext);
  if (context === undefined) {
    throw new Error('useSupport must be used within a SupportProvider');
  }
  return context;
} 
