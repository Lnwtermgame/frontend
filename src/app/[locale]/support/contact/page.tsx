"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  MessageCircle,
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
import { getSecureExternalUrl } from "@/lib/secure-external-url";
import { useTranslations } from "next-intl";

export default function ContactPage() {
  const t = useTranslations("SupportContact");
  const tFaq = useTranslations("SupportFAQ");
  const { settings } = usePublicSettings();
  const supportEmail =
    settings?.general.supportEmail || "support@lnwtermgame.com";
  const supportPhone = settings?.general.supportPhone || "+66 2 123 45678";
  const facebookUrl = settings?.social.facebookUrl || "#";
  const discordUrl = settings?.social.discordUrl || "#";
  const lineUrl = getSecureExternalUrl(settings?.social.lineUrl);

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

  const submitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (submitTimerRef.current) clearTimeout(submitTimerRef.current);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus("submitting");

    submitTimerRef.current = setTimeout(() => {
      setFormStatus("success");
      setFormData({
        name: "",
        email: "",
        category: "",
        orderId: "",
        message: "",
      });

      resetTimerRef.current = setTimeout(() => {
        setFormStatus("idle");
      }, 5000);
    }, 1500);
  };

  return (
    <div className="page-container bg-transparent">
      {/* Hero Section */}
      <div className="bg-site-surface border border-site-border rounded-8 p-8 mb-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-site-accent p-3 border border-site-border rounded-8 mr-3">
              <Headphones className="h-8 w-8 text-site-text" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-site-text uppercase">
              {t("title")}
            </h1>
          </div>
          <p className="text-site-muted font-bold uppercase">
            {t("subtitle")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content - Contact form */}
        <div className="lg:col-span-2">
          <div className="bg-site-surface border border-site-border rounded-8 p-6 md:p-8">
            <div className="flex items-center mb-6">
              <span className="w-1.5 h-5 bg-site-accent mr-2"></span>
              <h2 className="text-2xl font-extrabold text-site-text uppercase">{t("form.title")}</h2>
            </div>

            {formStatus === "success" ? (
              <div className="bg-status-success/15 border border-status-success/20 rounded-8 p-6 text-center">
                <CheckCircle size={48} className="mx-auto text-status-success mb-4" />
                <h3 className="text-xl font-bold text-site-text mb-2 uppercase">
                  {t("form.success")}
                </h3>
                <button
                  onClick={() => setFormStatus("idle")}
                  className="bg-site-surface border border-site-border-soft text-site-muted hover:text-site-text hover:border-site-border rounded-8 px-6 py-3 font-bold transition-colors uppercase"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-site-muted mb-2 font-bold uppercase text-xs"
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
                      className="site-input w-full"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-site-muted mb-2 font-bold uppercase text-xs"
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
                      className="site-input w-full"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="category"
                      className="block text-site-muted mb-2 font-bold uppercase text-xs"
                    >
                      {t("form.subject")}
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="site-input w-full"
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
                      className="block text-site-muted mb-2 font-bold uppercase text-xs"
                    >
                      Order ID
                    </label>
                    <input
                      type="text"
                      id="orderId"
                      name="orderId"
                      value={formData.orderId}
                      onChange={handleInputChange}
                      className="site-input w-full"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-site-muted mb-2 font-bold uppercase text-xs"
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
                    className="site-input w-full resize-none"
                    placeholder="Describe your issue"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={formStatus === "submitting"}
                  className={`site-btn inline-flex ${formStatus === "submitting" ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  {formStatus === "submitting" ? (
                    <>
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
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
          <div className="mt-8 bg-site-surface border border-site-border rounded-8 p-6 md:p-8">
            <div className="flex items-center mb-6">
              <span className="w-1.5 h-5 bg-status-warning mr-2"></span>
              <HelpCircle className="text-site-text mr-3" />
              <h2 className="text-2xl font-extrabold text-site-text uppercase">
                {tFaq("title")}
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className={`border border-site-border overflow-hidden ${expandedFaqs.includes(index) ? "bg-site-raised" : "bg-site-surface"}`}
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex justify-between items-center p-4 text-left font-bold text-site-text focus:outline-none uppercase text-sm"
                  >
                    <span>{faq.question}</span>
                    {expandedFaqs.includes(index) ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                  </button>

                  {expandedFaqs.includes(index) && (
                    <div className="p-4 pt-0 text-site-muted border-t border-site-border-soft font-bold">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/support/faq"
                className="text-site-text hover:underline inline-flex items-center font-bold uppercase text-sm"
              >
                {tFaq("all")}
                <ChevronDown className="ml-1" size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* Sidebar - Contact info */}
        <div>
          <div className="bg-site-surface border border-site-border rounded-8 p-6 sticky top-4">
            <div className="flex items-center mb-6">
              <span className="w-1.5 h-5 bg-site-accent mr-2"></span>
              <h2 className="text-xl font-bold text-site-text uppercase">
                {t("title")}
              </h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-start">
                <div className="bg-status-warning/15 p-3 border border-site-border mr-4">
                  <Clock className="text-status-warning" size={20} />
                </div>
                <div>
                  <h3 className="text-site-text font-bold uppercase text-xs mb-1">Support Hours</h3>
                  <p className="text-site-muted font-bold text-xs">
                    Mon - Fri: 9:00 - 22:00
                    <br />
                    Weekends: 10:00 - 20:00
                    <br />
                    (GMT+7 Bangkok)
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-site-accent/15 p-3 border border-site-border mr-4">
                  <Mail className="text-site-accent" size={20} />
                </div>
                <div>
                  <h3 className="text-site-text font-bold uppercase text-xs mb-1">Email Support</h3>
                  <a
                    href={`mailto:${supportEmail}`}
                    className="text-site-text hover:underline font-bold text-sm block"
                  >
                    {supportEmail}
                  </a>
                </div>
              </div>

              {lineUrl && (
                <div className="flex items-start">
                  <div className="bg-status-success/15 p-3 border border-site-border mr-4">
                    <MessageCircle className="text-status-success" size={20} />
                  </div>
                  <div>
                    <h3 className="text-site-text font-bold uppercase text-xs mb-1">LINE Support</h3>
                    <a
                      href={lineUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-site-text hover:underline font-bold text-sm"
                    >
                      Contact us on LINE
                    </a>
                  </div>
                </div>
              )}

              <div className="flex items-start">
                <div className="bg-site-accent/15 p-3 border border-site-border mr-4">
                  <Phone className="text-site-accent" size={20} />
                </div>
                <div>
                  <h3 className="text-site-text font-bold uppercase text-xs mb-1">Phone Support</h3>
                  <a
                    href={`tel:${supportPhone}`}
                    className="text-site-text hover:underline font-bold text-sm"
                  >
                    {supportPhone}
                  </a>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-status-warning/15 p-3 border border-site-border mr-4">
                  <Globe className="text-status-warning" size={20} />
                </div>
                <div>
                  <h3 className="text-site-text font-bold uppercase text-xs mb-1">{t("social.title")}</h3>
                  <div className="flex space-x-3 mt-2">
                    <a
                      href={facebookUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-site-raised hover:bg-site-surface p-2 border border-site-border transition-colors"
                    >
                      <svg
                        className="w-5 h-5 text-site-text"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                      </svg>
                    </a>
                    {lineUrl && (
                      <a
                        href={lineUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-site-raised hover:bg-site-surface p-2 border border-site-border transition-colors"
                      >
                        <span className="font-bold text-xs">LINE</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-status-warning/15 border border-status-warning/20 rounded-8 p-4">
              <div className="flex items-center">
                <AlertCircle size={18} className="text-status-warning mr-2" />
                <span className="text-status-warning font-bold uppercase text-xs">Important</span>
              </div>
              <p className="mt-2 text-site-muted text-xs font-bold leading-relaxed uppercase">
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
