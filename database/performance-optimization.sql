-- =====================================================
-- تحسين أداء قاعدة البيانات
-- Database Performance Optimization
-- =====================================================

-- 1. إنشاء فهارس إضافية لتحسين الأداء
-- =====================================================

-- فهارس مركبة للاستعلامات الشائعة
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_destination_category_date 
ON "InventoryItem" (destination, category, "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_name_batch_destination 
ON "InventoryItem" ("itemName", batch, destination);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_user_entity_date 
ON "AuditLog" ("userId", "entityType", timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_user_unread_date 
ON "Notification" ("userId", "isRead", "createdAt" DESC) 
WHERE "isRead" = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_report_type_status_date 
ON "Report" (type, status, "createdAt" DESC);

-- فهارس للبحث النصي
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_item_name_gin 
ON "InventoryItem" USING gin(to_tsvector('arabic', "itemName"));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_notes_gin 
ON "InventoryItem" USING gin(to_tsvector('arabic', notes)) 
WHERE notes IS NOT NULL;

-- فهارس جزئية للبيانات النشطة
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_active_email 
ON "User" (email) WHERE "isActive" = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_recent 
ON "InventoryItem" ("createdAt" DESC, destination) 
WHERE "createdAt" >= CURRENT_DATE - INTERVAL '30 days';

-- 2. إنشاء مشاهدات محسنة للاستعلامات الشائعة
-- =====================================================

-- مشاهدة للمخزون مع الإحصائيات
CREATE OR REPLACE VIEW inventory_summary AS
SELECT 
  destination,
  category,
  COUNT(*) as item_count,
  SUM(quantity) as total_quantity,
  SUM(reject) as total_reject,
  AVG(quantity) as avg_quantity,
  MIN("createdAt") as first_entry,
  MAX("createdAt") as last_entry,
  COUNT(DISTINCT "enteredById") as unique_users
FROM "InventoryItem"
GROUP BY destination, category;

-- مشاهدة للمستخدمين مع إحصائيات النشاط
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  u."isActive",
  COUNT(i.id) as items_entered,
  COALESCE(SUM(i.quantity), 0) as total_quantity,
  COUNT(a.id) as audit_actions,
  MAX(i."createdAt") as last_item_entry,
  MAX(a.timestamp) as last_activity
FROM "User" u
LEFT JOIN "InventoryItem" i ON u.id = i."enteredById"
LEFT JOIN "AuditLog" a ON u.id = a."userId"
GROUP BY u.id, u.name, u.email, u.role, u."isActive";

-- مشاهدة للإحصائيات اليومية
CREATE OR REPLACE VIEW daily_statistics AS
SELECT 
  DATE(i."createdAt") as entry_date,
  i.destination,
  COUNT(*) as items_added,
  SUM(i.quantity) as total_quantity,
  SUM(i.reject) as total_reject,
  COUNT(DISTINCT i."enteredById") as active_users,
  COUNT(DISTINCT i.category) as categories_used
FROM "InventoryItem" i
WHERE i."createdAt" >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(i."createdAt"), i.destination
ORDER BY entry_date DESC, i.destination;

-- 3. إنشاء دوال محسنة للاستعلامات المعقدة
-- =====================================================

-- دالة للبحث السريع في المخزون
CREATE OR REPLACE FUNCTION search_inventory(
  search_term text DEFAULT '',
  filter_destination text DEFAULT NULL,
  filter_category text DEFAULT NULL,
  limit_count integer DEFAULT 50
)
RETURNS TABLE(
  id text,
  item_name text,
  batch text,
  quantity integer,
  destination text,
  category text,
  created_at timestamp,
  entered_by_name text,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i."itemName",
    i.batch,
    i.quantity,
    i.destination::text,
    i.category,
    i."createdAt",
    u.name,
    CASE 
      WHEN search_term = '' THEN 1.0
      ELSE ts_rank(to_tsvector('arabic', i."itemName"), plainto_tsquery('arabic', search_term))
    END as rank
  FROM "InventoryItem" i
  JOIN "User" u ON i."enteredById" = u.id
  WHERE 
    (search_term = '' OR to_tsvector('arabic', i."itemName") @@ plainto_tsquery('arabic', search_term))
    AND (filter_destination IS NULL OR i.destination::text = filter_destination)
    AND (filter_category IS NULL OR i.category = filter_category)
  ORDER BY 
    CASE WHEN search_term = '' THEN i."createdAt" END DESC,
    CASE WHEN search_term != '' THEN ts_rank(to_tsvector('arabic', i."itemName"), plainto_tsquery('arabic', search_term)) END DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- دالة لحساب الإحصائيات المتقدمة
CREATE OR REPLACE FUNCTION get_advanced_statistics(
  start_date date DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  metric_name text,
  metric_value numeric,
  metric_unit text,
  comparison_period numeric,
  trend text
) AS $$
DECLARE
  prev_start_date date := start_date - (end_date - start_date);
  prev_end_date date := start_date;
BEGIN
  RETURN QUERY
  WITH current_stats AS (
    SELECT 
      COUNT(*)::numeric as total_items,
      SUM(quantity)::numeric as total_quantity,
      COUNT(DISTINCT "enteredById")::numeric as active_users,
      AVG(quantity)::numeric as avg_quantity
    FROM "InventoryItem"
    WHERE DATE("createdAt") BETWEEN start_date AND end_date
  ),
  previous_stats AS (
    SELECT 
      COUNT(*)::numeric as total_items,
      SUM(quantity)::numeric as total_quantity,
      COUNT(DISTINCT "enteredById")::numeric as active_users,
      AVG(quantity)::numeric as avg_quantity
    FROM "InventoryItem"
    WHERE DATE("createdAt") BETWEEN prev_start_date AND prev_end_date
  )
  SELECT 'إجمالي العناصر'::text, c.total_items, 'عنصر'::text, 
         CASE WHEN p.total_items > 0 THEN ((c.total_items - p.total_items) / p.total_items * 100) ELSE 0 END,
         CASE WHEN p.total_items > 0 AND c.total_items > p.total_items THEN 'صاعد ↗️'
              WHEN p.total_items > 0 AND c.total_items < p.total_items THEN 'هابط ↘️'
              ELSE 'ثابت ➡️' END
  FROM current_stats c, previous_stats p
  UNION ALL
  SELECT 'إجمالي الكمية'::text, c.total_quantity, 'وحدة'::text,
         CASE WHEN p.total_quantity > 0 THEN ((c.total_quantity - p.total_quantity) / p.total_quantity * 100) ELSE 0 END,
         CASE WHEN p.total_quantity > 0 AND c.total_quantity > p.total_quantity THEN 'صاعد ↗️'
              WHEN p.total_quantity > 0 AND c.total_quantity < p.total_quantity THEN 'هابط ↘️'
              ELSE 'ثابت ➡️' END
  FROM current_stats c, previous_stats p
  UNION ALL
  SELECT 'المستخدمون النشطون'::text, c.active_users, 'مستخدم'::text,
         CASE WHEN p.active_users > 0 THEN ((c.active_users - p.active_users) / p.active_users * 100) ELSE 0 END,
         CASE WHEN p.active_users > 0 AND c.active_users > p.active_users THEN 'صاعد ↗️'
              WHEN p.active_users > 0 AND c.active_users < p.active_users THEN 'هابط ↘️'
              ELSE 'ثابت ➡️' END
  FROM current_stats c, previous_stats p;
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. إعدادات تحسين الأداء
-- =====================================================

-- تحسين إعدادات الذاكرة (يجب تشغيلها بحذر)
-- ALTER SYSTEM SET shared_buffers = '256MB';
-- ALTER SYSTEM SET effective_cache_size = '1GB';
-- ALTER SYSTEM SET maintenance_work_mem = '64MB';
-- ALTER SYSTEM SET checkpoint_completion_target = 0.9;
-- ALTER SYSTEM SET wal_buffers = '16MB';
-- ALTER SYSTEM SET default_statistics_target = 100;

-- تحسين إعدادات الاستعلامات
-- ALTER SYSTEM SET random_page_cost = 1.1;
-- ALTER SYSTEM SET effective_io_concurrency = 200;

-- 5. إنشاء جداول مقسمة للبيانات الكبيرة (Partitioning)
-- =====================================================

-- تقسيم جدول سجلات المراجعة حسب التاريخ
-- CREATE TABLE audit_log_partitioned (
--   LIKE "AuditLog" INCLUDING ALL
-- ) PARTITION BY RANGE (timestamp);

-- إنشاء أقسام شهرية
-- CREATE TABLE audit_log_2024_01 PARTITION OF audit_log_partitioned
-- FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- CREATE TABLE audit_log_2024_02 PARTITION OF audit_log_partitioned
-- FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- 6. إنشاء مهام الصيانة التلقائية
-- =====================================================

-- دالة لتنظيف البيانات القديمة
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- حذف سجلات المراجعة الأقدم من سنة
  DELETE FROM "AuditLog" 
  WHERE timestamp < NOW() - INTERVAL '1 year';
  
  -- حذف الإشعارات المقروءة الأقدم من 3 شهور
  DELETE FROM "Notification" 
  WHERE "isRead" = true AND "createdAt" < NOW() - INTERVAL '3 months';
  
  -- حذف التقارير المكتملة الأقدم من سنتين
  DELETE FROM "Report" 
  WHERE status = 'COMPLETED' AND "createdAt" < NOW() - INTERVAL '2 years';
  
  RAISE NOTICE 'تم تنظيف البيانات القديمة بنجاح';
END;
$$ LANGUAGE plpgsql;

-- دالة لتحديث الإحصائيات
CREATE OR REPLACE FUNCTION update_table_statistics()
RETURNS void AS $$
BEGIN
  ANALYZE "User";
  ANALYZE "InventoryItem";
  ANALYZE "AuditLog";
  ANALYZE "Report";
  ANALYZE "Notification";
  
  RAISE NOTICE 'تم تحديث إحصائيات الجداول بنجاح';
END;
$$ LANGUAGE plpgsql;

-- 7. مراقبة الأداء
-- =====================================================

-- مشاهدة لمراقبة الاستعلامات البطيئة
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time,
  stddev_time,
  rows,
  100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE mean_time > 100  -- أكثر من 100ms
ORDER BY mean_time DESC;

-- مشاهدة لمراقبة استخدام الفهارس
CREATE OR REPLACE VIEW index_usage AS
SELECT 
  schemaname,
  relname as table_name,
  indexrelname as index_name,
  idx_scan as times_used,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
  CASE 
    WHEN idx_scan = 0 THEN 'غير مستخدم - يمكن حذفه'
    WHEN idx_scan < 100 THEN 'قليل الاستخدام'
    ELSE 'مستخدم بكثرة'
  END as usage_status
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- مشاهدة لمراقبة حجم الجداول
CREATE OR REPLACE VIEW table_sizes AS
SELECT 
  schemaname,
  relname as table_name,
  pg_size_pretty(pg_total_relation_size(relid)) as total_size,
  pg_size_pretty(pg_relation_size(relid)) as table_size,
  pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) as index_size,
  pg_stat_get_tuples_returned(relid) as rows_read,
  pg_stat_get_tuples_fetched(relid) as rows_fetched
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- 8. إنشاء تقارير الأداء
-- =====================================================

-- دالة لتقرير الأداء الشامل
CREATE OR REPLACE FUNCTION generate_performance_report()
RETURNS TABLE(
  section text,
  metric text,
  value text,
  recommendation text
) AS $$
BEGIN
  RETURN QUERY
  -- إحصائيات قاعدة البيانات
  SELECT 
    'إحصائيات عامة'::text,
    'حجم قاعدة البيانات'::text,
    pg_size_pretty(pg_database_size(current_database())),
    'مراقبة النمو بانتظام'::text
  UNION ALL
  SELECT 
    'إحصائيات عامة'::text,
    'عدد الاتصالات النشطة'::text,
    (SELECT COUNT(*)::text FROM pg_stat_activity WHERE state = 'active'),
    'تأكد من عدم تجاوز الحد الأقصى'::text
  UNION ALL
  -- أداء الاستعلامات
  SELECT 
    'أداء الاستعلامات'::text,
    'متوسط وقت الاستعلام'::text,
    COALESCE((SELECT ROUND(AVG(mean_time), 2)::text || ' ms' FROM pg_stat_statements), 'غير متاح'),
    'استهدف أقل من 100ms للاستعلامات الشائعة'::text
  UNION ALL
  -- استخدام الذاكرة
  SELECT 
    'استخدام الموارد'::text,
    'نسبة إصابة الذاكرة المؤقتة'::text,
    (SELECT ROUND(100.0 * sum(blks_hit) / (sum(blks_hit) + sum(blks_read)), 2)::text || '%' 
     FROM pg_stat_database WHERE datname = current_database()),
    'يجب أن تكون أكثر من 95%'::text;
END;
$$ LANGUAGE plpgsql STABLE;

-- 9. استعلامات التحسين السريع
-- =====================================================

-- البحث عن الجداول التي تحتاج VACUUM
SELECT 
  schemaname,
  relname,
  n_dead_tup,
  n_live_tup,
  ROUND(n_dead_tup * 100.0 / GREATEST(n_live_tup, 1), 2) as dead_tuple_percent
FROM pg_stat_user_tables 
WHERE n_dead_tup > 1000
ORDER BY dead_tuple_percent DESC;

-- البحث عن الفهارس غير المستخدمة
SELECT 
  schemaname,
  relname,
  indexrelname,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes 
WHERE idx_scan = 0 
  AND pg_relation_size(indexrelid) > 1024 * 1024  -- أكبر من 1MB
ORDER BY pg_relation_size(indexrelid) DESC;

-- البحث عن الاستعلامات التي تحتاج تحسين
SELECT 
  LEFT(query, 100) as query_start,
  calls,
  ROUND(mean_time, 2) as avg_time_ms,
  ROUND(total_time, 2) as total_time_ms
FROM pg_stat_statements 
WHERE calls > 100 AND mean_time > 50
ORDER BY mean_time DESC
LIMIT 10;

-- 10. نصائح التحسين
-- =====================================================

/*
نصائح لتحسين الأداء:

1. الفهارس:
   - أنشئ فهارس على الأعمدة المستخدمة في WHERE و JOIN
   - استخدم فهارس مركبة للاستعلامات المعقدة
   - احذف الفهارس غير المستخدمة

2. الاستعلامات:
   - استخدم LIMIT في الاستعلامات الكبيرة
   - تجنب SELECT * واختر الأعمدة المطلوبة فقط
   - استخدم EXISTS بدلاً من IN للاستعلامات الفرعية

3. الصيانة:
   - شغل VACUUM ANALYZE بانتظام
   - راقب نمو قاعدة البيانات
   - احذف البيانات القديمة غير المطلوبة

4. المراقبة:
   - راقب الاستعلامات البطيئة
   - تحقق من استخدام الذاكرة المؤقتة
   - راقب الاتصالات النشطة

5. النسخ الاحتياطي:
   - أنشئ نسخ احتياطية منتظمة
   - اختبر استعادة البيانات
   - احفظ النسخ في مواقع متعددة
*/

-- =====================================================
-- انتهاء ملف تحسين الأداء
-- =====================================================