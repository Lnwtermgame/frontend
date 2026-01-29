"use client";

import { useState } from 'react';
import { motion } from '@/lib/framer-exports';
import { useSupport } from '@/lib/context/support-context';
import {
  TicketPlus,
  Search,
  HelpCircle,
  Tag,
  MessageSquare,
  Clock,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Mail,
  FileText,
  AlertCircle,
  Phone,
  PanelRight,
  ChevronRight,
  Headphones
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from "@/lib/context/language-context";

// Support category tiles
const supportCategories = [
  {
    icon: <MessageSquare className="h-6 w-6 text-mali-blue-accent" />,
    title: "Live Chat",
    description: "Chat with our support team in real-time",
    link: "#livechat", // Anchor to trigger live chat
    isExternal: false,
    priority: "Fastest Response"
  },
  {
    icon: <Mail className="h-6 w-6 text-mali-blue-accent" />,
    title: "Contact Support",
    description: "Send us a message about your issue",
    link: "/support/contact",
    isExternal: false,
    priority: "Response within 24h"
  },
  {
    icon: <HelpCircle className="h-6 w-6 text-mali-blue-accent" />,
    title: "FAQ",
    description: "Find answers to common questions",
    link: "/support/faq",
    isExternal: false,
    priority: "Self Service"
  },
  {
    icon: <Phone className="h-6 w-6 text-mali-blue-accent" />,
    title: "Call Us",
    description: "Speak directly with our support team",
    link: "tel:+66212345678",
    isExternal: true,
    priority: "Business Hours Only"
  },
  {
    icon: <FileText className="h-6 w-6 text-mali-blue-accent" />,
    title: "Help Guides",
    description: "Detailed guides for using our platform",
    link: "/support/guides",
    isExternal: false,
    priority: "Self Service"
  },
  {
    icon: <PanelRight className="h-6 w-6 text-mali-blue-accent" />,
    title: "Ticket System",
    description: "Track your support tickets",
    link: "/support/tickets",
    isExternal: false,
    priority: "Response within 24h"
  }
];

// Quick help topics
const quickHelpTopics = [
  {
    title: "I haven't received my game credits",
    link: "/support/guides/missing-credits"
  },
  {
    title: "How do I request a refund?",
    link: "/support/guides/refund-process"
  },
  {
    title: "My payment failed but I was charged",
    link: "/support/guides/payment-issues"
  },
  {
    title: "How do I change my account details",
    link: "/support/guides/account-settings"
  },
  {
    title: "How to redeem a gift code",
    link: "/support/guides/redeem-code"
  },
  {
    title: "Why is my account locked?",
    link: "/support/guides/account-security"
  }
];

export default function SupportPage() {
  const { 
    tickets, 
    createTicket,
    faqCategories,
    faqArticles
  } = useSupport();
  
  const [activeTab, setActiveTab] = useState<'tickets' | 'faq'>('tickets');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // New ticket form state
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketCategory, setTicketCategory] = useState<'account' | 'payment' | 'order' | 'technical' | 'other'>('account');
  const [ticketPriority, setTicketPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { t } = useTranslations();

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticketSubject || !ticketMessage) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await createTicket({
        subject: ticketSubject,
        message: ticketMessage,
        category: ticketCategory,
        priority: ticketPriority
      });
      
      setTicketSubject('');
      setTicketMessage('');
      setTicketCategory('account');
      setTicketPriority('medium');
      setShowNewTicketForm(false);
      setSuccessMessage('Your support ticket has been created successfully');
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      
    } catch (error) {
      console.error('Error creating ticket:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter tickets based on search query
  const filteredTickets = tickets.filter(ticket =>
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter FAQ based on search query and selected category
  const filteredFaqs = faqArticles.filter(article =>
    (selectedCategory ? article.category === selectedCategory : true) &&
    (searchQuery ? 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      : true
    )
  );
  
  // Helper function to get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-900/30 text-blue-400 border-blue-500/20';
      case 'in-progress':
        return 'bg-amber-900/30 text-amber-400 border-amber-500/20';
      case 'closed':
        return 'bg-green-900/30 text-green-400 border-green-500/20';
      default:
        return 'bg-mali-blue/20 text-mali-blue-accent border-mali-blue/20';
    }
  };
  
  // Helper function to get priority badge color
  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-900/30 text-red-400 border-red-500/20';
      case 'medium':
        return 'bg-amber-900/30 text-amber-400 border-amber-500/20';
      case 'low':
        return 'bg-green-900/30 text-green-400 border-green-500/20';
      default:
        return 'bg-mali-blue/20 text-mali-blue-accent border-mali-blue/20';
    }
  };

  const openLiveChat = () => {
    // Would typically trigger the live chat widget
    console.log("Opening live chat");
    alert("Live Chat would open here");
  };

  return (
    <div className="page-container">
      {/* Hero Section */}
      <motion.div 
        className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border border-mali-blue/30 rounded-xl p-8 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center justify-center mb-4">
              <Headphones className="h-8 w-8 text-mali-blue-accent mr-3" />
              <h1 className="text-3xl md:text-4xl font-bold text-white">Customer Support</h1>
            </div>
            <p className="text-gray-300 mb-6">
              Need help? Our support team is here to assist you with any questions or issues.
            </p>
            
            {/* Search box */}
            <div className="max-w-md mx-auto mt-6">
              <div className="relative">
            <input
              type="text"
                  placeholder="Search for help..."
                  className="w-full py-3 px-5 pl-12 bg-mali-blue/20 border border-mali-blue/30 rounded-xl text-white focus:outline-none focus:border-mali-blue-accent focus:ring-1 focus:ring-mali-blue-accent"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-mali-text-secondary" size={18} />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
            
      {/* Support Options */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">How Can We Help?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {supportCategories.map((category, index) => (
              <motion.div
              key={index}
              className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
            >
              {category.isExternal || category.link.startsWith('#') ? (
                <a 
                  href={category.link}
                  onClick={category.link === '#livechat' ? openLiveChat : undefined}
                  target={category.isExternal ? "_blank" : undefined}
                  rel={category.isExternal ? "noopener noreferrer" : undefined}
                  className="block p-6"
                >
                  <div className="flex items-start">
                    <div className="bg-mali-blue/10 p-3 rounded-lg">
                      {category.icon}
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <h3 className="text-white font-bold text-lg">{category.title}</h3>
                        <span className="ml-2 text-xs bg-mali-blue/30 text-mali-blue-accent px-2 py-0.5 rounded-full">
                          {category.priority}
                        </span>
                      </div>
                      <p className="text-mali-text-secondary mt-1">
                        {category.description}
                      </p>
                      <div className="flex items-center mt-3 text-mali-blue-accent group-hover:text-mali-blue-accent/80 transition-colors">
                        <span className="text-sm font-medium">Get help</span>
                        <ChevronRight size={16} className="ml-1" />
                      </div>
                    </div>
                  </div>
                </a>
              ) : (
                <Link href={category.link} className="block p-6">
                  <div className="flex items-start">
                    <div className="bg-mali-blue/10 p-3 rounded-lg">
                      {category.icon}
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <h3 className="text-white font-bold text-lg">{category.title}</h3>
                        <span className="ml-2 text-xs bg-mali-blue/30 text-mali-blue-accent px-2 py-0.5 rounded-full">
                          {category.priority}
                        </span>
                      </div>
                      <p className="text-mali-text-secondary mt-1">
                        {category.description}
                      </p>
                      <div className="flex items-center mt-3 text-mali-blue-accent group-hover:text-mali-blue-accent/80 transition-colors">
                        <span className="text-sm font-medium">Get help</span>
                        <ChevronRight size={16} className="ml-1" />
                      </div>
                      </div>
                    </div>
                  </Link>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Support hours and quick links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Support hours */}
        <div className="lg:col-span-1">
          <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-6 md:p-8">
            <div className="flex items-center mb-4">
              <Clock className="text-mali-blue-accent mr-3" />
              <h2 className="text-xl font-bold text-white">Support Hours</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-mali-text-secondary font-medium mb-2">Live Chat & Phone Support</h3>
                <p className="text-white">
                  Monday - Friday: 9:00 AM - 10:00 PM<br />
                  Weekends & Holidays: 10:00 AM - 8:00 PM
                </p>
                <p className="text-mali-text-secondary text-sm mt-1">(GMT+7 Bangkok Time)</p>
              </div>
              
              <div>
                <h3 className="text-mali-text-secondary font-medium mb-2">Email Support</h3>
                <p className="text-white">24/7 - Response within 24 hours</p>
              </div>
            </div>
            
            <div className="mt-6 border-t border-mali-blue/20 pt-6">
              <div className="flex items-center">
                <AlertCircle size={18} className="text-mali-blue-accent mr-2" />
                <span className="text-white font-medium">Need Urgent Help?</span>
                  </div>
              <p className="mt-2 text-mali-text-secondary">
                For urgent issues with orders or payments, please use Live Chat during support hours for the fastest response.
                  </p>
                </div>
                                </div>
                              </div>
        
        {/* Quick Help Topics */}
        <div className="lg:col-span-2">
          <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-6 md:p-8">
            <h2 className="text-xl font-bold text-white mb-6">Quick Help Topics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickHelpTopics.map((topic, index) => (
                <Link 
                  key={index}
                  href={topic.link}
                  className="bg-mali-blue/10 hover:bg-mali-blue/20 border border-mali-blue/30 rounded-lg p-4 flex justify-between items-center transition-colors"
                >
                  <span className="text-white">{topic.title}</span>
                  <ChevronRight size={18} className="text-mali-text-secondary" />
                </Link>
                  ))}
                </div>
          </div>
          
          {/* Additional Info */}
          <div className="mt-6 bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-mali-blue/30 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <MessageSquare className="text-mali-blue-accent mr-2" />
              <h3 className="text-lg font-bold text-white">Feedback & Suggestions</h3>
            </div>
            <p className="text-mali-text-secondary mb-4">
              We're always looking to improve our service. If you have any suggestions or feedback, we'd love to hear from you!
            </p>
            <Link 
              href="/support/feedback"
              className="inline-flex items-center text-mali-blue-accent hover:underline"
            >
              Share your feedback
              <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 