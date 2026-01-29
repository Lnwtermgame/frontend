"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-exports';
import { useSupport } from '@/lib/context/support-context';
import { 
  MessageSquare, 
  X, 
  Send, 
  Smile, 
  Paperclip, 
  User,
  MoveUpRight,
  CheckCircle2,
} from 'lucide-react';

export function LiveChat() {
  const {
    chatHistory,
    sendChatMessage,
    isChatOpen,
    setChatOpen,
    isAgentTyping,
    unreadMessages,
    markChatAsRead
  } = useSupport();
  
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && isChatOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isChatOpen, isAgentTyping]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (isChatOpen && unreadMessages > 0) {
      markChatAsRead();
    }
  }, [isChatOpen, unreadMessages, markChatAsRead]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    sendChatMessage(message);
    setMessage('');
    
    // Focus back on input after sending
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleChat = () => {
    setChatOpen(!isChatOpen);
    
    // Focus on input when opening chat
    if (!isChatOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  };

  // Format timestamp to local time
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return '';
    }
  };

  return (
    <>
      {/* Chat Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={toggleChat}
          className="bg-mali-blue-accent hover:bg-mali-blue-accent/90 text-white p-3 rounded-full shadow-lg flex items-center justify-center relative transition-all duration-200 group"
        >
          <AnimatePresence>
            {isChatOpen ? (
              <motion.div
                key="close"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                <X size={24} />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageSquare size={24} />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Unread messages badge */}
          {!isChatOpen && unreadMessages > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
              {unreadMessages}
            </span>
          )}
        </button>
      </div>
      
      {/* Chat Panel */}
      <AnimatePresence>
        {isChatOpen && (
          <div className="fixed bottom-20 right-4 z-50 flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-mali-card border border-mali-blue/30 rounded-xl shadow-xl overflow-hidden w-80 md:w-96 max-h-[70vh] flex flex-col"
            >
              {/* Header */}
              <div className="bg-mali-blue-accent p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-white">Live Support</h3>
                  <p className="text-xs text-white/80">We typically reply in a few minutes</p>
                </div>
                <button
                  onClick={toggleChat}
                  className="text-white/80 hover:text-white p-1 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto min-h-[300px] max-h-[50vh]">
                {chatHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-mali-text-secondary">
                    <MessageSquare size={40} className="mb-4 text-mali-blue/40" />
                    <p className="mb-2">No messages yet</p>
                    <p className="text-sm">Send a message to start the conversation</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chatHistory.map((chat) => (
                      <div
                        key={chat.id}
                        className={`flex ${
                          chat.isUser ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {!chat.isUser && (
                          <div className="flex-shrink-0 mr-3">
                            <div className="w-8 h-8 rounded-full bg-mali-blue flex items-center justify-center text-white">
                              {chat.agentName ? chat.agentName.charAt(0) : 'S'}
                            </div>
                          </div>
                        )}
                        <div
                          className={`max-w-[70%] rounded-2xl p-3 ${
                            chat.isUser
                              ? 'bg-mali-blue-accent text-white rounded-tr-none'
                              : 'bg-mali-blue/20 text-white rounded-tl-none'
                          }`}
                        >
                          {!chat.isUser && (
                            <div className="text-xs text-mali-blue-accent mb-1">
                              {chat.agentName || 'Support Agent'}
                            </div>
                          )}
                          <p className="text-sm break-words">{chat.message}</p>
                          <div
                            className={`text-[10px] mt-1 flex justify-between items-center ${
                              chat.isUser ? 'text-white/70' : 'text-mali-text-secondary'
                            }`}
                          >
                            <span>{formatTime(chat.timestamp)}</span>
                            {chat.isUser && (
                              <CheckCircle2 size={12} className="ml-1" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Agent typing indicator */}
                    {isAgentTyping && (
                      <div className="flex justify-start">
                        <div className="flex-shrink-0 mr-3">
                          <div className="w-8 h-8 rounded-full bg-mali-blue flex items-center justify-center text-white">
                            S
                          </div>
                        </div>
                        <div className="bg-mali-blue/20 text-white rounded-2xl rounded-tl-none p-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Invisible div for scrolling to bottom */}
                    <div ref={messagesEndRef}></div>
                  </div>
                )}
              </div>
              
              {/* Input Area */}
              <form onSubmit={handleSubmit} className="p-3 border-t border-mali-blue/20 bg-mali-sidebar">
                <div className="flex space-x-2">
                  <div className="relative flex-grow">
                    <textarea
                      ref={inputRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your message..."
                      className="w-full py-2 px-3 bg-mali-blue/10 border border-mali-blue/20 rounded-lg text-white resize-none focus:outline-none focus:border-mali-blue-accent"
                      rows={1}
                      style={{ maxHeight: '100px' }}
                    />
                    <div className="absolute right-2 bottom-2 flex space-x-1">
                      <button
                        type="button"
                        className="text-mali-text-secondary hover:text-mali-blue-accent p-1 rounded-full"
                      >
                        <Smile size={16} />
                      </button>
                      <button
                        type="button"
                        className="text-mali-text-secondary hover:text-mali-blue-accent p-1 rounded-full"
                      >
                        <Paperclip size={16} />
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!message.trim()}
                    className={`p-2 rounded-lg ${
                      message.trim()
                        ? 'bg-mali-blue-accent hover:bg-mali-blue-accent/90 text-white'
                        : 'bg-mali-blue/20 text-mali-text-secondary cursor-not-allowed'
                    }`}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
} 
