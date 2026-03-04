"use client";

import { useState } from "react";
import { motion } from "@/lib/framer-exports";
import Link from "next/link";
import {
  MessageSquare,
  Mail,
  Phone,
  Globe,
  Send,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Headphones,
  Clock,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { usePublicSettings } from "@/lib/context/public-settings-context";
import { useTranslations } from "next-intl";

export default function ContactPage() {
  const t = useTranslations("SupportContact");
  const tFaq = useTranslations("SupportFAQ");
  const { settings } = usePublicSettings();
  const supportEmail =
    settings?.general.supportEmail || "support@lnwtermgame.com";
  const supportPhone = settings?.general.supportPhone || "+66 2 123 45678";
  const facebookUrl = settings?.social.facebookUrl || "#";
  const lineUrl = settings?.social.lineUrl || "#";
  const discordUrl = settings?.social.discordUrl || "#";

  // Mock FAQs - In a real app, these should be from translations or API
  const faqs = [
    {
      question: "How do I top up game credits?",
      answer: "You can top up game credits by navigating to the game page and choosing your package.",
    },
    {
      question: "How long does it take?",
      answer: "Most top-ups are processed instantly within 5-15 minutes.",
    },
  ];

  const contactCategories = [
    { value: "payment-issue", label: "Payment Issue" },
    { value: "missing-credits", label: "Missing Credits" },
    { value: "refund-request", label: "Refund Request" },
    { value: "other", label: "Other" },
  ];

  const [expandedFaqs, setExpandedFaqs] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    orderId: "",
    message: "",
  });
  const [formStatus, setFormStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  const toggleFaq = (index: number) => {
    if (expandedFaqs.includes(index)) {
      setExpandedFaqs(expandedFaqs.filter((i) => i !== index));
    } else {
      setExpandedFaqs([...expandedFaqs, index]);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus("submitting");

    setTimeout(() => {
      setFormStatus("success");
      setFormData({
        name: "",
        email: "",
        category: "",
        orderId: "",
        message: "",
      });

      setTimeout(() => {
        setFormStatus("idle");
      }, 5000);
    }, 1500);
  };

  return (
    <div className="page-container bg-brutal-gray">
      {/* Hero Section */}
      <motion.div
        className="bg-white border-[3px] border-black p-8 mb-8"
        style={{ boxShadow: "4px 4px 0 0 #000000" }}
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
              <h1 className="text-3xl md:text-4xl font-black text-black uppercase">
                {t("title")}
              </h1>
            </div>
            <p className="text-gray-600 font-bold uppercase">
              {t("subtitle")}
            </p>
          </motion.div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content - Contact form */}
        <div className="lg:col-span-2">
          <div
            className="bg-white border-[3px] border-black p-6 md:p-8"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <div className="flex items-center mb-6">
              <span className="w-1.5 h-5 bg-brutal-blue mr-2"></span>
              <h2 className="text-2xl font-black text-black uppercase">{t("form.title")}</h2>
            </div>

            {formStatus === "success" ? (
              <motion.div
                className="bg-brutal-green border-[3px] border-black p-6 text-center"
                style={{ boxShadow: "4px 4px 0 0 #000000" }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <CheckCircle size={48} className="mx-auto text-black mb-4" />
                <h3 className="text-xl font-black text-black mb-2 uppercase">
                  {t("form.success")}
                </h3>
                <button
                  onClick={() => setFormStatus("idle")}
                  className="bg-black text-white border-[3px] border-black px-6 py-3 font-black hover:bg-gray-800 transition-colors uppercase"
                  style={{ boxShadow: "4px 4px 0 0 #000000" }}
                >
                  Send Another Message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-gray-700 mb-2 font-black uppercase text-xs"
                    >
                      {t("form.name")}
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full py-3 px-4 bg-white border-[2px] border-black text-black focus:outline-none focus:bg-brutal-gray transition-colors font-bold"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-gray-700 mb-2 font-black uppercase text-xs"
                    >
                      {t("form.email")}
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full py-3 px-4 bg-white border-[2px] border-black text-black focus:outline-none focus:bg-brutal-gray transition-colors font-bold"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="category"
                      className="block text-gray-700 mb-2 font-black uppercase text-xs"
                    >
                      {t("form.subject")}
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full py-3 px-4 bg-white border-[2px] border-black text-black focus:outline-none focus:bg-brutal-gray transition-colors font-bold"
                    >
                      <option value="" disabled>
                        Select category
                      </option>
                      {contactCategories.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="orderId"
                      className="block text-gray-700 mb-2 font-black uppercase text-xs"
                    >
                      Order ID
                    </label>
                    <input
                      type="text"
                      id="orderId"
                      name="orderId"
                      value={formData.orderId}
                      onChange={handleInputChange}
                      className="w-full py-3 px-4 bg-white border-[2px] border-black text-black focus:outline-none focus:bg-brutal-gray transition-colors font-bold"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-gray-700 mb-2 font-black uppercase text-xs"
                  >
                    {t("form.message")}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full py-3 px-4 bg-white border-[2px] border-black text-black focus:outline-none focus:bg-brutal-gray transition-colors resize-none font-bold"
                    placeholder="Describe your issue"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={formStatus === "submitting"}
                  className={`bg-black text-white border-[3px] border-black px-6 py-3 font-black flex items-center justify-center hover:bg-gray-800 transition-colors uppercase ${formStatus === "submitting" ? "opacity-70 cursor-not-allowed" : ""}`}
                  style={{ boxShadow: "4px 4px 0 0 #000000" }}
                >
                  {formStatus === "submitting" ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      {t("form.sending")}
                    </>
                  ) : (
                    <>
                      <Send size={18} className="mr-2" />
                      {t("form.send")}
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* FAQs Preview */}
          <div
            className="mt-8 bg-white border-[3px] border-black p-6 md:p-8"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <div className="flex items-center mb-6">
              <span className="w-1.5 h-5 bg-brutal-yellow mr-2"></span>
              <HelpCircle className="text-black mr-3" />
              <h2 className="text-2xl font-black text-black uppercase">
                {tFaq("title")}
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className={`border-[2px] border-black overflow-hidden ${expandedFaqs.includes(index) ? "bg-brutal-gray" : "bg-white"}`}
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex justify-between items-center p-4 text-left font-black text-black focus:outline-none uppercase text-sm"
                  >
                    <span>{faq.question}</span>
                    {expandedFaqs.includes(index) ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                  </button>

                  {expandedFaqs.includes(index) && (
                    <div className="p-4 pt-0 text-gray-700 border-t-2 border-black font-bold">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/support/faq"
                className="text-black hover:underline inline-flex items-center font-black uppercase text-sm"
              >
                {tFaq("all")}
                <ChevronDown className="ml-1" size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* Sidebar - Contact info */}
        <div>
          <div
            className="bg-white border-[3px] border-black p-6 sticky top-4"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <div className="flex items-center mb-6">
              <span className="w-1.5 h-5 bg-brutal-pink mr-2"></span>
              <h2 className="text-xl font-black text-black uppercase">
                {t("title")}
              </h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-start">
                <div className="bg-brutal-yellow p-3 border-[2px] border-black mr-4 shadow-[2px_2px_0_0_#000]">
                  <Clock className="text-black" size={20} />
                </div>
                <div>
                  <h3 className="text-black font-black uppercase text-xs mb-1">Support Hours</h3>
                  <p className="text-gray-600 font-bold text-xs">
                    Mon - Fri: 9:00 - 22:00
                    <br />
                    Weekends: 10:00 - 20:00
                    <br />
                    (GMT+7 Bangkok)
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-brutal-blue p-3 border-[2px] border-black mr-4 shadow-[2px_2px_0_0_#000]">
                  <Mail className="text-black" size={20} />
                </div>
                <div>
                  <h3 className="text-black font-black uppercase text-xs mb-1">Email Support</h3>
                  <a
                    href={`mailto:${supportEmail}`}
                    className="text-black hover:underline font-bold text-sm block"
                  >
                    {supportEmail}
                  </a>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-brutal-green p-3 border-[2px] border-black mr-4 shadow-[2px_2px_0_0_#000]">
                  <MessageSquare className="text-black" size={20} />
                </div>
                <div>
                  <h3 className="text-black font-black uppercase text-xs mb-1">Live Chat</h3>
                  <p className="text-gray-600 font-bold text-xs">
                    Available during support hours via the chat icon below.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-brutal-pink p-3 border-[2px] border-black mr-4 shadow-[2px_2px_0_0_#000]">
                  <Phone className="text-black" size={20} />
                </div>
                <div>
                  <h3 className="text-black font-black uppercase text-xs mb-1">Phone Support</h3>
                  <a
                    href={`tel:${supportPhone}`}
                    className="text-black hover:underline font-bold text-sm"
                  >
                    {supportPhone}
                  </a>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-brutal-yellow p-3 border-[2px] border-black mr-4 shadow-[2px_2px_0_0_#000]">
                  <Globe className="text-black" size={20} />
                </div>
                <div>
                  <h3 className="text-black font-black uppercase text-xs mb-1">{t("social.title")}</h3>
                  <div className="flex space-x-3 mt-2">
                    <a
                      href={facebookUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-brutal-gray hover:bg-brutal-yellow p-2 border-[2px] border-black transition-colors shadow-[2px_2px_0_0_#000]"
                    >
                      <svg
                        className="w-5 h-5 text-black"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                      </svg>
                    </a>
                    <a
                      href={lineUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-brutal-gray hover:bg-brutal-green p-2 border-[2px] border-black transition-colors shadow-[2px_2px_0_0_#000]"
                    >
                      <span className="font-black text-xs">LINE</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-brutal-yellow border-[3px] border-black p-4 shadow-[4px_4px_0_0_#000]">
              <div className="flex items-center">
                <AlertCircle size={18} className="text-black mr-2" />
                <span className="text-black font-black uppercase text-xs">Important</span>
              </div>
              <p className="mt-2 text-gray-700 text-xs font-bold leading-relaxed uppercase">
                For fastest support response, please provide your order ID and
                any relevant screenshots.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
