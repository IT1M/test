-- Performance optimization SQL for Saudi Mais Inventory System
-- This file contains additional indexes and optimizations for better database performance

-- Enable pg_stat_statements extension for query performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Enable auto_explain for automatic query plan logging
LOAD 'auto_explain';
SET auto_explain.log_min_duration = 1000; -- Log queries taking more than 1 second
SET auto_explain.log_analyze = true;
SET auto_explain.log_buffers = true;

-- ============================================================================
-- ENHANCED INDEXES FOR BETTER QUERY PERFORMANCE
-- ============================================================================

-- Composite indexes for InventoryItem table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_item_search_optimized 
ON "InventoryItem" USING GIN (to_tsvector('english', item_name || ' ' || COALESCE(batch, '') || ' ' || COALESCE(notes, '')));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_item_analytics 
ON "InventoryItem" (destination, category, created_at DESC) 
INCLUDE (quantity, reject);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_item_batch_destination 
ON "InventoryItem" (batch, destination, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_item_category_date 
ON "InventoryItem" (category, created_at DESC) 
WHERE category IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_item_reject_analysis 
ON "InventoryItem" (destination, created_at DESC) 
WHERE reject > 0;

-- Partial index for active items (non-zero quantity)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_item_active 
ON "InventoryItem" (created_at DESC, destination) 
WHERE quantity > 0;

-- Enhanced indexes for AuditLog table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_timeline_optimized 
ON "AuditLog" (timestamp DESC, user_id, action) 
INCLUDE (entity_type, entity_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_entity_tracking 
ON "AuditLog" (entity_type, entity_id, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_user_activity 
ON "AuditLog" (user_id, action, timestamp DESC);

-- Partial index for recent audit logs (last 6 months)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_recent 
ON "AuditLog" (timestamp DESC, action) 
WHERE timestamp > NOW() - INTERVAL '6 months';

-- Enhanced indexes for UserActivity table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_session_timeline 
ON "UserActivity" (session_id, timestamp DESC) 
WHERE session_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_action_analysis 
ON "UserActivity" (action, timestamp DESC, user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_performance 
ON "UserActivity" (user_id, timestamp DESC) 
INCLUDE (action, duration);

-- Partial index for long-running activities
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_slow 
ON "UserActivity" (timestamp DESC, duration DESC) 
WHERE duration > 5000; -- Activities taking more than 5 seconds

-- Enhanced indexes for UserSession table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_session_active_monitoring 
ON "UserSession" (is_active, last_activity DESC, user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_session_cleanup 
ON "UserSession" (expires_at, is_active) 
WHERE is_active = true;

-- Enhanced indexes for Notification table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_user_priority 
ON "Notification" (user_id, is_read, created_at DESC) 
INCLUDE (type, title);

-- Partial index for unread notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_unread 
ON "Notification" (user_id, created_at DESC) 
WHERE is_read = false;

-- Enhanced indexes for Report table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_report_generation_tracking 
ON "Report" (status, created_at DESC, generated_by_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_report_period_analysis 
ON "Report" (type, period_start, period_end) 
INCLUDE (generated_by_id, status);

-- Enhanced indexes for SecurityAlert table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_alert_monitoring 
ON "SecurityAlert" (alert_type, severity, created_at DESC) 
WHERE is_resolved = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_alert_user_tracking 
ON "SecurityAlert" (user_id, created_at DESC, severity) 
WHERE user_id IS NOT NULL;

-- ============================================================================
-- MATERIALIZED VIEWS FOR ANALYTICS PERFORMANCE
-- ============================================================================

-- Daily inventory summary materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_inventory_summary AS
SELECT 
    DATE(created_at) as summary_date,
    destination,
    category,
    COUNT(*) as item_count,
    SUM(quantity) as total_quantity,
    SUM(reject) as total_rejects,
    CASE 
        WHEN SUM(quantity) > 0 THEN (SUM(reject)::float / SUM(quantity)) * 100 
        ELSE 0 
    END as reject_rate,
    COUNT(DISTINCT entered_by_id) as unique_users
FROM "InventoryItem"
WHERE created_at >= CURRENT_DATE - INTERVAL '1 year'
GROUP BY DATE(created_at), destination, category
ORDER BY summary_date DESC, destination, category;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_inventory_summary_pk 
ON daily_inventory_summary (summary_date, destination, COALESCE(category, ''));

CREATE INDEX IF NOT EXISTS idx_daily_inventory_summary_date 
ON daily_inventory_summary (summary_date DESC);

-- Weekly inventory trends materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS weekly_inventory_trends AS
SELECT 
    DATE_TRUNC('week', created_at) as week_start,
    destination,
    COUNT(*) as item_count,
    SUM(quantity) as total_quantity,
    SUM(reject) as total_rejects,
    AVG(quantity) as avg_quantity,
    CASE 
        WHEN SUM(quantity) > 0 THEN (SUM(reject)::float / SUM(quantity)) * 100 
        ELSE 0 
    END as reject_rate
FROM "InventoryItem"
WHERE created_at >= CURRENT_DATE - INTERVAL '2 years'
GROUP BY DATE_TRUNC('week', created_at), destination
ORDER BY week_start DESC, destination;

-- Create index on weekly trends
CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_inventory_trends_pk 
ON weekly_inventory_trends (week_start, destination);

-- User activity summary materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS user_activity_summary AS
SELECT 
    DATE(timestamp) as activity_date,
    user_id,
    action,
    COUNT(*) as action_count,
    AVG(duration) as avg_duration,
    MAX(duration) as max_duration,
    COUNT(DISTINCT session_id) as unique_sessions
FROM "UserActivity"
WHERE timestamp >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY DATE(timestamp), user_id, action
ORDER BY activity_date DESC, user_id, action;

-- Create index on user activity summary
CREATE INDEX IF NOT EXISTS idx_user_activity_summary_date_user 
ON user_activity_summary (activity_date DESC, user_id);

-- ============================================================================
-- FUNCTIONS FOR AUTOMATIC MAINTENANCE
-- ============================================================================

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_inventory_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY weekly_inventory_trends;
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_activity_summary;
    
    -- Update table statistics
    ANALYZE "InventoryItem";
    ANALYZE "AuditLog";
    ANALYZE "UserActivity";
    ANALYZE "UserSession";
    
    RAISE NOTICE 'Analytics views refreshed successfully at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS TABLE(table_name text, deleted_count bigint) AS $$
DECLARE
    audit_deleted bigint;
    activity_deleted bigint;
    session_deleted bigint;
BEGIN
    -- Cleanup old audit logs (keep 1 year)
    DELETE FROM "AuditLog" 
    WHERE timestamp < NOW() - INTERVAL '1 year';
    GET DIAGNOSTICS audit_deleted = ROW_COUNT;
    
    -- Cleanup old user activities (keep 6 months)
    DELETE FROM "UserActivity" 
    WHERE timestamp < NOW() - INTERVAL '6 months';
    GET DIAGNOSTICS activity_deleted = ROW_COUNT;
    
    -- Cleanup expired sessions
    DELETE FROM "UserSession" 
    WHERE expires_at < NOW() AND is_active = false;
    GET DIAGNOSTICS session_deleted = ROW_COUNT;
    
    -- Return results
    RETURN QUERY VALUES 
        ('AuditLog', audit_deleted),
        ('UserActivity', activity_deleted),
        ('UserSession', session_deleted);
END;
$$ LANGUAGE plpgsql;

-- Function to analyze query performance
CREATE OR REPLACE FUNCTION get_slow_queries(min_duration_ms integer DEFAULT 1000)
RETURNS TABLE(
    query text,
    calls bigint,
    total_time numeric,
    mean_time numeric,
    rows bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pss.query,
        pss.calls,
        pss.total_exec_time as total_time,
        pss.mean_exec_time as mean_time,
        pss.rows
    FROM pg_stat_statements pss
    WHERE pss.mean_exec_time > min_duration_ms
    ORDER BY pss.mean_exec_time DESC
    LIMIT 20;
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'pg_stat_statements extension not available';
        RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SCHEDULED MAINTENANCE JOBS (to be run via cron or application scheduler)
-- ============================================================================

-- Create a maintenance log table
CREATE TABLE IF NOT EXISTS maintenance_log (
    id SERIAL PRIMARY KEY,
    operation text NOT NULL,
    status text NOT NULL,
    details jsonb,
    duration_ms integer,
    executed_at timestamp DEFAULT NOW()
);

-- Function to log maintenance operations
CREATE OR REPLACE FUNCTION log_maintenance_operation(
    operation_name text,
    operation_status text,
    operation_details jsonb DEFAULT NULL,
    operation_duration integer DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO maintenance_log (operation, status, details, duration_ms)
    VALUES (operation_name, operation_status, operation_details, operation_duration);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PERFORMANCE MONITORING VIEWS
-- ============================================================================

-- View for monitoring table sizes and growth
CREATE OR REPLACE VIEW table_size_monitoring AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size,
    pg_stat_get_tuples_inserted(c.oid) as inserts,
    pg_stat_get_tuples_updated(c.oid) as updates,
    pg_stat_get_tuples_deleted(c.oid) as deletes,
    pg_stat_get_live_tuples(c.oid) as live_tuples,
    pg_stat_get_dead_tuples(c.oid) as dead_tuples
FROM pg_tables pt
JOIN pg_class c ON c.relname = pt.tablename
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- View for monitoring index usage
CREATE OR REPLACE VIEW index_usage_monitoring AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 100 THEN 'LOW_USAGE'
        ELSE 'ACTIVE'
    END as usage_status
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- View for monitoring connection and activity
CREATE OR REPLACE VIEW connection_monitoring AS
SELECT 
    state,
    count(*) as connection_count,
    max(now() - state_change) as max_duration,
    avg(now() - state_change) as avg_duration
FROM pg_stat_activity 
WHERE datname = current_database()
GROUP BY state
ORDER BY connection_count DESC;

-- ============================================================================
-- CONFIGURATION RECOMMENDATIONS
-- ============================================================================

-- Display current PostgreSQL configuration relevant to performance
CREATE OR REPLACE VIEW performance_config AS
SELECT 
    name,
    setting,
    unit,
    short_desc
FROM pg_settings 
WHERE name IN (
    'shared_buffers',
    'effective_cache_size',
    'maintenance_work_mem',
    'checkpoint_completion_target',
    'wal_buffers',
    'default_statistics_target',
    'random_page_cost',
    'effective_io_concurrency',
    'work_mem',
    'max_connections',
    'max_worker_processes',
    'max_parallel_workers_per_gather'
)
ORDER BY name;

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON MATERIALIZED VIEW daily_inventory_summary IS 'Daily aggregated inventory statistics for fast analytics queries';
COMMENT ON MATERIALIZED VIEW weekly_inventory_trends IS 'Weekly inventory trends for performance dashboards';
COMMENT ON MATERIALIZED VIEW user_activity_summary IS 'Daily user activity summary for monitoring and analytics';

COMMENT ON FUNCTION refresh_analytics_views() IS 'Refreshes all materialized views and updates table statistics';
COMMENT ON FUNCTION cleanup_old_data() IS 'Removes old audit logs, activities, and expired sessions';
COMMENT ON FUNCTION get_slow_queries(integer) IS 'Returns slow queries from pg_stat_statements';

-- ============================================================================
-- FINAL MAINTENANCE
-- ============================================================================

-- Update all table statistics
ANALYZE;

-- Log the completion of optimization setup
SELECT log_maintenance_operation(
    'performance_optimization_setup',
    'completed',
    '{"indexes_created": true, "materialized_views_created": true, "functions_created": true}'::jsonb,
    NULL
);

RAISE NOTICE 'Database performance optimization completed successfully at %', NOW();