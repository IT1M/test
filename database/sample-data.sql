-- =====================================================
-- بيانات تجريبية لنظام مخزون مايس السعودية
-- Sample Data for Saudi MAIS Inventory System
-- =====================================================

-- تنظيف البيانات الموجودة (اختياري - احذر من استخدامه في الإنتاج!)
-- TRUNCATE TABLE "SavedSearchShare", "SavedSearch", "Notification", "Backup", "Report", "AuditLog", "InventoryItem", "User" CASCADE;

-- 1. إنشاء المستخدمين التجريبيين
-- =====================================================

INSERT INTO "User" (id, email, name, password, role, "isActive", "twoFactorEnabled", "createdAt") VALUES
-- المديرون
('admin-001', 'admin@mais.sa', 'أحمد المدير', '$2b$10$example.hash.admin', 'ADMIN', true, true, NOW() - INTERVAL '30 days'),
('admin-002', 'manager@mais.sa', 'فاطمة المديرة', '$2b$10$example.hash.manager', 'MANAGER', true, false, NOW() - INTERVAL '25 days'),

-- المشرفون
('supervisor-001', 'supervisor1@mais.sa', 'محمد المشرف', '$2b$10$example.hash.supervisor1', 'SUPERVISOR', true, true, NOW() - INTERVAL '20 days'),
('supervisor-002', 'supervisor2@mais.sa', 'نورا المشرفة', '$2b$10$example.hash.supervisor2', 'SUPERVISOR', true, false, NOW() - INTERVAL '18 days'),

-- المراجعون
('auditor-001', 'auditor@mais.sa', 'خالد المراجع', '$2b$10$example.hash.auditor', 'AUDITOR', true, true, NOW() - INTERVAL '15 days'),

-- موظفو إدخال البيانات
('data-001', 'data1@mais.sa', 'سارة موظفة البيانات', '$2b$10$example.hash.data1', 'DATA_ENTRY', true, false, NOW() - INTERVAL '12 days'),
('data-002', 'data2@mais.sa', 'عبدالله موظف البيانات', '$2b$10$example.hash.data2', 'DATA_ENTRY', true, false, NOW() - INTERVAL '10 days'),
('data-003', 'data3@mais.sa', 'مريم موظفة البيانات', '$2b$10$example.hash.data3', 'DATA_ENTRY', true, false, NOW() - INTERVAL '8 days'),
('data-004', 'data4@mais.sa', 'يوسف موظف البيانات', '$2b$10$example.hash.data4', 'DATA_ENTRY', true, false, NOW() - INTERVAL '5 days'),
('data-005', 'data5@mais.sa', 'هند موظفة البيانات', '$2b$10$example.hash.data5', 'DATA_ENTRY', false, false, NOW() - INTERVAL '3 days');

-- 2. إنشاء عناصر المخزون التجريبية
-- =====================================================

-- منتجات الألبان
INSERT INTO "InventoryItem" (id, "itemName", batch, quantity, reject, destination, category, notes, "enteredById", "createdAt") VALUES
('item-001', 'حليب طازج كامل الدسم', 'MILK-2024-001', 500, 5, 'MAIS', 'منتجات الألبان', 'حليب عالي الجودة من المزارع المحلية', 'data-001', NOW() - INTERVAL '10 days'),
('item-002', 'جبن أبيض طري', 'CHEESE-2024-001', 200, 3, 'FOZAN', 'منتجات الألبان', 'جبن طازج للتوزيع', 'data-002', NOW() - INTERVAL '9 days'),
('item-003', 'زبدة طبيعية', 'BUTTER-2024-001', 150, 2, 'MAIS', 'منتجات الألبان', 'زبدة من كريمة الحليب الطازج', 'data-001', NOW() - INTERVAL '8 days'),
('item-004', 'لبن رائب', 'YOGURT-2024-001', 300, 8, 'FOZAN', 'منتجات الألبان', 'لبن رائب بالفواكه', 'data-003', NOW() - INTERVAL '7 days'),

