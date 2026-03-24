const fs = require('fs');
const path = require('path');
const axios = require('axios');

const MESSAGES_DIR = path.join(__dirname, '../messages');
const SRC_DIR = path.join(__dirname, '../src');

// Target languages
const TARGET_LANGS = ['th', 'es', 'fr', 'hi', 'ja', 'ko', 'ms', 'zh'];
const LANG_MAP = {
  th: 'th',
  es: 'es',
  fr: 'fr',
  hi: 'hi',
  ja: 'ja',
  ko: 'ko',
  ms: 'ms',
  zh: 'zh-CN'
};

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

function isValidTranslationKey(key) {
  if (!key || key.trim() === '') return false;
  if (key.startsWith('/') || key.startsWith('http') || key.startsWith('\\')) return false;
  if (key.length === 1 && !['a', 'A', '…'].includes(key)) return false;
  if (/^[\s\n\r\t.,;:!?@#$%^&*()_+=\-\[\]{}|\\/<>]+$/.test(key)) return false;
  if (key.includes('className') || key.includes('style=') || key.includes('px') || key.includes('bg-')) return false;
  key = key.trim();
  if (/^[\s]+$/.test(key)) return false;
  const falsePositives = ['${', '}', '`', '\n', '\t', '\r', '  ', '()', '[]', '{}', '&&', '||', '===', '!==', '==', '!=', '=>', '...'];
  if (falsePositives.some(fp => key === fp || key.startsWith(fp))) return false;
  if (key.includes('.tsx') || key.includes('.ts') || key.includes('.js') || key.includes('.json')) return false;
  if (key.startsWith('/api/') || key.startsWith('api/')) return false;
  return true;
}

function extractKeysFromSource(content) {
  const keys = new Set();
  const singleQuoteRegex = /(?:^|[^\w])t(?:Admin)?\(\s*['"]([^'"$+{}]+)['"]\s*[,\)]/g;
  const templateRegex = /(?:^|[^\w])t(?:Admin)?\(\s*`([^${}`]+)`\s*\)/g;
  const richRegex = /rich\(\s*['"]([^'"$+{}]+)['"]\s*[,\)]/g;

  let match;
  while ((match = singleQuoteRegex.exec(content)) !== null) {
    const key = match[1].trim();
    if (isValidTranslationKey(key)) keys.add(key);
  }
  while ((match = templateRegex.exec(content)) !== null) {
    const key = match[1].trim();
    if (isValidTranslationKey(key)) keys.add(key);
  }
  while ((match = richRegex.exec(content)) !== null) {
    const key = match[1].trim();
    if (isValidTranslationKey(key)) keys.add(key);
  }
  return Array.from(keys);
}

// Convert key like "hero_zzz_subtitle" to "Hero zzz subtitle"
function keyToEnglish(key) {
  const parts = key.split('.');
  let lastPart = parts[parts.length - 1];
  
  // Handling the ._base trick we did earlier
  if (lastPart === '_base' && parts.length > 1) {
    lastPart = parts[parts.length - 2];
  }

  // Handle camelCase or snake_case
  lastPart = lastPart.replace(/_/g, ' ');
  // Handle camelCase splitting roughly
  lastPart = lastPart.replace(/([A-Z])/g, ' $1').trim();
  
  lastPart = lastPart.charAt(0).toUpperCase() + lastPart.slice(1).toLowerCase();
  return lastPart;
}

function setNestedValue(obj, pathStr, value) {
  const parts = pathStr.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] === undefined) {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
}

function sortObject(obj) {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return obj;
  const sorted = {};
  Object.keys(obj).sort().forEach(k => {
    sorted[k] = sortObject(obj[k]);
  });
  return sorted;
}

const delay = ms => new Promise(res => setTimeout(res, ms));

async function translateText(text, targetLang) {
  const tl = LANG_MAP[targetLang];
  if (!tl) return text;
  
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await axios.get(url);
    if (res.data && res.data[0]) {
      return res.data[0].map(s => s[0]).join('');
    }
  } catch (e) {
    // Retry once on failure
    try {
        await delay(500);
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
        const res = await axios.get(url);
        if (res.data && res.data[0]) {
            return res.data[0].map(s => s[0]).join('');
        }
    } catch(err) {
        console.error(`Error translating "${text}" to ${targetLang}:`, err.message);
    }
  }
  return text;
}

async function main() {
  console.log('🗑️ Deleting all existing .json files...');
  if (fs.existsSync(MESSAGES_DIR)) {
      const oldFiles = fs.readdirSync(MESSAGES_DIR);
      for (const file of oldFiles) {
          if (file.endsWith('.json')) {
             fs.unlinkSync(path.join(MESSAGES_DIR, file));
             console.log(`Deleted ${file}`);
          }
      }
  } else {
      fs.mkdirSync(MESSAGES_DIR);
  }

  console.log('\n🔍 Scanning source files for translation keys...');
  const sourceFiles = getAllFiles(SRC_DIR, '.tsx').concat(getAllFiles(SRC_DIR, '.ts'));
  const usedKeys = new Set();
  
  for (const file of sourceFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const keys = extractKeysFromSource(content);
    for (const k of keys) usedKeys.add(k);
  }
  
  const allKeys = Array.from(usedKeys);
  console.log(`🔑 Found ${allKeys.length} unique keys in codebase!`);

  console.log('\n📝 Generating clean en.json...');
  const enData = {};
  for (const key of allKeys) {
    setNestedValue(enData, key, keyToEnglish(key));
  }
  const sortedEnData = sortObject(enData);
  fs.writeFileSync(path.join(MESSAGES_DIR, 'en.json'), JSON.stringify(sortedEnData, null, 2) + '\n');
  console.log('✅ Saved en.json successfully!');

  console.log('\n🚀 Starting translations to other languages...');
  for (const lang of TARGET_LANGS) {
    console.log(`\n🌐 Translating to ${lang}...`);
    const langData = {};
    let count = 0;
    
    for (const key of allKeys) {
        const engText = keyToEnglish(key);
        const translatedText = await translateText(engText, lang);
        setNestedValue(langData, key, translatedText);
        
        count++;
        if (count % 100 === 0) {
            console.log(`  ...translated ${count}/${allKeys.length} keys`);
        }
        await delay(30); // Prevent rate limiting
    }
    
    const sortedLangData = sortObject(langData);
    fs.writeFileSync(path.join(MESSAGES_DIR, `${lang}.json`), JSON.stringify(sortedLangData, null, 2) + '\n');
    console.log(`✅ Saved ${lang}.json`);
  }
  
  console.log('\n🎉 Clean up and translation completely finished!');
}

main();
