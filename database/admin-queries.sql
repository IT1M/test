-- =====================================================
-- استعلامات الإدارة والمراقبة
-- Admin and Monitoring Queries
-- =====================================================

-- 1. التحقق من حالة RLS على جميع الجداول
-- =====================================================
SELECT 
  schemaname as "المخطط",
  tablename as "اسم الجدول",
  CASE 
    WHEN rowsecurity THEN 'مفعل ✅'
    ELSE 'غير مفعل ❌'
  END as "حالة RLS"
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('User', 'InventoryItem', 'AuditLog', 'Report', 'Backup', 'Notification', 'SavedSearch', 'SavedSearchShare')
ORDER BY tablename;

-- 2. عرض جميع السياسات المطبقة
-- =====================================================
SELECT 
  tablename as "الجدول",
  policyname as "اسم السياسة",
  CASE cmd
    WHEN 'r' THEN 'قراءة (SELECT)'
    WHEN 'w' THEN 'كتابة (INSERT)'
    WHEN 'u' THEN 'تحديث (UPDATE)'
    WHEN 'd' THEN 'حذف (DELETE)'
    WHEN '*' THEN 'جميع العمليات'
    ELSE cmd
  END as "نوع العملية",
  CASE 
    WHEN permissive = 'PERMISSIVE' THEN 'مسموح'
    ELSE 'مقيد'
  END as "النوع"
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. إحصائيات المستخدمين والأدوار
-- =====================================================
SELECT 
  role as "الدور",
  COUNT(*) as "عدد المستخدمين",
  COUNT(CASE WHEN "isActive" THEN 1 END) as "المستخدمين النشطين",
  COUNT(CASE WHEN "twoFactorEnabled" THEN 1 END) as "المصادقة الثنائية مفعلة"
FROM "User"
GROUP BY role
ORDER BY 
  CASE role
    WHEN 'ADMIN' THEN 1
    WHEN 'MANAGER' THEN 2
    WHEN 'SUPERVISOR' THEN 3
    WHEN 'AUDITOR' THEN 4
    WHEN 'DATA_ENTRY' THEN 5
  END;

-- 4. إحصائيات المخزون حسب الوجهة
-- =====================================================
SELECT 
  destination as "الوجهة",
  COUNT(*) as "عدد العناصر",
  SUM(quantity) as "إجمالي الكمية",
  SUM(reject) as "إجمالي المرفوض",
  ROUND(AVG(quantity), 2) as "متوسط الكمية",
  MIN("createdAt")::date as "أول إدخال",
  MAX("createdAt")::date as "آخر إدخال"
FROM "InventoryItem"
GROUP BY destination;

-- 5. أكثر المستخدمين نشاطاً في إدخال البيانات
-- =====================================================
SELECT 
  u.name as "اسم المستخدم",
  u.email as "البريد الإلكتروني",
  u.role as "الدور",
  COUNT(i.id) as "عدد العناصر المدخلة",
  SUM(i.quantity) as "إجمالي الكمية",
  MAX(i."createdAt")::date as "آخر إدخال"
FROM "User" u
LEFT JOIN "InventoryItem" i ON u.id = i."enteredById"
WHERE u."isActive" = true
GROUP BY u.id, u.name, u.email, u.role
ORDER BY COUNT(i.id) DESC
LIMIT 10;

-- 6. سجلات المراجعة الأخيرة
-- =====================================================
SELECT 
  u.name as "المستخدم",
  a.action as "العملية",
  a."entityType" as "نوع الكيان",
  a.timestamp::timestamp(0) as "الوقت",
  a."ipAddress" as "عنوان IP"
FROM "AuditLog" a
JOIN "User" u ON a."userId" = u.id
ORDER BY a.timestamp DESC
LIMIT 20;

-- 7. الإشعارات غير المقروءة حسب المستخدم
-- =====================================================
SELECT 
  u.name as "المستخدم",
  COUNT(*) as "الإشعارات غير المقروءة",
  MIN(n."createdAt")::date as "أقدم إشعار"
FROM "User" u
JOIN "Notification" n ON u.id = n."userId"
WHERE n."isRead" = false
GROUP BY u.id, u.name
ORDER BY COUNT(*) DESC;

-- 8. التقارير المُنشأة حسب النوع والحالة
-- =====================================================
SELECT 
  type as "نوع التقرير",
  status as "الحالة",
  COUNT(*) as "العدد",
  MIN("createdAt")::date as "أول تقرير",
  MAX("createdAt")::date as "آخر تقرير"
FROM "Report"
GROUP BY type, status
ORDER BY type, status;

