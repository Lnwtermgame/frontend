"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";

export type Locale = "en" | "th";

type LanguageContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  isLoaded: boolean;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Create sync DOM updater function that will be executed before React renders
const updateDOMLanguage = (locale: Locale) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale;
    document.documentElement.setAttribute('data-language', locale);

    if (locale === 'th') {
      document.documentElement.classList.add('thai-font');
      document.body?.classList.add('thai-font');
    } else {
      document.documentElement.classList.remove('thai-font');
      document.body?.classList.remove('thai-font');
    }
  }
};

// Set a global variable to store current language state
if (typeof window !== 'undefined') {
  (window as any).__LANGUAGE_STATE__ = {
    locale: 'en',
    updatedDOM: false
  };
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Initialize with document's current language if hydrating
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize state with default value to avoid SSR issues
  const [locale, setLocaleState] = useState<Locale>("en");

  // Effect to load locale from localStorage after mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !isHydrated) {
      const savedLocale = window.localStorage.getItem("locale") as Locale | null;
      const initialLocale = (savedLocale && ["en", "th"].includes(savedLocale))
        ? savedLocale
        : (navigator.language?.startsWith("th") ? "th" : "en");

      // Update our global state
      (window as any).__LANGUAGE_STATE__ = {
        locale: initialLocale,
        updatedDOM: false
      };

      setLocaleState(initialLocale);
      setIsHydrated(true);
    }
  }, [isHydrated]);

  // Wrapper for setLocale that updates DOM synchronously before React re-renders
  const setLocale = useCallback((newLocale: Locale) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      // Update global state
      (window as any).__LANGUAGE_STATE__ = {
        locale: newLocale,
        updatedDOM: true
      };

      // Sync update DOM
      updateDOMLanguage(newLocale);

      // Store in localStorage
      window.localStorage.setItem("locale", newLocale);

      // Update React state (will cause re-render)
      setLocaleState(newLocale);
    }
  }, []);

  // Toggle function
  const toggleLocale = useCallback(() => {
    const newLocale = locale === "en" ? "th" : "en";
    setLocale(newLocale);
  }, [locale, setLocale]);

  // Initial DOM update and hydration handling
  useEffect(() => {
    if (!isHydrated && typeof window !== 'undefined' && window.localStorage) {
      // Synchronously update DOM on first render
      const savedLocale = window.localStorage.getItem("locale") as Locale | null;
      const browserLocale = navigator.language?.startsWith("th") ? "th" : "en";
      const initialLocale = (savedLocale && ["en", "th"].includes(savedLocale))
        ? savedLocale
        : browserLocale;

      // Only update DOM if not already done by global script
      if (!(window as any).__LANGUAGE_STATE__?.updatedDOM) {
        updateDOMLanguage(initialLocale);
      }

      // Set React state without causing a re-render
      if (initialLocale !== locale) {
        setLocaleState(initialLocale);
      }

      setIsHydrated(true);
    }
  }, [locale, isHydrated]);

  // Mark as loaded after hydration and DOM is updated
  useEffect(() => {
    if (isHydrated && !isLoaded) {
      const timer = setTimeout(() => {
        setIsLoaded(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isHydrated, isLoaded]);

  // Ensure document lang and classes stay in sync with state
  useEffect(() => {
    if (isHydrated) {
      updateDOMLanguage(locale);
    }
  }, [locale, isHydrated]);

  // Font loading handling
  useEffect(() => {
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(() => {
        document.documentElement.classList.add('fonts-loaded');
      });
    }
  }, []);

  // Create memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    locale,
    setLocale,
    toggleLocale,
    isLoaded
  }), [locale, setLocale, toggleLocale, isLoaded]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

// Translation dictionaries
export const translations = {
  en: {
    home: "Home",
    allGames: "All Games",
    myOrders: "My Orders",
    giftCards: "Gift Cards",
    myAccount: "My Account",
    topUp: "Top Up",
    directTopup: "Direct Topup",
    card: "Card",
    myCards: "My Cards",
    myInvoice: "My Invoice",
    balance: "Balance",
    credits: "Credits",
    myCoupons: "My Coupons",
    myFavorite: "My Favorite",
    myLuckyDraw: "My Lucky Draw",
    notifications: "Notifications",
    support: "Support",
    menu: "Menu",
    logout: "Logout",
    english: "English",
    thai: "Thai",
    // Add promotions-related translations
    flashSales: "Flash Sales",
    cashback: "Cashback",
    referral: "Refer & Earn",
    // Add support-related translations
    contactSupport: "Contact Support",
    faq: "FAQ",
    // Admin translations
    "Admin Dashboard": "Admin Dashboard",
    "Total Sales": "Total Sales",
    "Orders": "Orders",
    "Products": "Products",
    "Users": "Users",
    "Recent Transactions": "Recent Transactions",
    "View All Transactions": "View All Transactions",
    "Sales Overview": "Sales Overview",
    "Sales chart visualization will appear here": "Sales chart visualization will appear here",
    "Top Products": "Top Products",
    adminDashboard: "Dashboard",
    adminProducts: "Products",
    adminPromotions: "Promotions",
    adminResellers: "Resellers",
    adminReports: "Reports",
    adminSettings: "Settings"
  },
  th: {
    home: "หน้าหลัก",
    allGames: "เกมทั้งหมด",
    myOrders: "คำสั่งซื้อของฉัน",
    giftCards: "บัตรของขวัญ",
    myAccount: "บัญชีของฉัน",
    topUp: "เติมเงิน",
    directTopup: "เติมเงินโดยตรง",
    card: "บัตร",
    myCards: "บัตรของฉัน",
    myInvoice: "ใบแจ้งหนี้ของฉัน",
    balance: "ยอดเงินคงเหลือ",
    credits: "เครดิต",
    myCoupons: "คูปองของฉัน",
    myFavorite: "รายการโปรดของฉัน",
    myLuckyDraw: "ชิงโชคของฉัน",
    notifications: "การแจ้งเตือน",
    support: "ช่วยเหลือ",
    menu: "เมนู",
    logout: "ออกจากระบบ",
    english: "อังกฤษ",
    thai: "ไทย",
    // Add promotions-related translations
    flashSales: "แฟลชเซลล์",
    cashback: "เงินคืน",
    referral: "ชวนเพื่อน รับรางวัล",
    // Add support-related translations
    contactSupport: "ติดต่อฝ่ายสนับสนุน",
    faq: "คำถามที่พบบ่อย",
    // Admin translations
    "Admin Dashboard": "แดชบอร์ดผู้ดูแลระบบ",
    "Total Sales": "ยอดขายทั้งหมด",
    "Orders": "คำสั่งซื้อ",
    "Products": "สินค้า",
    "Users": "ผู้ใช้",
    "Recent Transactions": "ธุรกรรมล่าสุด",
    "View All Transactions": "ดูธุรกรรมทั้งหมด",
    "Sales Overview": "ภาพรวมการขาย",
    "Sales chart visualization will appear here": "แผนภูมิการขายจะแสดงที่นี่",
    "Top Products": "สินค้ายอดนิยม",
    adminDashboard: "แดชบอร์ด",
    adminProducts: "สินค้า",
    adminPromotions: "โปรโมชั่น",
    adminResellers: "ตัวแทนขาย",
    adminReports: "รายงาน",
    adminSettings: "ตั้งค่า"
  }
};

// Hook to use translations with memoization to prevent unnecessary re-renders
export function useTranslations() {
  const { locale } = useLanguage();

  const t = useCallback((key: keyof typeof translations.en) => {
    return translations[locale][key] || key;
  }, [locale]);

  return { t };
} 