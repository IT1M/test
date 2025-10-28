-- =====================================================
-- الاستعلامات اليومية الأساسية
-- Daily Basic Queries - Saudi MAIS Inventory System
-- =====================================================

-- 1. استعلامات المخزون الأساسية
-- =====================================================

-- عرض جميع عناصر المخزون
SELECT 
  "itemName" as "اسم العنصر",
  batch as "الدفعة",
  quantity as "الكمية",
  destination as "الوجهة",
  category as "الفئة",
  "createdAt"::date as "تاريخ الإدخال"
FROM "InventoryItem"
ORDER BY "createdAt" DESC
LIMIT 20;

-- البحث عن عنصر معين
SELECT 
  "itemName" as "اسم العنصر",
  batch as "الدفعة",
  quantity as "الكمية",
  destination as "الوجهة"
FROM "InventoryItem"
WHERE "itemName" ILIKE '%حليب%'  -- غير النص للبحث عن عنصر آخر
ORDER BY "createdAt" DESC;

-- عرض المخزون حسب الوجهة
SELECT 
  destination as "الوجهة",
  COUNT(*) as "عدد العناصر",
  SUM(quantity) as "إجمالي الكمية"
FROM "InventoryItem"
GROUP BY destination;

-- عرض المخزون حسب الفئة
SELECT 
  category as "الفئة",
  COUNT(*) as "عدد العناصر",
  SUM(quantity) as "إجمالي الكمية"
FROM "InventoryItem"
WHERE category IS NOT NULL
GROUP BY category
ORDER BY COUNT(*) DESC;

-- 2. استعلامات المستخدمين الأساسية
-- =====================================================

-- عرض جميع المستخدمين النشطين
SELECT 
  name as "الاسم",
  email as "البريد الإلكتروني",
  role as "الدور",
  "createdAt"::date as "تاريخ الإنشاء"
FROM "User"
WHERE "isActive" = true
ORDER BY "createdAt" DESC;

-- عرض المستخدمين حسب الدور
SELECT 
  role as "الدور",
  COUNT(*) as "العدد",
  COUNT(CASE WHEN "isActive" THEN 1 END) as "النشطين"
FROM "User"
GROUP BY role;

-- البحث عن مستخدم معين
SELECT 
  name as "الاسم",
  email as "البريد الإلكتروني",
  role as "الدور",
  "isActive" as "نشط"
FROM "User"
WHERE email ILIKE '%admin%'  -- غير النص للبحث
   OR name ILIKE '%أحمد%';   -- غير النص للبحث-- 
3. إحصائيات سريعة
-- =====================================================

-- إحصائيات عامة للنظام
SELECT 
  'المستخدمين' as "النوع",
  COUNT(*) as "العدد الإجمالي",
  COUNT(CASE WHEN "isActive" THEN 1 END) as "النشطين"
FROM "User"
UNION ALL
SELECT 
  'عناصر المخزون',
  COUNT(*),
  COUNT(CASE WHEN quantity > 0 THEN 1 END)
FROM "InventoryItem"
UNION ALL
SELECT 
  'سجلات المراجعة',
  COUNT(*),
  COUNT(CASE WHEN DATE(timestamp) = CURRENT_DATE THEN 1 END)
FROM "AuditLog";

-- إحصائيات اليوم
SELECT 
  COUNT(*) as "عناصر مضافة اليوم",
  SUM(quantity) as "إجمالي الكمية اليوم",
  COUNT(DISTINCT "enteredById") as "المستخدمين النشطين اليوم"
FROM "InventoryItem"
WHERE DATE("createdAt") = CURRENT_DATE;

-- أكثر المستخدمين نشاطاً هذا الأسبوع
SELECT 
  u.name as "المستخدم",
  COUNT(i.id) as "العناصر المضافة",
  SUM(i.quantity) as "إجمالي الكمية"
FROM "User" u
JOIN "InventoryItem" i ON u.id = i."enteredById"
WHERE i."createdAt" >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY u.id, u.name
ORDER BY COUNT(i.id) DESC
LIMIT 5;

-- 4. استعلامات البحث والتصفية
-- =====================================================

-- البحث في المخزون بتاريخ معين
SELECT 
  "itemName" as "اسم العنصر",
  quantity as "الكمية",
  destination as "الوجهة",
  "createdAt"::timestamp(0) as "وقت الإدخال"
FROM "InventoryItem"
WHERE DATE("createdAt") = '2024-01-15'  -- غير التاريخ حسب الحاجة
ORDER BY "createdAt" DESC;

-- البحث في المخزون بفترة زمنية
SELECT 
  "itemName" as "اسم العنصر",
  quantity as "الكمية",
  destination as "الوجهة",
  "createdAt"::date as "التاريخ"
FROM "InventoryItem"
WHERE "createdAt" BETWEEN '2024-01-01' AND '2024-01-31'  -- غير التواريخ
ORDER BY "createdAt" DESC;

-- البحث عن العناصر بكمية معينة
SELECT 
  "itemName" as "اسم العنصر",
  quantity as "الكمية",
  destination as "الوجهة"
FROM "InventoryItem"
WHERE quantity > 500  -- غير الرقم حسب الحاجة
ORDER BY quantity DESC;

-- 5. استعلامات الإشعارات والتنبيهات
-- =====================================================

