# i18n Key Checker

Script ตรวจสอบว่ามี i18n key ใดบ้างที่ใช้ในโค้ดแต่ยังไม่ได้แปลใน JSON files

## การใช้งาน

```bash
# ตรวจสอบ keys ก่อน build
npm run check:i18n

# หรือ build พร้อมตรวจสอบอัตโนมัติ
npm run build:safe
```

## สิ่งที่ตรวจสอบ

1. **Missing Keys** - Keys ที่ใช้ในโค้ดแต่ไม่มีใน JSON ทุกภาษา
2. **Object Keys** - Keys ที่ชี้ไปยัง object แทน string (เช่น `t("orders.status")` แต่ `orders.status` เป็น object)
3. **Per-language Missing** - Keys ที่มีใน en.json แต่ขาดในภาษาอื่น

## ตัวอย่าง Output

```
🔍 Checking i18n keys...

📚 Loaded 9 language files: en, es, fr, hi, ja, ko, ms, th, zh

📄 Scanned 45 source files
🔑 Found 156 unique translation keys

❌ KEYS USED IN CODE BUT MISSING FROM ALL TRANSLATIONS (2):
Add these to ALL language files:

   ❌ ProductDetail.error.truemoney_minimum
      Used in: app/[locale]/games/[gameId]/page.tsx
   ❌ ProductDetail.error.payment_method_unavailable
      Used in: app/[locale]/games/[gameId]/page.tsx

💥 i18n check FAILED!
   Fix the errors above before deploying.
```