-- الحبوب والبقوليات
('item-005', 'أرز بسمتي', 'RICE-2024-001', 1000, 15, 'MAIS', 'حبوب', 'أرز بسمتي عالي الجودة', 'data-002', NOW() - INTERVAL '6 days'),
('item-006', 'عدس أحمر', 'LENTIL-2024-001', 800, 12, 'FOZAN', 'بقوليات', 'عدس أحمر مغسول ومنظف', 'data-004', NOW() - INTERVAL '5 days'),
('item-007', 'فاصوليا بيضاء', 'BEANS-2024-001', 600, 10, 'MAIS', 'بقوليات', 'فاصوليا بيضاء كبيرة الحجم', 'data-001', NOW() - INTERVAL '4 days'),
('item-008', 'حمص حب', 'CHICKPEA-2024-001', 700, 18, 'FOZAN', 'بقوليات', 'حمص حب للطبخ', 'data-003', NOW() - INTERVAL '3 days'),

-- الخضروات والفواكه
('item-009', 'طماطم طازجة', 'TOMATO-2024-001', 400, 25, 'MAIS', 'خضروات', 'طماطم حمراء طازجة', 'data-005', NOW() - INTERVAL '2 days'),
('item-010', 'بصل أحمر', 'ONION-2024-001', 350, 20, 'FOZAN', 'خضروات', 'بصل أحمر حلو', 'data-002', NOW() - INTERVAL '1 day'),
('item-011', 'تفاح أحمر', 'APPLE-2024-001', 250, 15, 'MAIS', 'فواكه', 'تفاح أحمر طازج', 'data-004', NOW()),
('item-012', 'موز', 'BANANA-2024-001', 180, 12, 'FOZAN', 'فواكه', 'موز استوائي ناضج', 'data-001', NOW()),

-- اللحوم والدواجن
('item-013', 'لحم بقري مفروم', 'BEEF-2024-001', 100, 2, 'MAIS', 'لحوم', 'لحم بقري طازج مفروم', 'data-003', NOW() - INTERVAL '1 day'),
('item-014', 'دجاج كامل', 'CHICKEN-2024-001', 80, 3, 'FOZAN', 'دواجن', 'دجاج طازج كامل', 'data-002', NOW() - INTERVAL '2 days'),
('item-015', 'سمك سلمون', 'SALMON-2024-001', 60, 1, 'MAIS', 'أسماك', 'سمك سلمون طازج', 'data-005', NOW() - INTERVAL '3 days'),

-- المواد الغذائية الأساسية
('item-016', 'زيت زيتون', 'OLIVE-OIL-2024-001', 120, 0, 'FOZAN', 'زيوت', 'زيت زيتون بكر ممتاز', 'data-001', NOW() - INTERVAL '4 days'),
('item-017', 'سكر أبيض', 'SUGAR-2024-001', 500, 5, 'MAIS', 'محليات', 'سكر أبيض ناعم', 'data-004', NOW() - INTERVAL '5 days'),
('item-018', 'ملح طعام', 'SALT-2024-001', 300, 2, 'FOZAN', 'توابل', 'ملح طعام مكرر', 'data-002', NOW() - INTERVAL '6 days'),
('item-019', 'دقيق أبيض', 'FLOUR-2024-001', 800, 10, 'MAIS', 'دقيق', 'دقيق أبيض للخبز', 'data-003', NOW() - INTERVAL '7 days'),
('item-020', 'شاي أسود', 'TEA-2024-001', 200, 3, 'FOZAN', 'مشروبات', 'شاي أسود عالي الجودة', 'data-005', NOW() - INTERVAL '8 days');

-- 3. إنشاء سجلات المراجعة التجريبية
-- =====================================================

