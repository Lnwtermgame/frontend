#!/usr/bin/env node
/**
 * Auto-add missing i18n keys to all language files
 * Usage: node scripts/add-missing-keys.js
 */

const fs = require('fs');
const path = require('path');

const MESSAGES_DIR = path.join(__dirname, '../messages');
const SRC_DIR = path.join(__dirname, '../src');

// Helper to set nested value
function setNestedValue(obj, keyPath, value) {
  const parts = keyPath.split('.');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part] || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }

  current[parts[parts.length - 1]] = value;
}

// Check if key exists
function keyExists(obj, keyPath) {
  const parts = keyPath.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return false;
    current = current[part];
  }

  return current !== undefined;
}

// Simple translations for common patterns
const TRANSLATIONS = {
  'en': (key) => key.split('.').pop().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
  'th': (key) => {
    const map = {
      'payment_method_unavailable': 'ช่องทางชำระเงินนี้ไม่พร้อมใช้งานสำหรับยอดเงินปัจจุบัน',
      'truemoney_minimum': 'TrueWallet ต้องมียอดขั้นต่ำ {amount} บาท',
      'about.step1_desc': 'รับเครดิตจากการซื้อสินค้า โปรโมชั่น และการแนะนำเพื่อน',
      'about.step1_title': 'สะสมเครดิต',
      'about.step2_desc': 'ใช้เครดิตเป็นส่วนลดหรือแลกรับรางวัล',
      'about.step2_title': 'ใช้เครดิต',
      'about.step3_desc': 'ทุก 100 เครดิต มีมูลค่า 1 บาท',
      'about.step3_title': 'มูลค่าเครดิต',
      'about.title': 'เกี่ยวกับเครดิต',
    };
    return map[key] || `[${key}]`;
  },
  'zh': (key) => {
    const map = {
      'payment_method_unavailable': '当前金额无法使用此支付方式',
      'truemoney_minimum': 'TrueWallet 需要最低 {amount} 泰铢',
    };
    return map[key] || `[${key}]`;
  },
  'ja': (key) => {
    const map = {
      'payment_method_unavailable': 'このお支払い方法は現在の金額ではご利用いただけません',
      'truemoney_minimum': 'TrueWalletは最低{amount}THB必要です',
    };
    return map[key] || `[${key}]`;
  },
  'ko': (key) => {
    const map = {
      'payment_method_unavailable': '현재 금액에 대해 이 결제 수단을 사용할 수 없습니다',
      'truemoney_minimum': 'TrueWallet는 최소 {amount} THB가 필요합니다',
    };
    return map[key] || `[${key}]`;
  },
  // Default fallback for other languages
  'default': (key) => `[${key}]`
};

