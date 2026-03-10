#!/usr/bin/env node
/**
 * Quick verification of critical i18n keys
 * Usage: node scripts/verify-i18n.js
 */

const fs = require('fs');
const path = require('path');

const MESSAGES_DIR = path.join(__dirname, '../messages');

// Critical keys that must exist
const CRITICAL_KEYS = [
  'ProductDetail.error.payment_method_unavailable',
  'ProductDetail.error.truemoney_minimum',
  'Credits.about.title',
  'OrderDetail.actions.cancel',
  'ContactPage.form.title',
];

function main() {
  console.log('🔍 Verifying critical i18n keys...\n');

  const langFiles = fs.readdirSync(MESSAGES_DIR).filter(f => f.endsWith('.json'));
  let allPassed = true;

  for (const file of langFiles) {
    const lang = path.basename(file, '.json');
    const content = JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, file), 'utf8'));

    const missing = [];
    for (const key of CRITICAL_KEYS) {
      const parts = key.split('.');
      let current = content;
      for (const part of parts) {
        current = current?.[part];
      }
      if (current === undefined) {
        missing.push(key);
      }
    }

    if (missing.length === 0) {
      console.log(`✅ ${lang}: All critical keys present`);
    } else {
      console.log(`❌ ${lang}: Missing ${missing.length} keys`);
      missing.forEach(k => console.log(`   - ${k}`));
      allPassed = false;
    }
  }

  console.log('');
  if (allPassed) {
    console.log('🎉 All critical i18n keys verified!');
    process.exit(0);
  } else {
    console.log('⚠️  Some keys are missing');
    process.exit(1);
  }
}

main();
