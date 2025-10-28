-- =====================================================
-- الإعدادات الأساسية لقاعدة البيانات
-- Basic Database Setup - Saudi MAIS Inventory System
-- =====================================================

-- 1. تفعيل الامتدادات الأساسية
-- =====================================================

-- تفعيل امتداد UUID لإنشاء معرفات فريدة
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- تفعيل امتداد البحث النصي للغة العربية
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- تفعيل امتداد التشفير
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. إنشاء المخططات الأساسية
-- =====================================================

-- مخطط للمصادقة والتفويض
CREATE SCHEMA IF NOT EXISTS auth;

-- مخطط للتقارير والإحصائيات
CREATE SCHEMA IF NOT EXISTS reports;

-- 3. إعداد المناطق الزمنية والتوطين
-- =====================================================

-- تعيين المنطقة الزمنية للسعودية
SET timezone = 'Asia/Riyadh';

-- تعيين اللغة العربية كافتراضية
SET lc_messages = 'ar_SA.UTF-8';
SET lc_monetary = 'ar_SA.UTF-8';
SET lc_numeric = 'ar_SA.UTF-8';
SET lc_time = 'ar_SA.UTF-8';

-- 4. إنشاء الأدوار الأساسية
-- =====================================================

-- دور المدير الرئيسي
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'mais_admin') THEN
    CREATE ROLE mais_admin WITH LOGIN PASSWORD 'change_this_password';
  END IF;
END
$$;

-- دور التطبيق
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'mais_app') THEN
    CREATE ROLE mais_app WITH LOGIN PASSWORD 'change_this_password';
  END IF;
END
$$;-- 
دور القراءة فقط
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'mais_readonly') THEN
    CREATE ROLE mais_readonly WITH LOGIN PASSWORD 'change_this_password';
  END IF;
END
$$;

-- 5. منح الصلاحيات الأساسية
-- =====================================================

-- صلاحيات المدير
GRANT ALL PRIVILEGES ON DATABASE postgres TO mais_admin;
GRANT ALL PRIVILEGES ON SCHEMA public TO mais_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO mais_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO mais_admin;

-- صلاحيات التطبيق
GRANT CONNECT ON DATABASE postgres TO mais_app;
GRANT USAGE ON SCHEMA public TO mais_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO mais_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO mais_app;

-- صلاحيات القراءة فقط
GRANT CONNECT ON DATABASE postgres TO mais_readonly;
GRANT USAGE ON SCHEMA public TO mais_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO mais_readonly;

-- 6. إعدادات الأمان الأساسية
-- =====================================================

-- تفعيل تسجيل الاتصالات
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;

-- تفعيل تسجيل الاستعلامات الطويلة (أكثر من ثانية واحدة)
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- تحديد الحد الأقصى للاتصالات
ALTER SYSTEM SET max_connections = 100;

-- 7. إنشاء الدوال الأساسية للنظام
-- =====================================================

-- دالة للحصول على الوقت الحالي بتوقيت السعودية
CREATE OR REPLACE FUNCTION saudi_now() 
RETURNS timestamp with time zone AS $$
BEGIN
  RETURN NOW() AT TIME ZONE 'Asia/Riyadh';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- دالة لتوليد معرف فريد
CREATE OR REPLACE FUNCTION generate_id() 
RETURNS text AS $$
BEGIN
  RETURN uuid_generate_v4()::text;
END;
$$ LANGUAGE plpgsql;-- دال
ة لتشفير كلمات المرور
CREATE OR REPLACE FUNCTION hash_password(password text) 
RETURNS text AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf', 10));
END;
$$ LANGUAGE plpgsql;

-- دالة للتحقق من كلمة المرور
CREATE OR REPLACE FUNCTION verify_password(password text, hash text) 
RETURNS boolean AS $$
BEGIN
  RETURN hash = crypt(password, hash);
END;
$$ LANGUAGE plpgsql;

-- 8. إنشاء الفهارس الأساسية
-- =====================================================

-- فهرس لجدول المستخدمين
CREATE INDEX IF NOT EXISTS idx_user_email ON "User" (email);
CREATE INDEX IF NOT EXISTS idx_user_role ON "User" (role);
CREATE INDEX IF NOT EXISTS idx_user_active ON "User" ("isActive");

-- فهرس لجدول المخزون
CREATE INDEX IF NOT EXISTS idx_inventory_item_name ON "InventoryItem" ("itemName");
CREATE INDEX IF NOT EXISTS idx_inventory_destination ON "InventoryItem" (destination);
CREATE INDEX IF NOT EXISTS idx_inventory_created_at ON "InventoryItem" ("createdAt");
CREATE INDEX IF NOT EXISTS idx_inventory_entered_by ON "InventoryItem" ("enteredById");

