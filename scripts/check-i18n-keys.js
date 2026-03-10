#!/usr/bin/env node
/**
 * Check for missing i18n keys across all language files
 * Usage: npm run check:i18n
 */

const fs = require('fs');
const path = require('path');

const MESSAGES_DIR = path.join(__dirname, '../messages');
const SRC_DIR = path.join(__dirname, '../src');

// Recursively get all files in directory
function getAllFiles(dir, ext) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...getAllFiles(fullPath, ext));
    } else if (item.name.endsWith(ext)) {
      files.push(fullPath);
    }
  }

  return files;
}

// Get all translation keys from JSON file recursively
function getKeysFromJson(obj, prefix = '') {
  let keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys = keys.concat(getKeysFromJson(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// Check if a key looks like a valid translation key (not URL, not single char, etc.)
function isValidTranslationKey(key) {
  // Skip empty keys
  if (!key || key.trim() === '') return false;

  // Skip keys that look like URLs or paths
  if (key.startsWith('/') || key.startsWith('http') || key.startsWith('\\')) return false;

  // Skip single character keys (except common single-char translations)
  if (key.length === 1 && !['a', 'A', '…'].includes(key)) return false;

  // Skip keys with only special characters
  if (/^[\s\n\r\t.,;:!?@#$%^&*()_+=\-\[\]{}|\\/<>]+$/.test(key)) return false;

  // Skip keys that look like CSS classes or code snippets
  if (key.includes('className') || key.includes('style=') || key.includes('px') || key.includes('bg-')) return false;

  // Skip keys with newlines or tabs at start/end
  key = key.trim();

  // Skip if key is just whitespace variations
  if (/^[\s]+$/.test(key)) return false;

  // Skip common false positives from template literals
  const falsePositives = [
    '${', '}', '`', '\n', '\t', '\r', '  ', '   ',
    '()', '[]', '{}', '&&', '||', '===', '!==', '==', '!=', '=>', '...'
  ];
  if (falsePositives.some(fp => key === fp || key.startsWith(fp))) return false;

  // Skip if looks like a file path
  if (key.includes('.tsx') || key.includes('.ts') || key.includes('.js') || key.includes('.json')) return false;

  // Skip if looks like an API endpoint
  if (key.startsWith('/api/') || key.startsWith('api/')) return false;

  return true;
}

// Extract keys from source files (t("key") or t('key') patterns)
function extractKeysFromSource(content) {
  const keys = new Set();

  // Match t("key") or t('key') - but not t("key.something" + variable)
  const singleQuoteRegex = /t\(\s*['"]([^'"$+{}]+)['"]\s*[,\)]/g;

  // Match t(`key`) for template literals without variables
  const templateRegex = /t\(\s*`([^${}`]+)`\s*\)/g;

  // Match rich() calls too
  const richRegex = /rich\(\s*['"]([^'"$+{}]+)['"]\s*[,\)]/g;

  let match;
  while ((match = singleQuoteRegex.exec(content)) !== null) {
    const key = match[1].trim();
    if (isValidTranslationKey(key)) {
      keys.add(key);
    }
  }

  while ((match = templateRegex.exec(content)) !== null) {
    const key = match[1].trim();
    if (isValidTranslationKey(key)) {
      keys.add(key);
    }
  }

  while ((match = richRegex.exec(content)) !== null) {
    const key = match[1].trim();
    if (isValidTranslationKey(key)) {
      keys.add(key);
    }
  }

  return Array.from(keys);
}

// Check if a key exists in translations (handles nested objects)
function keyExistsInTranslations(key, translations) {
  for (const lang of Object.keys(translations)) {
    const parts = key.split('.');
    let current = translations[lang];

    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return false;
      }
      current = current[part];
    }

    // If it's an object (not a string), key doesn't exist as a leaf node
    if (typeof current === 'object' && current !== null) {
      // Check if it has children - if so, this is a parent key which might be OK
      const hasChildren = Object.keys(current).length > 0;
      if (hasChildren) {
        // This is a parent key - check if it's explicitly used
        continue;
      }
      return false;
    }

    if (current !== undefined) {
      return true;
    }
  }
  return false;
}

// Get value at nested key path
function getValueAtPath(obj, path) {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

function main() {
  console.log('🔍 Checking i18n keys...\n');

  // Load all language files
  const langFiles = fs.readdirSync(MESSAGES_DIR).filter(f => f.endsWith('.json'));
  const translations = {};

  for (const file of langFiles) {
    const lang = path.basename(file, '.json');
    const content = JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, file), 'utf8'));
    translations[lang] = content;
  }

  console.log(`📚 Loaded ${langFiles.length} language files: ${Object.keys(translations).join(', ')}\n`);

  // Extract keys from source files
  const sourceFiles = getAllFiles(SRC_DIR, '.tsx').concat(getAllFiles(SRC_DIR, '.ts'));
  const usedKeys = new Set();
  const fileKeyMap = {};

  for (const file of sourceFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const keys = extractKeysFromSource(content);
    const relativePath = path.relative(SRC_DIR, file);

    for (const key of keys) {
      usedKeys.add(key);
      if (!fileKeyMap[key]) fileKeyMap[key] = [];
      fileKeyMap[key].push(relativePath);
    }
  }

  console.log(`📄 Scanned ${sourceFiles.length} source files`);
  console.log(`🔑 Found ${usedKeys.size} unique translation keys\n`);

  // Find missing keys (used in code but not in any translation file)
  const missingKeys = [];
  for (const key of usedKeys) {
    if (!keyExistsInTranslations(key, translations)) {
      missingKeys.push(key);
    }
  }

  // Check each language has all keys (compared to English)
  const baseLang = 'en';
  const baseTranslations = translations[baseLang];
  const allBaseKeys = getKeysFromJson(baseTranslations);

  const missingByLang = {};
  for (const lang of Object.keys(translations)) {
    if (lang === baseLang) continue;

    const langKeys = getKeysFromJson(translations[lang]);
    const missing = allBaseKeys.filter(k => !langKeys.includes(k));

    if (missing.length > 0) {
      missingByLang[lang] = missing;
    }
  }

  // Report results
  let hasErrors = false;

  if (missingKeys.length > 0) {
    console.error(`❌ KEYS USED IN CODE BUT MISSING FROM ALL TRANSLATIONS (${missingKeys.length}):`);
    console.error('Add these to ALL language files:\n');

    for (const key of missingKeys.sort()) {
      console.error(`   ❌ ${key}`);
      console.error(`      Used in: ${fileKeyMap[key].slice(0, 2).join(', ')}${fileKeyMap[key].length > 2 ? '...' : ''}`);
    }
    console.error('');
    hasErrors = true;
  }

  // Check for keys that resolve to objects (not strings)
  const objectKeys = [];
  for (const key of usedKeys) {
    const value = getValueAtPath(baseTranslations, key);
    if (value !== undefined && typeof value === 'object' && value !== null) {
      objectKeys.push(key);
    }
  }

  if (objectKeys.length > 0) {
    console.error(`❌ KEYS THAT RESOLVE TO OBJECTS (${objectKeys.length}):`);
    console.error('These keys are objects in JSON but used as strings in code:\n');
    for (const key of objectKeys.sort()) {
      console.error(`   ❌ ${key}`);
      console.error(`      Used in: ${fileKeyMap[key].slice(0, 2).join(', ')}${fileKeyMap[key].length > 2 ? '...' : ''}`);
      const obj = getValueAtPath(baseTranslations, key);
      if (obj && typeof obj === 'object') {
        console.error(`      Suggestion: Use one of: ${Object.keys(obj).map(k => `${key}.${k}`).join(', ')}`);
      }
    }
    console.error('');
    hasErrors = true;
  }

  // Report missing keys per language
  const langsWithMissing = Object.keys(missingByLang);
  if (langsWithMissing.length > 0) {
    for (const lang of langsWithMissing) {
      const missing = missingByLang[lang];
      console.error(`❌ ${lang.toUpperCase()} MISSING KEYS (${missing.length}):`);
      for (const key of missing.slice(0, 15).sort()) {
        console.error(`   - ${key}`);
      }
      if (missing.length > 15) {
        console.error(`   ... and ${missing.length - 15} more`);
      }
      console.error('');
    }
    hasErrors = true;
  }

  if (hasErrors) {
    console.error('💥 i18n check FAILED!');
    console.error('   Fix the errors above before deploying.\n');
    process.exit(1);
  } else {
    console.log('✅ All i18n checks passed!');
    console.log(`   - All ${usedKeys.size} keys exist in all ${langFiles.length} languages\n`);
    process.exit(0);
  }
}

main();