-- عرض الإشعارات غير المقروءة
SELECT 
  u.name as "المستخدم",
  n.title as "العنوان",
  n.message as "الرسالة",
  n."createdAt"::timestamp(0) as "الوقت"
FROM "Notification" n
JOIN "User" u ON n."userId" = u.id
WHERE n."isRead" = false
ORDER BY n."createdAt" DESC;

-- عدد الإشعارات غير المقروءة لكل مستخدم
SELECT 
  u.name as "المستخدم",
  COUNT(*) as "الإشعارات غير المقروءة"
FROM "User" u
JOIN "Notification" n ON u.id = n."userId"
WHERE n."isRead" = false
GROUP BY u.id, u.name
ORDER BY COUNT(*) DESC;-- 
6. استعلامات إدارة البيانات
-- =====================================================

-- إضافة مستخدم جديد
INSERT INTO "User" (
  id, 
  email, 
  name, 
  password, 
  role, 
  "isActive"
) VALUES (
  uuid_generate_v4()::text,
  'newuser@mais.sa',  -- غير البريد الإلكتروني
  'اسم المستخدم الجديد',  -- غير الاسم
  crypt('password123', gen_salt('bf')),  -- غير كلمة المرور
  'DATA_ENTRY',  -- غير الدور حسب الحاجة
  true
);

-- إضافة عنصر مخزون جديد
INSERT INTO "InventoryItem" (
  id,
  "itemName",
  batch,
  quantity,
  reject,
  destination,
  category,
  notes,
  "enteredById"
) VALUES (
  uuid_generate_v4()::text,
  'اسم العنصر',  -- غير اسم العنصر
  'BATCH-001',  -- غير رقم الدفعة
  100,  -- غير الكمية
  0,  -- غير عدد المرفوض
  'MAIS',  -- غير الوجهة (MAIS أو FOZAN)
  'فئة العنصر',  -- غير الفئة
  'ملاحظات إضافية',  -- غير الملاحظات
  (SELECT id FROM "User" WHERE email = 'admin@mais.sa' LIMIT 1)  -- معرف المستخدم
);

-- تحديث كمية عنصر موجود
UPDATE "InventoryItem" 
SET 
  quantity = 150,  -- الكمية الجديدة
  "updatedAt" = NOW()
WHERE "itemName" = 'اسم العنصر'  -- غير اسم العنصر
  AND batch = 'BATCH-001';  -- غير رقم الدفعة

-- تحديث معلومات مستخدم
UPDATE "User" 
SET 
  name = 'الاسم الجديد',  -- غير الاسم
  "updatedAt" = NOW()
WHERE email = 'user@mais.sa';  -- غير البريد الإلكتروني

-- 7. استعلامات التنظيف والصيانة
-- =====================================================

-- حذف الإشعارات المقروءة القديمة (أكثر من شهر)
DELETE FROM "Notification" 
WHERE "isRead" = true 
  AND "createdAt" < NOW() - INTERVAL '1 month';

-- تحديث حالة المستخدمين غير النشطين
UPDATE "User" 
SET "isActive" = false 
WHERE "createdAt" < NOW() - INTERVAL '1 year'
  AND id NOT IN (
    SELECT DISTINCT "enteredById" 
    FROM "InventoryItem" 
    WHERE "createdAt" > NOW() - INTERVAL '6 months'
  );

-- 8. استعلامات التحقق من صحة البيانات
-- =====================================================

-- التحقق من وجود عناصر بكميات سالبة
SELECT 
  "itemName" as "اسم العنصر",
  quantity as "الكمية",
  "createdAt"::date as "التاريخ"
FROM "InventoryItem"
WHERE quantity < 0;

-- التحقق من وجود مستخدمين بدون بريد إلكتروني صحيح
SELECT 
  name as "الاسم",
  email as "البريد الإلكتروني"
FROM "User"
WHERE email IS NULL 
   OR email = '' 
   OR email NOT LIKE '%@%.%';

-- التحقق من وجود عناصر مخزون بدون فئة
SELECT 
  "itemName" as "اسم العنصر",
  destination as "الوجهة",
  "createdAt"::date as "التاريخ"
FROM "InventoryItem"
WHERE category IS NULL OR category = '';

-- 9. استعلامات سريعة للمراقبة
-- =====================================================

-- آخر 10 عمليات في النظام
SELECT 
  u.name as "المستخدم",
  a.action as "العملية",
  a."entityType" as "نوع الكيان",
  a.timestamp::timestamp(0) as "الوقت"
FROM "AuditLog" a
JOIN "User" u ON a."userId" = u.id
ORDER BY a.timestamp DESC
LIMIT 10;

-- حالة النظام العامة
SELECT 
  'آخر تحديث' as "المؤشر",
  MAX("updatedAt")::timestamp(0) as "القيمة"
FROM "InventoryItem"
UNION ALL
SELECT 
  'آخر مستخدم نشط',
  MAX("createdAt")::timestamp(0)
FROM "User"
WHERE "isActive" = true;

-- =====================================================
-- نصائح للاستخدام:
-- 1. غير القيم في الاستعلامات حسب احتياجاتك
-- 2. استخدم LIMIT لتحديد عدد النتائج
-- 3. استخدم WHERE لتصفية البيانات
-- 4. احفظ النسخ الاحتياطية قبل تشغيل استعلامات التحديث
-- =====================================================