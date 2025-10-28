-- =====================================================
-- Saudi MAIS Inventory System - Database Security Setup
-- تفعيل Row Level Security (RLS) والإعدادات الأمنية
-- =====================================================

-- 1. تفعيل Row Level Security على جميع الجداول
-- =====================================================

-- تفعيل RLS على جدول المستخدمين
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على جدول المخزون
ALTER TABLE "InventoryItem" ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على جدول سجلات المراجعة
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على جدول التقارير
ALTER TABLE "Report" ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على جدول النسخ الاحتياطية
ALTER TABLE "Backup" ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على جدول الإشعارات
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على جدول البحث المحفوظ
ALTER TABLE "SavedSearch" ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على جدول مشاركة البحث
ALTER TABLE "SavedSearchShare" ENABLE ROW LEVEL SECURITY;

-- 2. إنشاء دوال مساعدة للتحقق من الصلاحيات
-- =====================================================

-- دالة للحصول على معرف المستخدم الحالي
CREATE OR REPLACE FUNCTION auth.user_id() RETURNS text AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::text;
$$ LANGUAGE sql STABLE;

-- دالة للحصول على دور المستخدم الحالي
CREATE OR REPLACE FUNCTION auth.user_role() RETURNS text AS $$
  SELECT nullif(current_setting('request.jwt.claim.role', true), '')::text;
$$ LANGUAGE sql STABLE;

-- دالة للتحقق من كون المستخدم مدير
CREATE OR REPLACE FUNCTION auth.is_admin() RETURNS boolean AS $$
  SELECT auth.user_role() = 'ADMIN';
$$ LANGUAGE sql STABLE;

-- دالة للتحقق من كون المستخدم مشرف أو مدير
CREATE OR REPLACE FUNCTION auth.is_supervisor_or_above() RETURNS boolean AS $$
  SELECT auth.user_role() IN ('ADMIN', 'SUPERVISOR', 'MANAGER');
$$ LANGUAGE sql STABLE;

-- 3. سياسات RLS لجدول المستخدمين
-- =====================================================

-- المديرون يمكنهم رؤية جميع المستخدمين
CREATE POLICY "Admins can view all users" ON "User"
  FOR SELECT USING (auth.is_admin());

-- المستخدمون يمكنهم رؤية بياناتهم الشخصية فقط
CREATE POLICY "Users can view own profile" ON "User"
  FOR SELECT USING (auth.user_id() = id);

-- المديرون فقط يمكنهم إنشاء مستخدمين جدد
CREATE POLICY "Only admins can create users" ON "User"
  FOR INSERT WITH CHECK (auth.is_admin());

-- المديرون يمكنهم تحديث جميع المستخدمين، المستخدمون يمكنهم تحديث بياناتهم
CREATE POLICY "Admins can update all users, users can update own profile" ON "User"
  FOR UPDATE USING (
    auth.is_admin() OR auth.user_id() = id
  );

-- المديرون فقط يمكنهم حذف المستخدمين
CREATE POLICY "Only admins can delete users" ON "User"
  FOR DELETE USING (auth.is_admin());

-- 4. سياسات RLS لجدول المخزون
-- =====================================================

-- جميع المستخدمين المصرح لهم يمكنهم رؤية المخزون
CREATE POLICY "Authenticated users can view inventory" ON "InventoryItem"
  FOR SELECT USING (auth.user_id() IS NOT NULL);

-- جميع المستخدمين يمكنهم إضافة عناصر جديدة
CREATE POLICY "Authenticated users can create inventory items" ON "InventoryItem"
  FOR INSERT WITH CHECK (auth.user_id() IS NOT NULL AND auth.user_id() = "enteredById");

-- المستخدمون يمكنهم تحديث العناصر التي أدخلوها، المشرفون يمكنهم تحديث جميع العناصر
CREATE POLICY "Users can update own items, supervisors can update all" ON "InventoryItem"
  FOR UPDATE USING (
    auth.user_id() = "enteredById" OR auth.is_supervisor_or_above()
  );

-- المشرفون والمديرون فقط يمكنهم حذف العناصر
CREATE POLICY "Only supervisors and above can delete inventory items" ON "InventoryItem"
  FOR DELETE USING (auth.is_supervisor_or_above());

-- 5. سياسات RLS لسجلات المراجعة
-- =====================================================

-- المديرون والمراجعون يمكنهم رؤية جميع سجلات المراجعة
CREATE POLICY "Admins and auditors can view all audit logs" ON "AuditLog"
  FOR SELECT USING (
    auth.user_role() IN ('ADMIN', 'AUDITOR') OR auth.user_id() = "userId"
  );

-- جميع المستخدمين يمكنهم إنشاء سجلات مراجعة (للنظام)
CREATE POLICY "System can create audit logs" ON "AuditLog"
  FOR INSERT WITH CHECK (true);

-- لا يمكن تحديث أو حذف سجلات المراجعة (للحفاظ على سلامة البيانات)
CREATE POLICY "Audit logs are immutable" ON "AuditLog"
  FOR UPDATE USING (false);