INSERT INTO "AuditLog" (id, "userId", action, "entityType", "entityId", "oldValue", "newValue", "ipAddress", "userAgent", timestamp) VALUES
('audit-001', 'admin-001', 'LOGIN', 'User', 'admin-001', NULL, '{"loginTime": "2024-01-15T08:00:00Z"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NOW() - INTERVAL '1 day'),
('audit-002', 'data-001', 'CREATE', 'InventoryItem', 'item-001', NULL, '{"itemName": "حليب طازج", "quantity": 500}', '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NOW() - INTERVAL '10 days'),
('audit-003', 'supervisor-001', 'UPDATE', 'InventoryItem', 'item-002', '{"quantity": 200}', '{"quantity": 195}', '192.168.1.102', 'Mozilla/5.0 (Macintosh; Intel Mac OS X)', NOW() - INTERVAL '5 days'),
('audit-004', 'data-002', 'CREATE', 'InventoryItem', 'item-005', NULL, '{"itemName": "أرز بسمتي", "quantity": 1000}', '192.168.1.103', 'Mozilla/5.0 (X11; Linux x86_64)', NOW() - INTERVAL '6 days'),
('audit-005', 'admin-001', 'DELETE', 'User', 'old-user-001', '{"name": "مستخدم قديم", "email": "old@mais.sa"}', NULL, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NOW() - INTERVAL '3 days');

-- 4. إنشاء التقارير التجريبية
-- =====================================================

INSERT INTO "Report" (id, title, type, "periodStart", "periodEnd", "generatedById", "fileUrl", "dataSnapshot", "aiInsights", status, "createdAt") VALUES
('report-001', 'تقرير المخزون الشهري - يناير 2024', 'MONTHLY', '2024-01-01', '2024-01-31', 'admin-001', '/reports/monthly-jan-2024.pdf', 
'{"totalItems": 1500, "totalValue": 50000, "topCategories": ["منتجات الألبان", "حبوب", "خضروات"]}', 
'يظهر التقرير نمواً في مخزون منتجات الألبان بنسبة 15% مقارنة بالشهر السابق. يُنصح بزيادة مخزون الخضروات لتلبية الطلب المتزايد.', 
'COMPLETED', NOW() - INTERVAL '5 days'),

('report-002', 'تقرير سنوي 2023', 'YEARLY', '2023-01-01', '2023-12-31', 'manager-002', '/reports/yearly-2023.pdf',
'{"totalItems": 18000, "totalValue": 600000, "growth": "12%"}',
'النمو السنوي في المخزون بلغ 12% مع تحسن ملحوظ في إدارة المخزون وتقليل الفاقد.',
'COMPLETED', NOW() - INTERVAL '10 days'),

('report-003', 'تقرير مراجعة النظام', 'AUDIT', '2024-01-01', '2024-01-15', 'auditor-001', NULL,
'{"auditActions": 150, "users": 10, "criticalIssues": 0}',
'لا توجد مشاكل أمنية أو انتهاكات في النظام. جميع العمليات تتم وفقاً للسياسات المحددة.',
'GENERATING', NOW() - INTERVAL '1 day');

-- 5. إنشاء النسخ الاحتياطية التجريبية
-- =====================================================

INSERT INTO "Backup" (id, "fileName", "fileSize", "fileType", "recordCount", "storagePath", status, "createdAt", "createdById") VALUES
('backup-001', 'inventory_backup_20240115.csv', 2048576, 'CSV', 1500, '/backups/csv/inventory_backup_20240115.csv', 'COMPLETED', NOW() - INTERVAL '3 days', 'admin-001'),
('backup-002', 'full_backup_20240110.sql', 10485760, 'SQL', 5000, '/backups/sql/full_backup_20240110.sql', 'COMPLETED', NOW() - INTERVAL '8 days', 'admin-001'),
('backup-003', 'users_backup_20240112.json', 512000, 'JSON', 10, '/backups/json/users_backup_20240112.json', 'COMPLETED', NOW() - INTERVAL '6 days', 'admin-002');

-- 6. إنشاء الإشعارات التجريبية
-- =====================================================

INSERT INTO "Notification" (id, "userId", type, title, message, "isRead", metadata, "createdAt") VALUES
('notif-001', 'admin-001', 'INFO', 'تم إنشاء تقرير جديد', 'تم إنشاء التقرير الشهري لشهر يناير 2024 بنجاح', false, '{"reportId": "report-001"}', NOW() - INTERVAL '2 hours'),
('notif-002', 'data-001', 'SUCCESS', 'تم حفظ البيانات', 'تم حفظ عنصر المخزون الجديد بنجاح', true, '{"itemId": "item-001"}', NOW() - INTERVAL '1 day'),
('notif-003', 'supervisor-001', 'WARNING', 'انخفاض في المخزون', 'مخزون الطماطم انخفض إلى أقل من الحد الأدنى', false, '{"itemId": "item-009", "currentQuantity": 400}', NOW() - INTERVAL '3 hours'),
('notif-004', 'auditor-001', 'ERROR', 'محاولة دخول غير مصرح', 'تم رصد محاولة دخول غير مصرح من عنوان IP غير معروف', false, '{"ipAddress": "192.168.1.999", "timestamp": "2024-01-15T10:30:00Z"}', NOW() - INTERVAL '1 hour'),
('notif-005', 'data-002', 'INFO', 'تحديث النظام', 'سيتم تحديث النظام غداً من الساعة 2:00 إلى 4:00 صباحاً', false, '{"maintenanceWindow": "2024-01-16T02:00:00Z"}', NOW() - INTERVAL '30 minutes');

-- 7. إنشاء عمليات البحث المحفوظة التجريبية
-- =====================================================

INSERT INTO "SavedSearch" (id, name, description, query, filters, "isShared", "isPublic", "createdById", "createdAt") VALUES
('search-001', 'منتجات الألبان - مايس', 'البحث عن جميع منتجات الألبان المخصصة لمايس', 'منتجات الألبان', 
'{"destination": "MAIS", "category": "منتجات الألبان"}', true, false, 'data-001', NOW() - INTERVAL '5 days'),

('search-002', 'المخزون المنخفض', 'البحث عن العناصر التي تحتاج إعادة تموين', 'كمية قليلة',
'{"quantity": {"$lt": 100}}', true, true, 'supervisor-001', NOW() - INTERVAL '3 days'),

('search-003', 'إدخالات الأسبوع الماضي', 'جميع العناصر المدخلة في الأسبوع الماضي', 'أسبوع ماضي',
'{"createdAt": {"$gte": "2024-01-08", "$lte": "2024-01-14"}}', false, false, 'admin-001', NOW() - INTERVAL '2 days');

-- 8. إنشاء مشاركات البحث التجريبية
-- =====================================================

INSERT INTO "SavedSearchShare" (id, "savedSearchId", "userId", "canEdit", "createdAt") VALUES
('share-001', 'search-001', 'supervisor-001', true, NOW() - INTERVAL '4 days'),
('share-002', 'search-001', 'data-002', false, NOW() - INTERVAL '4 days'),
('share-003', 'search-002', 'admin-001', true, NOW() - INTERVAL '2 days'),
('share-004', 'search-002', 'data-003', false, NOW() - INTERVAL '2 days');

-- 9. إنشاء إعدادات النظام التجريبية
-- =====================================================

INSERT INTO "SystemSettings" (id, key, value, category, "updatedById", "updatedAt") VALUES
('setting-001', 'max_inventory_items_per_page', '50', 'display', 'admin-001', NOW() - INTERVAL '7 days'),
('setting-002', 'auto_backup_enabled', 'true', 'backup', 'admin-001', NOW() - INTERVAL '5 days'),
('setting-003', 'notification_email_enabled', 'true', 'notifications', 'admin-002', NOW() - INTERVAL '3 days'),
('setting-004', 'low_stock_threshold', '100', 'inventory', 'supervisor-001', NOW() - INTERVAL '2 days'),
('setting-005', 'session_timeout_minutes', '60', 'security', 'admin-001', NOW() - INTERVAL '1 day');

-- =====================================================
-- التحقق من البيانات المدخلة
-- =====================================================

-- عرض ملخص البيانات المدخلة
SELECT 'المستخدمون' as "الجدول", COUNT(*) as "العدد" FROM "User"
UNION ALL
SELECT 'عناصر المخزون', COUNT(*) FROM "InventoryItem"
UNION ALL
SELECT 'سجلات المراجعة', COUNT(*) FROM "AuditLog"
UNION ALL
SELECT 'التقارير', COUNT(*) FROM "Report"
UNION ALL
SELECT 'النسخ الاحتياطية', COUNT(*) FROM "Backup"
UNION ALL
SELECT 'الإشعارات', COUNT(*) FROM "Notification"
UNION ALL
SELECT 'عمليات البحث المحفوظة', COUNT(*) FROM "SavedSearch"
UNION ALL
SELECT 'إعدادات النظام', COUNT(*) FROM "SystemSettings";

-- عرض توزيع المستخدمين حسب الأدوار
SELECT 
  role as "الدور",
  COUNT(*) as "العدد",
  COUNT(CASE WHEN "isActive" THEN 1 END) as "النشطين"
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

-- عرض توزيع المخزون حسب الوجهة
SELECT 
  destination as "الوجهة",
  COUNT(*) as "عدد العناصر",
  SUM(quantity) as "إجمالي الكمية"
FROM "InventoryItem"
GROUP BY destination;

-- =====================================================
-- ملاحظات مهمة:
-- 1. هذه بيانات تجريبية للاختبار فقط
-- 2. كلمات المرور المستخدمة هنا وهمية ويجب تغييرها
-- 3. تأكد من تشفير كلمات المرور الحقيقية باستخدام bcrypt
-- 4. يمكن حذف هذه البيانات عند الانتقال للإنتاج
-- =====================================================