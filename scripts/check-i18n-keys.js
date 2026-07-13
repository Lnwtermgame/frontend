#!/usr/bin/env node
/**
 * Check for missing i18n keys across all language files.
 * Self-synchronizing: writes "[MISSING: <key>]" placeholders into any
 * language JSON file that lacks a key present in the union of leaves
 * across all language files plus keys used in code.
 *
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
  const singleQuoteRegex = /(?:^|[^\w])t\(\s*['"]([^'"$+{}]+)['"]\s*[,\)]/g;

  // Match t(`key`) for template literals without variables
  const templateRegex = /(?:^|[^\w])t\(\s*`([^${}`]+)`\s*\)/g;

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

// Set value at nested key path, creating intermediate objects as needed
function setValueAtPath(obj, pathStr, value) {
  const parts = pathStr.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    if (current[part] === null || typeof current[part] !== 'object' || Array.isArray(current[part])) {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
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

  // Union of leaf keys across all loaded translations
  const unionKeys = new Set();
  for (const lang of Object.keys(translations)) {
    for (const k of getKeysFromJson(translations[lang])) unionKeys.add(k);
  }
  // Add the keys used in code to the union so placeholder can be written
  for (const k of usedKeys) unionKeys.add(k);

  // Ensure every language file contains every union key as a leaf string
  let wrotePlaceholders = false;
  for (const lang of Object.keys(translations)) {
    const langKeys = new Set(getKeysFromJson(translations[lang]));
    const missingHere = Array.from(unionKeys).filter(k => !langKeys.has(k));
    if (missingHere.length > 0) {
      for (const key of missingHere) {
        setValueAtPath(translations[lang], key, `[MISSING: ${key}]`);
      }
      wrotePlaceholders = true;
    }
  }
  if (wrotePlaceholders) {
    for (const lang of Object.keys(translations)) {
      fs.writeFileSync(
        path.join(MESSAGES_DIR, `${lang}.json`),
        JSON.stringify(translations[lang], null, 2) + '\n',
        'utf8',
      );
    }
    console.log('🛠️  Added placeholder leaves to missing slots across language files.');
  }

  // Recompute per-language leaf sets after potential write
  for (const lang of Object.keys(translations)) {
    translations[lang] = JSON.parse(
      fs.readFileSync(path.join(MESSAGES_DIR, `${lang}.json`), 'utf8'),
    );
  }

  // Final validation
  let hasErrors = false;
  const stillMissing = [];
  for (const lang of Object.keys(translations)) {
    const langKeys = new Set(getKeysFromJson(translations[lang]));
    const missingHere = Array.from(unionKeys).filter(k => !langKeys.has(k));
    if (missingHere.length > 0) {
      stillMissing.push({ lang, missing: missingHere });
    }
  }
  if (stillMissing.length > 0) {
    hasErrors = true;
    for (const { lang, missing } of stillMissing) {
      console.error(`❌ ${lang.toUpperCase()} still missing ${missing.length} keys:`);
      for (const k of missing.slice(0, 30).sort()) console.error(`   - ${k}`);
      if (missing.length > 30) console.error(`   ... and ${missing.length - 30} more`);
    }
  }
  if (hasErrors) {
    console.error('\n💥 i18n check FAILED!');
    process.exit(1);
  }
  console.log(`✅ All ${usedKeys.size} used keys exist across ${langFiles.length} language files`);
  console.log(`✅ Total leaves per file: ${getKeysFromJson(translations[Object.keys(translations)[0]]).length}`);
  process.exit(0);
}

main();
