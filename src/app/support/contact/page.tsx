"use client";

import { useState } from "react";
import { motion } from "@/lib/framer-exports";
import Link from "next/link";
import {
  MessageSquare, Mail, Phone, Globe, Send,
  HelpCircle, ChevronDown, ChevronUp, Headphones,
  Clock, AlertCircle, CheckCircle
} from "lucide-react";

// Mock FAQs
const faqs = [
  {
    question: "How do I top up game credits?",
    answer: "You can top up game credits by navigating to the game's page, selecting your desired top-up amount, and completing the payment process. We offer various payment methods including credit/debit cards, e-wallets, and bank transfers."
  },
  {
    question: "How long does it take to receive my game credits after payment?",
    answer: "Most top-ups are processed instantly and delivered automatically within 5 minutes. For some games, it might take up to 24 hours depending on the game server's processing time. If you haven't received your credits after 24 hours, please contact our support team."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept various payment methods including Visa, Mastercard, PayPal, regional e-wallets like GCash, GrabPay, and TrueMoney, as well as bank transfers and cryptocurrency. The available options will be shown during the checkout process."
  },
  {
    question: "How do I get a refund?",
    answer: "Refund policies vary depending on the game and the reason for the refund. In general, we can process refunds for unsuccessful or incorrect transactions. To request a refund, please fill out our contact form with your order details and reason for refund."
  },
  {
    question: "My payment went through but I didn't receive my game credits. What should I do?",
    answer: "First, please wait for 15-30 minutes as there might be a slight delay in processing. If you still haven't received your credits, check your order history for the status. If the status shows 'Completed' but you haven't received your credits, please contact our support team with your order ID."
  },
  {
    question: "Do you offer any discounts or promotions?",
    answer: "Yes, we regularly offer discounts and promotions! You can check our Flash Sales page for limited-time offers. We also have a Cashback program and a Referral program where you can earn credits by inviting friends. Make sure to subscribe to our newsletter and follow our social media for the latest promotions."
  }
];

// Contact form categories
const contactCategories = [
  { value: "payment-issue", label: "Payment Issue" },
  { value: "missing-credits", label: "Missing Credits" },
  { value: "refund-request", label: "Refund Request" },
  { value: "account-issue", label: "Account Issue" },
  { value: "technical-issue", label: "Technical Issue" },
  { value: "feedback", label: "Feedback" },
  { value: "partnership", label: "Partnership Inquiry" },
  { value: "other", label: "Other" },
];