CREATE POLICY "Audit logs cannot be deleted" ON "AuditLog"
  FOR DELETE USING (false);

-- 6. سياسات RLS للتقارير
-- =====================================================

-- المستخدمون يمكنهم رؤية التقارير التي أنشأوها، المديرون يمكنهم رؤية جميع التقارير
CREATE POLICY "Users can view own reports, admins can view all" ON "Report"
  FOR SELECT USING (
    auth.user_id() = "generatedById" OR auth.is_admin()
  );

-- جميع المستخدمين يمكنهم إنشاء تقارير
CREATE POLICY "Authenticated users can create reports" ON "Report"
  FOR INSERT WITH CHECK (auth.user_id() = "generatedById");

-- المستخدمون يمكنهم تحديث تقاريرهم، المديرون يمكنهم تحديث جميع التقارير
CREATE POLICY "Users can update own reports, admins can update all" ON "Report"
  FOR UPDATE USING (
    auth.user_id() = "generatedById" OR auth.is_admin()
  );

-- المستخدمون يمكنهم حذف تقاريرهم، المديرون يمكنهم حذف جميع التقارير
CREATE POLICY "Users can delete own reports, admins can delete all" ON "Report"
  FOR DELETE USING (
    auth.user_id() = "generatedById" OR auth.is_admin()
  );

-- 7. سياسات RLS للنسخ الاحتياطية
-- =====================================================

-- المديرون فقط يمكنهم رؤية النسخ الاحتياطية
CREATE POLICY "Only admins can view backups" ON "Backup"
  FOR SELECT USING (auth.is_admin());

-- المديرون فقط يمكنهم إنشاء نسخ احتياطية
CREATE POLICY "Only admins can create backups" ON "Backup"
  FOR INSERT WITH CHECK (auth.is_admin());

-- المديرون فقط يمكنهم تحديث النسخ الاحتياطية
CREATE POLICY "Only admins can update backups" ON "Backup"
  FOR UPDATE USING (auth.is_admin());

-- المديرون فقط يمكنهم حذف النسخ الاحتياطية
CREATE POLICY "Only admins can delete backups" ON "Backup"
  FOR DELETE USING (auth.is_admin());

-- 8. سياسات RLS للإشعارات
-- =====================================================

-- المستخدمون يمكنهم رؤية إشعاراتهم فقط
CREATE POLICY "Users can view own notifications" ON "Notification"
  FOR SELECT USING (auth.user_id() = "userId");

-- النظام يمكنه إنشاء إشعارات لأي مستخدم
CREATE POLICY "System can create notifications" ON "Notification"
  FOR INSERT WITH CHECK (true);

-- المستخدمون يمكنهم تحديث إشعاراتهم (مثل تحديد كمقروءة)
CREATE POLICY "Users can update own notifications" ON "Notification"
  FOR UPDATE USING (auth.user_id() = "userId");

-- المستخدمون يمكنهم حذف إشعاراتهم
CREATE POLICY "Users can delete own notifications" ON "Notification"
  FOR DELETE USING (auth.user_id() = "userId");

-- 9. سياسات RLS للبحث المحفوظ
-- =====================================================

-- المستخدمون يمكنهم رؤية عمليات البحث الخاصة بهم والعامة
CREATE POLICY "Users can view own and public searches" ON "SavedSearch"
  FOR SELECT USING (
    auth.user_id() = "createdById" OR "isPublic" = true
  );

-- المستخدمون يمكنهم إنشاء عمليات بحث محفوظة
CREATE POLICY "Users can create saved searches" ON "SavedSearch"
  FOR INSERT WITH CHECK (auth.user_id() = "createdById");

-- المستخدمون يمكنهم تحديث عمليات البحث الخاصة بهم
CREATE POLICY "Users can update own saved searches" ON "SavedSearch"
  FOR UPDATE USING (auth.user_id() = "createdById");

-- المستخدمون يمكنهم حذف عمليات البحث الخاصة بهم
CREATE POLICY "Users can delete own saved searches" ON "SavedSearch"
  FOR DELETE USING (auth.user_id() = "createdById");

-- 10. إنشاء فهارس إضافية لتحسين الأداء
-- =====================================================

-- فهارس للأمان والأداء
CREATE INDEX IF NOT EXISTS idx_user_active_role ON "User" ("isActive", "role") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_inventory_destination_date ON "InventoryItem" ("destination", "createdAt");
CREATE INDEX IF NOT EXISTS idx_audit_user_action_date ON "AuditLog" ("userId", "action", "timestamp");
CREATE INDEX IF NOT EXISTS idx_notification_user_unread ON "Notification" ("userId", "isRead") WHERE "isRead" = false;

-- 11. إنشاء دوال للإحصائيات والتقارير
-- =====================================================