-- 9. حجم قاعدة البيانات والجداول
-- =====================================================
SELECT 
  schemaname as "المخطط",
  tablename as "اسم الجدول",
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as "الحجم الإجمالي",
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as "حجم البيانات",
  (SELECT COUNT(*) FROM information_schema.tables t WHERE t.table_name = tablename AND t.table_schema = schemaname) as "عدد الصفوف"
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 10. الاتصالات النشطة
-- =====================================================
SELECT 
  pid as "معرف العملية",
  usename as "المستخدم",
  application_name as "التطبيق",
  client_addr as "عنوان العميل",
  state as "الحالة",
  query_start as "بداية الاستعلام",
  LEFT(query, 50) || '...' as "الاستعلام"
FROM pg_stat_activity 
WHERE state = 'active' 
  AND pid <> pg_backend_pid()
ORDER BY query_start;

-- 11. إحصائيات الأداء للجداول
-- =====================================================
SELECT 
  schemaname as "المخطط",
  relname as "اسم الجدول",
  seq_scan as "فحص تسلسلي",
  seq_tup_read as "صفوف مقروءة تسلسلياً",
  idx_scan as "فحص فهرس",
  idx_tup_fetch as "صفوف مجلبة بالفهرس",
  n_tup_ins as "إدراجات",
  n_tup_upd as "تحديثات",
  n_tup_del as "حذف"
FROM pg_stat_user_tables
ORDER BY seq_scan + idx_scan DESC;

-- 12. الفهارس المستخدمة والغير مستخدمة
-- =====================================================
SELECT 
  schemaname as "المخطط",
  relname as "الجدول",
  indexrelname as "اسم الفهرس",
  idx_scan as "مرات الاستخدام",
  pg_size_pretty(pg_relation_size(indexrelid)) as "حجم الفهرس",
  CASE 
    WHEN idx_scan = 0 THEN 'غير مستخدم ⚠️'
    WHEN idx_scan < 100 THEN 'قليل الاستخدام 📊'
    ELSE 'مستخدم بكثرة ✅'
  END as "حالة الاستخدام"
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- 13. البحث عن الاستعلامات البطيئة
-- =====================================================
SELECT 
  query as "الاستعلام",
  calls as "عدد المرات",
  total_time as "إجمالي الوقت (ms)",
  mean_time as "متوسط الوقت (ms)",
  max_time as "أقصى وقت (ms)",
  rows as "عدد الصفوف"
FROM pg_stat_statements 
WHERE mean_time > 100  -- الاستعلامات التي تستغرق أكثر من 100ms
ORDER BY mean_time DESC
LIMIT 10;

-- 14. مراقبة المساحة المتاحة
-- =====================================================
SELECT 
  pg_database.datname as "قاعدة البيانات",
  pg_size_pretty(pg_database_size(pg_database.datname)) as "الحجم",
  (SELECT setting FROM pg_settings WHERE name = 'data_directory') as "مجلد البيانات"
FROM pg_database
WHERE datname = current_database();

-- 15. التحقق من صحة البيانات
-- =====================================================

-- التحقق من وجود مستخدمين بدون عناصر مخزون
SELECT 
  u.name as "المستخدم",
  u.email as "البريد الإلكتروني",
  u.role as "الدور",
  u."createdAt"::date as "تاريخ الإنشاء"
FROM "User" u
LEFT JOIN "InventoryItem" i ON u.id = i."enteredById"
WHERE i.id IS NULL 
  AND u."isActive" = true
  AND u.role = 'DATA_ENTRY';

-- التحقق من العناصر بكميات سالبة أو صفر
SELECT 
  id,
  "itemName" as "اسم العنصر",
  batch as "الدفعة",
  quantity as "الكمية",
  destination as "الوجهة",
  "createdAt"::date as "تاريخ الإنشاء"
FROM "InventoryItem"
WHERE quantity <= 0
ORDER BY "createdAt" DESC;

-- التحقق من المستخدمين المكررين (نفس البريد الإلكتروني)
SELECT 
  email as "البريد الإلكتروني",
  COUNT(*) as "عدد المستخدمين",
  string_agg(name, ', ') as "الأسماء"
FROM "User"
GROUP BY email
HAVING COUNT(*) > 1;

-- 16. استعلامات الصيانة
-- =====================================================

-- إعادة بناء الإحصائيات
-- ANALYZE;

-- تنظيف الجداول (إزالة الصفوف المحذوفة)
-- VACUUM ANALYZE;

-- إعادة فهرسة جميع الجداول
-- REINDEX DATABASE postgres;

-- تحديث إحصائيات الاستعلامات
-- SELECT pg_stat_statements_reset();

-- =====================================================
-- ملاحظات مهمة:
-- 1. قم بتشغيل هذه الاستعلامات بانتظام لمراقبة النظام
-- 2. استعلامات الصيانة يجب تشغيلها في أوقات قليلة الاستخدام
-- 3. راقب الاستعلامات البطيئة وقم بتحسينها
-- 4. تأكد من وجود نسخ احتياطية منتظمة
-- =====================================================