export default function ContactPage() {

  const [expandedFaqs, setExpandedFaqs] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    orderId: "",
    message: "",
  });
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const toggleFaq = (index: number) => {
    if (expandedFaqs.includes(index)) {
      setExpandedFaqs(expandedFaqs.filter(i => i !== index));
    } else {
      setExpandedFaqs([...expandedFaqs, index]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('submitting');

    // Simulate API call
    setTimeout(() => {
      // Mock successful submission
      setFormStatus('success');
      setFormData({
        name: "",
        email: "",
        category: "",
        orderId: "",
        message: "",
      });

      // Reset form status after 5 seconds
      setTimeout(() => {
        setFormStatus('idle');
      }, 5000);
    }, 1500);
  };

  return (
    <div className="page-container bg-brutal-gray">
      {/* Hero Section */}
      <motion.div
        className="bg-white border-[3px] border-black rounded-xl p-8 mb-8"
        style={{ boxShadow: '4px 4px 0 0 #000000' }}
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
              <div className="bg-brutal-blue p-3 border-[3px] border-black mr-3">
                <Headphones className="h-8 w-8 text-black" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-black">Contact Support</h1>
            </div>
            <p className="text-gray-600 mb-6">
              Need help with your order or have questions about our service? Our support team is here to help.
            </p>
          </motion.div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content - Contact form */}
        <div className="lg:col-span-2">
          <div className="bg-white border-[3px] border-black rounded-xl p-6 md:p-8" style={{ boxShadow: '4px 4px 0 0 #000000' }}>
            <div className="flex items-center mb-6">
              <span className="w-1.5 h-5 bg-brutal-blue mr-2"></span>
              <h2 className="text-2xl font-bold text-black">Get in Touch</h2>
            </div>

            {formStatus === 'success' ? (
              <motion.div
                className="bg-brutal-green border-[3px] border-black rounded-xl p-6 text-center"
                style={{ boxShadow: '4px 4px 0 0 #000000' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <CheckCircle size={48} className="mx-auto text-black mb-4" />
                <h3 className="text-xl font-bold text-black mb-2">Message Sent!</h3>
                <p className="text-gray-600 mb-6">Thank you for contacting us. Our support team will get back to you within 24 hours.</p>
                <button
                  onClick={() => setFormStatus('idle')}
                  className="bg-black text-white border-[3px] border-black px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                  style={{ boxShadow: '4px 4px 0 0 #000000' }}
                >
                  Send Another Message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-gray-700 mb-2 font-medium">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full py-3 px-4 bg-white border-[2px] border-gray-300 rounded-lg text-black focus:outline-none focus:border-black transition-colors"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-gray-700 mb-2 font-medium">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full py-3 px-4 bg-white border-[2px] border-gray-300 rounded-lg text-black focus:outline-none focus:border-black transition-colors"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="category" className="block text-gray-700 mb-2 font-medium">Issue Category</label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full py-3 px-4 bg-white border-[2px] border-gray-300 rounded-lg text-black focus:outline-none focus:border-black transition-colors"
                    >
                      <option value="" disabled>Select a category</option>
                      {contactCategories.map(category => (
                        <option key={category.value} value={category.value}>{category.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="orderId" className="block text-gray-700 mb-2 font-medium">Order ID (if applicable)</label>
                    <input
                      type="text"
                      id="orderId"
                      name="orderId"
                      value={formData.orderId}
                      onChange={handleInputChange}
                      className="w-full py-3 px-4 bg-white border-[2px] border-gray-300 rounded-lg text-black focus:outline-none focus:border-black transition-colors"
                      placeholder="Enter order ID (optional)"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-gray-700 mb-2 font-medium">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full py-3 px-4 bg-white border-[2px] border-gray-300 rounded-lg text-black focus:outline-none focus:border-black transition-colors resize-none"
                    placeholder="Describe your issue in detail"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={formStatus === 'submitting'}
                  className={`bg-black text-white border-[3px] border-black px-6 py-3 rounded-lg font-medium flex items-center justify-center hover:bg-gray-800 transition-colors ${formStatus === 'submitting' ? 'opacity-70 cursor-not-allowed' : ''}`}
                  style={{ boxShadow: '4px 4px 0 0 #000000' }}
                >
                  {formStatus === 'submitting' ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} className="mr-2" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* FAQs */}
          <div className="mt-8 bg-white border-[3px] border-black rounded-xl p-6 md:p-8" style={{ boxShadow: '4px 4px 0 0 #000000' }}>
            <div className="flex items-center mb-6">
              <span className="w-1.5 h-5 bg-brutal-yellow mr-2"></span>
              <HelpCircle className="text-black mr-3" />
              <h2 className="text-2xl font-bold text-black">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className={`border-[2px] border-black rounded-lg overflow-hidden ${expandedFaqs.includes(index) ? 'bg-brutal-gray' : 'bg-white'}`}
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex justify-between items-center p-4 text-left font-medium text-black focus:outline-none"
                  >
                    <span>{faq.question}</span>
                    {expandedFaqs.includes(index) ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                  </button>

                  {expandedFaqs.includes(index) && (
                    <div className="p-4 pt-0 text-gray-700 border-t-2 border-black">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <Link href="/support/faq" className="text-black hover:underline inline-flex items-center font-medium">
                View All FAQs
                <ChevronDown className="ml-1" size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* Sidebar - Contact info */}
        <div>
          <div className="bg-white border-[3px] border-black rounded-xl p-6 sticky top-4" style={{ boxShadow: '4px 4px 0 0 #000000' }}>
            <div className="flex items-center mb-6">
              <span className="w-1.5 h-5 bg-brutal-pink mr-2"></span>
              <h2 className="text-xl font-bold text-black">Contact Information</h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-start">
                <div className="bg-brutal-yellow p-3 border-[2px] border-black mr-4">
                  <Clock className="text-black" size={20} />
                </div>
                <div>
                  <h3 className="text-black font-medium mb-1">Support Hours</h3>
                  <p className="text-gray-600">
                    Monday - Friday: 9:00 AM - 10:00 PM<br />
                    Weekends & Holidays: 10:00 AM - 8:00 PM<br />
                    (GMT+7 Bangkok Time)
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-brutal-blue p-3 border-[2px] border-black mr-4">
                  <Mail className="text-black" size={20} />
                </div>
                <div>
                  <h3 className="text-black font-medium mb-1">Email Support</h3>
                  <p className="text-gray-600 mb-1">For general inquiries:</p>
                  <a href="mailto:support@maligamepass.com" className="text-black hover:underline font-medium">support@maligamepass.com</a>

                  <p className="text-gray-600 mt-2 mb-1">For business partnerships:</p>
                  <a href="mailto:partners@maligamepass.com" className="text-black hover:underline font-medium">partners@maligamepass.com</a>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-brutal-green p-3 border-[2px] border-black mr-4">
                  <MessageSquare className="text-black" size={20} />
                </div>
                <div>
                  <h3 className="text-black font-medium mb-1">Live Chat</h3>
                  <p className="text-gray-600">Available during support hours. Click the chat icon in the bottom right corner to start a conversation.</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-brutal-pink p-3 border-[2px] border-black mr-4">
                  <Phone className="text-black" size={20} />
                </div>
                <div>
                  <h3 className="text-black font-medium mb-1">Phone Support</h3>
                  <p className="text-gray-600 mb-1">Customer Service Hotline:</p>
                  <a href="tel:+66212345678" className="text-black hover:underline font-medium">+66 2 123 45678</a>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-brutal-yellow p-3 border-[2px] border-black mr-4">
                  <Globe className="text-black" size={20} />
                </div>
                <div>
                  <h3 className="text-black font-medium mb-1">Social Media</h3>
                  <div className="flex space-x-3 mt-2">
                    <a href="#" className="bg-brutal-gray hover:bg-gray-200 p-2 border-[2px] border-black rounded-lg transition-colors">
                      <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                      </svg>
                    </a>
                    <a href="#" className="bg-brutal-gray hover:bg-gray-200 p-2 border-[2px] border-black rounded-lg transition-colors">
                      <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                      </svg>
                    </a>
                    <a href="#" className="bg-brutal-gray hover:bg-gray-200 p-2 border-[2px] border-black rounded-lg transition-colors">
                      <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                      </svg>
                    </a>
                    <a href="#" className="bg-brutal-gray hover:bg-gray-200 p-2 border-[2px] border-black rounded-lg transition-colors">
                      <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.194-.01 1.108-.082 2.06l-.008.105-.009.104c-.05.572-.124 1.14-.235 1.558a2.007 2.007 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.007 2.007 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31.4 31.4 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.003-.052.008-.104.022-.26.01-.104c.048-.519.119-1.023.22-1.402a2.007 2.007 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007.172-.006.086-.003.171-.007A99.788 99.788 0 0 1 7.858 2h.193zM6.4 5.209v4.818l4.157-2.408L6.4 5.209z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-brutal-yellow border-[2px] border-black rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle size={18} className="text-black mr-2" />
                <span className="text-black font-medium">Important Note</span>
              </div>
              <p className="mt-2 text-gray-700 text-sm">
                For fastest support response, please provide your order ID and any relevant screenshots of the issue you're experiencing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