function main() {
  console.log('🔧 Adding missing i18n keys...\n');

  // Load all language files
  const langFiles = fs.readdirSync(MESSAGES_DIR).filter(f => f.endsWith('.json'));
  const translations = {};

  for (const file of langFiles) {
    const lang = path.basename(file, '.json');
    const content = JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, file), 'utf8'));
    translations[lang] = content;
  }

  // Define keys to add (our new keys + commonly missing ones)
  const keysToAdd = [
    // Our TrueWallet keys
    { key: 'ProductDetail.error.payment_method_unavailable', section: 'ProductDetail' },
    { key: 'ProductDetail.error.truemoney_minimum', section: 'ProductDetail' },

    // Credits page
    { key: 'Credits.about.title', value: 'About Credits' },
    { key: 'Credits.about.step1_title', value: 'Earn Credits' },
    { key: 'Credits.about.step1_desc', value: 'Earn credits from purchases, promotions, and referrals' },
    { key: 'Credits.about.step2_title', value: 'Redeem Credits' },
    { key: 'Credits.about.step2_desc', value: 'Use credits as discounts for purchases or redeem rewards' },
    { key: 'Credits.about.step3_title', value: 'Credit Value' },
    { key: 'Credits.about.step3_desc', value: 'Every 100 credits is worth 1 THB when used as a discount' },
    { key: 'Credits.history.title', value: 'Transaction History' },
    { key: 'Credits.history.all', value: 'All Time' },
    { key: 'Credits.history.this_week', value: 'This Week' },
    { key: 'Credits.history.this_month', value: 'This Month' },
    { key: 'Credits.history.empty', value: 'No transactions yet' },
    { key: 'Credits.history.empty_desc', value: 'Start earning credits by making purchases!' },

    // Order actions
    { key: 'OrderDetail.actions.title', value: 'Actions' },
    { key: 'OrderDetail.actions.cancel', value: 'Cancel Order' },
    { key: 'OrderDetail.actions.cancel_hint', value: 'You can cancel this order before it is processed' },
    { key: 'OrderDetail.actions.cancel_confirm', value: 'Are you sure you want to cancel this order?' },
    { key: 'OrderDetail.actions.cancel_success', value: 'Order cancelled successfully' },
    { key: 'OrderDetail.actions.cancel_failed', value: 'Failed to cancel order' },
    { key: 'OrderDetail.actions.cancelling', value: 'Cancelling...' },
    { key: 'OrderDetail.actions.need_help', value: 'Need Help?' },
    { key: 'OrderDetail.actions.report_issue', value: 'Report an Issue' },
    { key: 'OrderDetail.items.delivery_status', value: 'Delivery Status' },
    { key: 'OrderDetail.items.delivery_failed', value: 'Delivery Failed' },
    { key: 'OrderDetail.items.code_label', value: 'Code:' },
    { key: 'OrderDetail.items.copy_success', value: 'Copied!' },

    // Invoice
    { key: 'InvoiceDetail.actions.download', value: 'Download PDF' },
    { key: 'InvoiceDetail.actions.view', value: 'View Invoice' },
    { key: 'InvoiceDetail.grand_total', value: 'Grand Total' },
    { key: 'InvoiceDetail.item_details', value: 'Item Details' },

    // Contact form
    { key: 'ContactPage.form.title', value: 'Contact Us' },
    { key: 'ContactPage.form.name', value: 'Your Name' },
    { key: 'ContactPage.form.email', value: 'Email Address' },
    { key: 'ContactPage.form.subject', value: 'Subject' },
    { key: 'ContactPage.form.message', value: 'Message' },
    { key: 'ContactPage.form.send', value: 'Send Message' },
    { key: 'ContactPage.form.sending', value: 'Sending...' },
    { key: 'ContactPage.form.success', value: 'Message sent successfully!' },

    // Coupon
    { key: 'Coupons.how_to_use.title', value: 'How to Use' },
    { key: 'Coupons.how_to_use.step1', value: 'Copy the coupon code' },
    { key: 'Coupons.how_to_use.step2', value: 'Apply at checkout' },
    { key: 'Coupons.how_to_use.step3', value: 'Enjoy your discount!' },
    { key: 'Coupons.how_to_use.expiry_hint', value: 'Coupons expire after the validity period' },
    { key: 'Coupons.filter_title', value: 'Filter' },
    { key: 'Coupons.add_success', value: 'Coupon added successfully' },
    { key: 'Coupons.add_failed', value: 'Failed to add coupon' },
    { key: 'Coupons.invalid_code', value: 'Invalid coupon code' },
    { key: 'Coupons.already_added', value: 'Coupon already added' },
    { key: 'Coupons.expired', value: 'Coupon has expired' },

    // Search
    { key: 'SmartSearch.recent_searches', value: 'Recent Searches' },
    { key: 'SmartSearch.suggestions', value: 'Suggestions' },
    { key: 'SmartSearch.popular', value: 'Popular' },

    // Cookie
    { key: 'CookieNotice.title', value: 'We use cookies' },
    { key: 'CookieNotice.description', value: 'This website uses cookies to enhance your browsing experience.' },
    { key: 'CookieNotice.acknowledge', value: 'Got it' },
    { key: 'CookieNotice.learn_more', value: 'Learn more' },
    { key: 'CookieNotice.ariaClose', value: 'Close cookie notice' },

    // Notifications
    { key: 'Notifications.filters.all', value: 'All' },
    { key: 'Notifications.filters.unread', value: 'Unread' },
    { key: 'Notifications.filters.order', value: 'Orders' },
    { key: 'Notifications.filters.payment', value: 'Payments' },
    { key: 'Notifications.filters.promotion', value: 'Promotions' },

    // Auth
    { key: 'Auth.already_have_account', value: 'Already have an account?' },

    // Admin tickets
    { key: 'AdminTickets.status.ALL', value: 'All' },
    { key: 'AdminTickets.status.UNASSIGNED', value: 'Unassigned' },
    { key: 'AdminTickets.status.WAITING_ADMIN', value: 'Waiting for Admin' },
    { key: 'AdminTickets.status.SLA_8', value: 'SLA 8h' },
    { key: 'AdminTickets.status.SLA_24', value: 'SLA 24h' },
  ];

  let totalAdded = 0;

  for (const lang of Object.keys(translations)) {
    let added = 0;
    const translator = TRANSLATIONS[lang] || TRANSLATIONS['default'];

    for (const item of keysToAdd) {
      const key = item.key;

      if (!keyExists(translations[lang], key)) {
        // Get translated value
        let value;
        if (item.value) {
          value = item.value;
        } else if (lang === 'th' && TRANSLATIONS['th'](key).startsWith('[')) {
          // Fallback to English for Thai if no specific translation
          value = TRANSLATIONS['en'](key);
        } else {
          value = translator(key);
        }

        setNestedValue(translations[lang], key, value);
        added++;
      }
    }

    if (added > 0) {
      // Write back to file
      fs.writeFileSync(
        path.join(MESSAGES_DIR, `${lang}.json`),
        JSON.stringify(translations[lang], null, 2) + '\n'
      );
      console.log(`✅ ${lang}: Added ${added} keys`);
      totalAdded += added;
    }
  }

  if (totalAdded === 0) {
    console.log('✅ All keys already exist!');
  } else {
    console.log(`\n🎉 Total added: ${totalAdded} keys across ${Object.keys(translations).length} languages`);
  }
}

main();