-- دالة لحساب إجمالي المخزون حسب الوجهة
CREATE OR REPLACE FUNCTION get_inventory_summary_by_destination()
RETURNS TABLE(destination text, total_quantity bigint, total_items bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.destination::text,
    SUM(i.quantity)::bigint as total_quantity,
    COUNT(*)::bigint as total_items
  FROM "InventoryItem" i
  GROUP BY i.destination;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة لحساب الإحصائيات اليومية
CREATE OR REPLACE FUNCTION get_daily_stats(target_date date DEFAULT CURRENT_DATE)
RETURNS TABLE(
  items_added bigint,
  total_quantity bigint,
  unique_users bigint,
  audit_actions bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as items_added,
    COALESCE(SUM(i.quantity), 0)::bigint as total_quantity,
    COUNT(DISTINCT i."enteredById")::bigint as unique_users,
    (SELECT COUNT(*)::bigint FROM "AuditLog" a WHERE DATE(a.timestamp) = target_date) as audit_actions
  FROM "InventoryItem" i
  WHERE DATE(i."createdAt") = target_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. إعدادات الأمان الإضافية
-- =====================================================

-- تفعيل SSL فقط (يجب تشغيله على مستوى قاعدة البيانات)
-- ALTER SYSTEM SET ssl = on;

-- تحديد الحد الأقصى للاتصالات
-- ALTER SYSTEM SET max_connections = 100;

-- تفعيل تسجيل الاستعلامات البطيئة
-- ALTER SYSTEM SET log_min_duration_statement = 1000;

-- 13. إنشاء مستخدمين وأدوار قاعدة البيانات
-- =====================================================

-- إنشاء دور للقراءة فقط
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'readonly_user') THEN
    CREATE ROLE readonly_user;
  END IF;
END
$$;

-- منح صلاحيات القراءة فقط
GRANT CONNECT ON DATABASE postgres TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;

-- إنشاء دور للتطبيق
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user;
  END IF;
END
$$;

-- منح صلاحيات التطبيق
GRANT CONNECT ON DATABASE postgres TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_user;

-- 14. إنشاء مشاهدات (Views) للتقارير
-- =====================================================

-- مشاهدة للمخزون مع تفاصيل المستخدم
CREATE OR REPLACE VIEW inventory_with_user AS
SELECT 
  i.id,
  i."itemName",
  i.batch,
  i.quantity,
  i.reject,
  i.destination,
  i.category,
  i.notes,
  i."createdAt",
  i."updatedAt",
  u.name as entered_by_name,
  u.email as entered_by_email
FROM "InventoryItem" i
JOIN "User" u ON i."enteredById" = u.id;

-- مشاهدة لإحصائيات المستخدمين
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  COUNT(i.id) as items_entered,
  COALESCE(SUM(i.quantity), 0) as total_quantity_entered,
  MAX(i."createdAt") as last_entry_date
FROM "User" u
LEFT JOIN "InventoryItem" i ON u.id = i."enteredById"
GROUP BY u.id, u.name, u.email, u.role;

-- 15. إنشاء محفزات (Triggers) للمراجعة التلقائية
-- =====================================================

-- دالة لإنشاء سجل مراجعة تلقائي
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO "AuditLog" ("userId", "action", "entityType", "entityId", "newValue", "timestamp")
    VALUES (
      COALESCE(auth.user_id(), 'system'),
      'CREATE',
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(NEW),
      NOW()
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO "AuditLog" ("userId", "action", "entityType", "entityId", "oldValue", "newValue", "timestamp")
    VALUES (
      COALESCE(auth.user_id(), 'system'),
      'UPDATE',
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW),
      NOW()
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO "AuditLog" ("userId", "action", "entityType", "entityId", "oldValue", "timestamp")
    VALUES (
      COALESCE(auth.user_id(), 'system'),
      'DELETE',
      TG_TABLE_NAME,
      OLD.id,
      to_jsonb(OLD),
      NOW()
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- إنشاء محفزات للجداول المهمة
DROP TRIGGER IF EXISTS audit_inventory_trigger ON "InventoryItem";
CREATE TRIGGER audit_inventory_trigger
  AFTER INSERT OR UPDATE OR DELETE ON "InventoryItem"
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

DROP TRIGGER IF EXISTS audit_user_trigger ON "User";
CREATE TRIGGER audit_user_trigger
  AFTER INSERT OR UPDATE OR DELETE ON "User"
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- 16. إعدادات النسخ الاحتياطي التلقائي
-- =====================================================

-- دالة للنسخ الاحتياطي التلقائي (تحتاج تشغيل خارجي)
CREATE OR REPLACE FUNCTION schedule_auto_backup()
RETURNS void AS $$
BEGIN
  -- هذه الدالة تحتاج إلى تنفيذ خارجي عبر cron job
  -- pg_dump -h hostname -U username -d database_name > backup_$(date +%Y%m%d_%H%M%S).sql
  RAISE NOTICE 'Auto backup should be scheduled externally using cron job';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- انتهاء إعداد قاعدة البيانات
-- =====================================================

-- التحقق من تفعيل RLS على جميع الجداول
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('User', 'InventoryItem', 'AuditLog', 'Report', 'Backup', 'Notification', 'SavedSearch', 'SavedSearchShare');

-- عرض جميع السياسات المطبقة
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

COMMIT;