-- فهرس لسجلات المراجعة
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON "AuditLog" ("userId");
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON "AuditLog" (timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_action ON "AuditLog" (action);

-- 9. إنشاء القيود الأساسية
-- =====================================================

-- قيود التحقق من صحة البيانات
ALTER TABLE "InventoryItem" 
ADD CONSTRAINT check_positive_quantity 
CHECK (quantity >= 0);

ALTER TABLE "InventoryItem" 
ADD CONSTRAINT check_non_negative_reject 
CHECK (reject >= 0);

ALTER TABLE "User" 
ADD CONSTRAINT check_valid_email 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- 10. إعداد النسخ الاحتياطي التلقائي
-- =====================================================

-- جدول لتتبع النسخ الاحتياطية
CREATE TABLE IF NOT EXISTS backup_schedule (
  id SERIAL PRIMARY KEY,
  backup_type VARCHAR(20) NOT NULL,
  schedule_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_run TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- إدراج جدولة النسخ الاحتياطية الافتراضية
INSERT INTO backup_schedule (backup_type, schedule_time) VALUES
('daily', '02:00:00'),
('weekly', '01:00:00'),
('monthly', '00:00:00')
ON CONFLICT DO NOTHING;-
- 11. إنشاء المشاهدات الأساسية
-- =====================================================

-- مشاهدة للمستخدمين النشطين
CREATE OR REPLACE VIEW active_users AS
SELECT 
  id,
  name,
  email,
  role,
  "createdAt",
  "updatedAt"
FROM "User" 
WHERE "isActive" = true;

-- مشاهدة لإحصائيات المخزون السريعة
CREATE OR REPLACE VIEW inventory_stats AS
SELECT 
  COUNT(*) as total_items,
  SUM(quantity) as total_quantity,
  COUNT(DISTINCT destination) as destinations,
  COUNT(DISTINCT category) as categories,
  COUNT(DISTINCT "enteredById") as contributors
FROM "InventoryItem";

-- 12. إعداد المحفزات الأساسية
-- =====================================================

-- دالة لتحديث timestamp تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = saudi_now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق المحفز على جدول المستخدمين
DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
CREATE TRIGGER update_user_updated_at
  BEFORE UPDATE ON "User"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- تطبيق المحفز على جدول المخزون
DROP TRIGGER IF EXISTS update_inventory_updated_at ON "InventoryItem";
CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON "InventoryItem"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 13. إنشاء مستخدم المدير الافتراضي
-- =====================================================

-- إدراج المدير الافتراضي (يجب تغيير كلمة المرور)
INSERT INTO "User" (
  id, 
  email, 
  name, 
  password, 
  role, 
  "isActive", 
  "twoFactorEnabled",
  "createdAt"
) VALUES (
  generate_id(),
  'admin@mais.sa',
  'مدير النظام',
  hash_password('Admin123!@#'),
  'ADMIN',
  true,
  false,
  saudi_now()
) ON CONFLICT (email) DO NOTHING;

-- 14. إعدادات النظام الافتراضية
-- =====================================================

INSERT INTO "SystemSettings" (id, key, value, category, "updatedById", "updatedAt") VALUES
(generate_id(), 'system_name', '"نظام مخزون مايس السعودية"', 'general', 
 (SELECT id FROM "User" WHERE email = 'admin@mais.sa' LIMIT 1), saudi_now()),
(generate_id(), 'default_language', '"ar"', 'localization', 
 (SELECT id FROM "User" WHERE email = 'admin@mais.sa' LIMIT 1), saudi_now()),
(generate_id(), 'timezone', '"Asia/Riyadh"', 'localization', 
 (SELECT id FROM "User" WHERE email = 'admin@mais.sa' LIMIT 1), saudi_now()),
(generate_id(), 'max_items_per_page', '50', 'display', 
 (SELECT id FROM "User" WHERE email = 'admin@mais.sa' LIMIT 1), saudi_now()),
(generate_id(), 'session_timeout', '3600', 'security', 
 (SELECT id FROM "User" WHERE email = 'admin@mais.sa' LIMIT 1), saudi_now())
ON CONFLICT (key) DO NOTHING;-
- 15. التحقق من الإعداد
-- =====================================================

-- التحقق من الامتدادات المثبتة
SELECT 
  extname as "الامتداد",
  extversion as "الإصدار"
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'unaccent', 'pgcrypto');

-- التحقق من الأدوار المنشأة
SELECT 
  rolname as "اسم الدور",
  rolcanlogin as "يمكن تسجيل الدخول",
  rolcreatedb as "يمكن إنشاء قواعد بيانات"
FROM pg_roles 
WHERE rolname LIKE 'mais_%';

-- التحقق من الجداول الموجودة
SELECT 
  table_name as "اسم الجدول",
  table_type as "نوع الجدول"
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- التحقق من الفهارس المنشأة
SELECT 
  indexname as "اسم الفهرس",
  tablename as "الجدول",
  indexdef as "تعريف الفهرس"
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- التحقق من المستخدم الافتراضي
SELECT 
  name as "الاسم",
  email as "البريد الإلكتروني",
  role as "الدور",
  "isActive" as "نشط"
FROM "User" 
WHERE email = 'admin@mais.sa';

-- 16. رسائل التأكيد
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ تم إعداد قاعدة البيانات بنجاح!';
  RAISE NOTICE '📋 تم إنشاء الأدوار والصلاحيات';
  RAISE NOTICE '🔐 تم إنشاء المستخدم الافتراضي: admin@mais.sa';
  RAISE NOTICE '⚠️  يجب تغيير كلمة المرور الافتراضية فوراً!';
  RAISE NOTICE '📊 تم إنشاء الفهارس والمشاهدات الأساسية';
  RAISE NOTICE '🔧 تم تطبيق الإعدادات الأساسية';
END
$$;

-- =====================================================
-- ملاحظات مهمة:
-- 1. غير كلمات المرور الافتراضية فوراً
-- 2. راجع إعدادات الأمان حسب بيئة الإنتاج
-- 3. تأكد من إنشاء نسخ احتياطية منتظمة
-- 4. راقب أداء قاعدة البيانات بانتظام
-- =====================================================

COMMIT;