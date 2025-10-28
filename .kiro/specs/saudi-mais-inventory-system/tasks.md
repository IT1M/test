# Implementation Plan

- [x] 1. Initialize Next.js project and configure core dependencies
  - Create Next.js 15 project with App Router and TypeScript
  - Install and configure TailwindCSS with dark mode support
  - Set up custom color palette for Saudi Mais branding
  - Configure path aliases (@/ pointing to src/)
  - Create folder structure for components, services, utils, and types
  - Set up .env.local with required environment variables
  - _Requirements: 1.1, 13.1_

- [x] 2. Set up database schema and Prisma ORM
- [x] 2.1 Create Prisma schema with all models
  - Define User model with role enum and preferences
  - Define InventoryItem model with destination enum
  - Define AuditLog model with action enum
  - Define Report model with type and status enums
  - Define Backup model with type and status enums
  - Define SystemSettings model
  - Add all indexes for performance optimization
  - _Requirements: 8.1, 8.2, 6.1_

- [x] 2.2 Initialize database and run migrations
  - Initialize Prisma with PostgreSQL
  - Create initial migration
  - Generate Prisma Client
  - Create Prisma client singleton service
  - _Requirements: 13.4_

- [x] 2.3 Create database seed file
  - Create default admin user with hashed password
  - Create sample inventory items (5-10 records)
  - Create default system settings
  - Run seed script
  - _Requirements: 8.3_

- [x] 3. Implement authentication system with NextAuth
- [x] 3.1 Configure NextAuth v5
  - Set up NextAuth configuration in /src/services/auth.ts
  - Implement Credentials provider with email/password
  - Create session callbacks to include user role and preferences
  - Configure authentication pages paths
  - _Requirements: 1.1, 1.5_

- [x] 3.2 Create authentication API routes
  - Implement login endpoint with credential validation
  - Implement registration endpoint with password hashing
  - Implement password change endpoint
  - Create audit log entries for auth events
  - _Requirements: 1.2, 6.1_

- [x] 3.3 Implement middleware for route protection
  - Create middleware.ts for authentication checks
  - Implement role-based access control
  - Add locale routing support
  - Redirect unauthorized users appropriately
  - _Requirements: 1.3, 1.4, 8.2, 8.3_


- [x] 4. Build authentication UI pages
- [x] 4.1 Create login page
  - Build login form with email and password fields
  - Implement form validation with Zod
  - Add loading states and error handling
  - Implement "Remember me" functionality
  - Add language toggle for EN/AR
  - _Requirements: 1.1, 1.2, 9.2_

- [x] 4.2 Create registration page
  - Build registration form with name, email, and password
  - Implement password strength indicator
  - Add form validation and error messages
  - Create success state with redirect
  - _Requirements: 1.1, 12.1_

- [x] 4.3 Implement role-based dashboard redirects
  - Create redirect logic based on user role
  - ADMIN → /dashboard
  - MANAGER → /analytics
  - SUPERVISOR → /data-log
  - DATA_ENTRY → /data-entry
  - AUDITOR → /audit
  - _Requirements: 1.3, 8.2_

- [x] 5. Create shared UI components and layout
- [x] 5.1 Build layout components
  - Create root layout with theme provider
  - Build navigation header with user menu
  - Create sidebar navigation with role-based menu items
  - Implement breadcrumb navigation
  - Add footer component
  - _Requirements: 9.1, 9.2_

- [x] 5.2 Create reusable UI components
  - Build Button component with variants
  - Create Input, Select, and Textarea components
  - Build Modal/Dialog component
  - Create Toast notification system with react-hot-toast
  - Build Loading spinner and skeleton components
  - Create Badge and Tag components
  - _Requirements: 12.1, 12.3_

- [x] 5.3 Implement theme system
  - Set up next-themes for dark/light mode
  - Create theme toggle component
  - Configure TailwindCSS for theme variables
  - Persist theme preference in localStorage
  - _Requirements: 9.1_

- [x] 6. Implement Gemini AI service integration
- [x] 6.1 Create Gemini AI client service
  - Initialize Gemini AI client with API key
  - Implement rate limiting (60 requests per minute)
  - Add error handling and retry logic
  - Create caching mechanism for responses (30 minutes)
  - _Requirements: 5.4, 5.5_

- [x] 6.2 Build AI analysis functions
  - Create analyzeInventory function for trend analysis
  - Implement generateInsights function for actionable recommendations
  - Build predictive analytics function for stock forecasting
  - Add natural language query handler
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 7. Build inventory data entry page and API
- [x] 7.1 Create inventory API routes
  - Implement POST /api/inventory for creating items
  - Add validation with Zod schema
  - Create audit log entries for all operations
  - Return appropriate success/error responses
  - _Requirements: 2.1, 6.1, 12.2_

- [x] 7.2 Build data entry form component
  - Create form with all inventory fields
  - Implement real-time validation
  - Add character counters for text fields
  - Build reject percentage calculator with color coding
  - Add autocomplete for item names and categories
  - _Requirements: 2.2, 2.3, 2.4, 2.5, 12.1_

- [x] 7.3 Implement autosave functionality
  - Auto-save form data to localStorage every 2 seconds
  - Show "Draft saved" indicator
  - Restore draft on page reload
  - Clear draft after successful submission
  - Add confirmation dialog for unsaved changes
  - _Requirements: 2.6_

- [x] 7.4 Add keyboard shortcuts and accessibility
  - Implement Ctrl+S to save, Ctrl+Enter to submit
  - Add proper ARIA labels and roles
  - Ensure keyboard navigation works
  - Add focus management
  - _Requirements: 15.1, 15.2_

- [x] 8. Build data log page with filtering and search
- [x] 8.1 Create inventory list API routes
  - Implement GET /api/inventory with pagination
  - Add search functionality across item name and batch
  - Implement date range filtering
  - Add destination and category filters
  - Support sorting by multiple fields
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 8.2 Build inventory table component
  - Create responsive table with all columns
  - Implement column sorting
  - Add row selection with checkboxes
  - Build action dropdown menu for each row
  - Show reject percentage with color-coded badges
  - _Requirements: 3.1, 3.5, 15.3_

- [x] 8.3 Implement filter panel
  - Create search input with debouncing (300ms)
  - Build date range picker with presets
  - Add destination filter checkboxes
  - Create category multi-select dropdown
  - Implement reject filter options
  - Add "Apply" and "Reset" buttons
  - _Requirements: 3.2, 3.3, 3.4_

- [x] 8.4 Add pagination controls
  - Build pagination component with page numbers
  - Add items per page selector (10, 25, 50, 100, 200)
  - Show total count and current range
  - Preserve filters when changing pages
  - _Requirements: 3.1, 13.3_

- [x] 8.5 Implement edit and delete functionality
  - Create PATCH /api/inventory/[id] endpoint
  - Create DELETE /api/inventory/[id] endpoint
  - Build edit modal with pre-populated form
  - Add delete confirmation dialog
  - Create audit log entries for changes
  - Restrict delete to SUPERVISOR role or higher
  - _Requirements: 6.1, 8.2_

- [x] 9. Implement data export functionality
- [x] 9.1 Create export API routes
  - Implement GET /api/inventory/export endpoint
  - Support CSV format with UTF-8 BOM
  - Support Excel format with formatting
  - Support PDF format with company branding
  - Support JSON format with metadata
  - Apply current filters to export
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 9.2 Build export UI component
  - Create export dropdown button
  - Add format selection options
  - Show progress indicator during generation
  - Trigger file download
  - Display success toast with file size
  - Create audit log entry for exports
  - _Requirements: 4.1, 4.5_

- [x] 10. Build analytics dashboard with charts
- [x] 10.1 Create analytics API routes
  - Implement GET /api/analytics/summary endpoint
  - Create GET /api/analytics/trends endpoint
  - Build POST /api/analytics/ai-insights endpoint
  - Calculate KPIs (total items, quantity, reject rate)
  - Generate time-series data for charts
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 10.2 Build KPI cards component
  - Create card layout with icon, value, and trend
  - Calculate percentage changes from previous period
  - Add mini sparkline charts
  - Implement color coding (green/red for trends)
  - Make cards clickable to filter dashboard
  - _Requirements: 5.1_

- [x] 10.3 Implement chart components
  - Build inventory trend line chart with Recharts
  - Create destination distribution pie chart
  - Build category bar chart
  - Implement reject analysis chart
  - Add chart export functionality (PNG)
  - _Requirements: 5.2_

- [x] 10.4 Create AI insights panel
  - Build insights display component
  - Integrate with Gemini AI service
  - Show loading state with animation
  - Display insights in structured format (findings, alerts, recommendations)
  - Add refresh button to regenerate insights
  - Implement follow-up question input
  - _Requirements: 5.3, 5.4, 5.5_

- [x] 10.5 Add dashboard filters and controls
  - Create date range picker for dashboard
  - Add destination and category filters
  - Implement "Reset filters" button
  - Persist filter state to URL query params
  - _Requirements: 5.1, 5.2_

- [x] 11. Implement audit log system
- [x] 11.1 Create audit logging utility
  - Build createAuditLog helper function
  - Capture user ID, action, entity type, and entity ID
  - Store old and new values for UPDATE actions
  - Capture IP address and user agent
  - _Requirements: 6.1, 6.2, 6.6_

- [x] 11.2 Create audit log API routes
  - Implement GET /api/audit/logs with filtering
  - Add pagination support
  - Support filtering by user, action, entity type, and date range
  - Include user details in response
  - _Requirements: 6.2, 6.4_

- [x] 11.3 Build audit log table component
  - Create table with all audit columns
  - Implement expandable rows for change details
  - Add JSON diff viewer for old/new values
  - Build filter panel for audit logs
  - Show user avatar and role badge
  - _Requirements: 6.2, 6.3_

- [x] 11.4 Add audit log export
  - Create export functionality for audit logs
  - Support CSV and PDF formats
  - Include all filter criteria in export
  - _Requirements: 6.4_

- [x] 12. Build backup and restore system
- [x] 12.1 Create backup API routes
  - Implement POST /api/backup/create endpoint
  - Support CSV, JSON, and SQL formats
  - Generate timestamped backup files
  - Store backup metadata in database
  - _Requirements: 7.1, 7.2_

- [x] 12.2 Implement automated backup scheduling
  - Create scheduled job for daily backups
  - Configure backup time and retention policy
  - Send notification on backup completion/failure
  - _Requirements: 7.1, 7.3_

- [x] 12.3 Build backup management UI
  - Create backup history table
  - Add manual backup trigger button
  - Implement backup download functionality
  - Show backup status and file size
  - _Requirements: 7.1, 7.4_

- [x] 12.4 Implement restore functionality
  - Create POST /api/backup/restore endpoint
  - Validate backup file format
  - Show preview of changes before restore
  - Execute restore in database transaction
  - Create audit log entry for restore
  - _Requirements: 7.4, 7.5_

- [x] 13. Build report generation system
- [x] 13.1 Create report API routes
  - Implement POST /api/reports/generate endpoint
  - Support MONTHLY, YEARLY, and CUSTOM report types
  - Fetch and aggregate inventory data for period
  - Generate analytics and charts
  - Optionally include AI insights from Gemini
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 13.2 Build PDF report generator
  - Create PDF template with company branding
  - Include summary statistics and KPIs
  - Embed charts as images
  - Add AI insights section if requested
  - Generate table of inventory items
  - _Requirements: 10.2, 10.3_

- [x] 13.3 Create report management UI
  - Build report generation form
  - Create reports list table
  - Add download functionality for generated reports
  - Show report status (generating, completed, failed)
  - _Requirements: 10.1, 10.4, 10.5_

- [x] 14. Implement settings and user management
- [x] 14.1 Create user management API routes
  - Implement GET /api/users for listing users
  - Create POST /api/users for adding users
  - Build PATCH /api/users/[id] for updating users
  - Add user activation/deactivation endpoint
  - Restrict to ADMIN role only
  - _Requirements: 8.3, 8.4_

- [x] 14.2 Build user management UI
  - Create user list table with search and filters
  - Build add/edit user modal
  - Implement role selection dropdown
  - Add user activation toggle
  - Show role permissions matrix
  - _Requirements: 8.3, 8.4, 8.5_

- [x] 14.3 Create system settings API routes
  - Implement GET /api/settings endpoint
  - Create PATCH /api/settings endpoint
  - Support settings categories (theme, api, notifications)
  - Validate setting keys and values
  - Create audit log for setting changes
  - _Requirements: 8.4_

- [x] 14.4 Build settings UI pages
  - Create profile settings section
  - Build security settings (password change)
  - Implement appearance settings (theme, font size)
  - Add notification preferences
  - Create API configuration section (ADMIN only)
  - _Requirements: 8.4_

- [x] 15. Implement internationalization (i18n)
- [x] 15.1 Set up next-intl
  - Install and configure next-intl
  - Create message files for English and Arabic
  - Set up locale routing with [locale] parameter
  - Configure locale detection and persistence
  - _Requirements: 9.1, 9.2_

- [x] 15.2 Create translation files
  - Translate all UI text to English
  - Translate all UI text to Arabic
  - Add translations for error messages
  - Include translations for email templates
  - _Requirements: 9.1, 9.2_

- [x] 15.3 Implement RTL support for Arabic
  - Configure TailwindCSS for RTL
  - Test all components in RTL mode
  - Mirror directional icons and elements
  - Ensure proper text alignment
  - _Requirements: 9.2, 9.4_

- [x] 15.4 Add locale-aware formatting
  - Implement date formatting based on locale
  - Add number formatting for different locales
  - Format currency if applicable
  - _Requirements: 9.4_

- [x] 16. Implement notifications system
- [x] 16.1 Create notifications API routes
  - Implement POST /api/notifications endpoint
  - Create GET /api/notifications for user's notifications
  - Add PATCH /api/notifications/[id]/read endpoint
  - Support notification types (info, success, warning, error)
  - _Requirements: 11.1, 11.2_

- [x] 16.2 Build notification UI components
  - Create notification bell icon with unread count
  - Build notification dropdown panel
  - Implement "Mark as read" functionality
  - Add "Mark all as read" button
  - Show notification timestamp
  - _Requirements: 11.3, 11.4_

- [x] 16.3 Implement notification triggers
  - Create notification for high reject rate (>15%)
  - Add notification for backup completion/failure
  - Send notification for new user registration (ADMIN)
  - Trigger notification for system updates
  - _Requirements: 11.1, 11.2_

- [x] 16.4 Add email notification system
  - Configure email service (SMTP or service like SendGrid)
  - Create email templates for different notification types
  - Implement email sending utility
  - Add user preference for email notifications
  - _Requirements: 11.1_

- [x] 17. Implement security features
- [x] 17.1 Add rate limiting
  - Implement rate limiting middleware (100 req/min per user)
  - Add rate limit headers to responses
  - Return 429 status when limit exceeded
  - _Requirements: 14.1_

- [x] 17.2 Implement input sanitization
  - Add XSS prevention for all user inputs
  - Validate and sanitize file uploads
  - Implement CSRF protection
  - _Requirements: 14.2, 14.3_

- [x] 17.3 Configure security headers
  - Set up Content Security Policy
  - Add X-Frame-Options header
  - Configure CORS properly
  - Enable HTTPS only
  - _Requirements: 14.4_

- [x] 17.4 Implement session security
  - Configure secure session cookies (HTTP-only)
  - Add session timeout (30 minutes)
  - Implement logout functionality
  - Clear session on password change
  - _Requirements: 14.1, 14.5_

- [x] 18. Optimize performance
- [x] 18.1 Implement database optimizations
  - Add all necessary indexes
  - Configure connection pooling
  - Optimize slow queries
  - Use select to fetch only needed fields
  - _Requirements: 13.2, 13.4_

- [x] 18.2 Add caching strategies
  - Implement API response caching
  - Cache Gemini AI responses (30 minutes)
  - Cache analytics calculations (5 minutes)
  - Use React Query for client-side caching
  - _Requirements: 5.5, 13.2_

- [x] 18.3 Optimize bundle size
  - Implement code splitting by route
  - Use dynamic imports for heavy components
  - Optimize images with Next.js Image component
  - Analyze and reduce bundle size
  - _Requirements: 13.1, 13.5_

- [-] 19. Implement mobile responsiveness
- [x] 19.1 Make all pages mobile-responsive
  - Test all pages on mobile breakpoints (320px-768px)
  - Transform tables to card layouts on mobile
  - Ensure touch-friendly controls (44x44px minimum)
  - Prevent zoom on input focus
  - _Requirements: 15.1, 15.2, 15.3_

- [x] 19.2 Optimize mobile interactions
  - Add swipe gestures where appropriate
  - Create bottom sheets for mobile filters
  - Implement sticky action buttons
  - Optimize form layouts for mobile keyboards
  - _Requirements: 15.2, 15.4, 15.5_

- [ ] 20. Implement accessibility features
- [ ] 20.1 Add keyboard navigation
  - Ensure all interactive elements are keyboard accessible
  - Implement logical tab order
  - Add skip to content links
  - Document keyboard shortcuts
  - _Requirements: 15.1_

- [ ] 20.2 Add screen reader support
  - Use semantic HTML elements
  - Add ARIA labels and descriptions
  - Implement live regions for dynamic content
  - Associate form labels properly
  - _Requirements: 15.2_

- [ ] 20.3 Ensure visual accessibility
  - Verify color contrast ratios (>4.5:1)
  - Add visible focus indicators
  - Ensure text is resizable
  - Don't convey information by color alone
  - _Requirements: 15.3_

- [ ]* 21. Testing and quality assurance
- [ ]* 21.1 Write unit tests
  - Test utility functions (validators, formatters)
  - Test custom hooks
  - Test service layer functions
  - Achieve >80% code coverage
  - _Requirements: 12.2_

- [ ]* 21.2 Write integration tests
  - Test authentication flows
  - Test CRUD operations
  - Test filter and search functionality
  - Test export operations
  - Test role-based access control
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 8.2_

- [ ]* 21.3 Perform security testing
  - Test for SQL injection vulnerabilities
  - Test for XSS vulnerabilities
  - Verify CSRF protection
  - Test authentication bypass attempts
  - Test authorization escalation
  - _Requirements: 14.2, 14.3_

- [ ]* 21.4 Conduct performance testing
  - Run Lighthouse audits (target >90 score)
  - Test with large datasets (10,000+ items)
  - Measure API response times
  - Test under load (100+ concurrent users)
  - _Requirements: 13.1, 13.2, 13.5_

- [ ]* 21.5 Perform accessibility testing
  - Run automated tests with axe-core
  - Manual testing with screen readers (NVDA/JAWS)
  - Keyboard-only navigation testing
  - Test on mobile screen readers
  - _Requirements: 15.1, 15.2, 15.3_

- [ ] 22. Deployment and production setup
- [ ] 22.1 Configure production environment
  - Set up production database with backups
  - Configure environment variables in Vercel
  - Set up custom domain and SSL
  - Configure email service for production
  - _Requirements: 14.4_

- [ ] 22.2 Set up monitoring and logging
  - Configure error tracking (Sentry or similar)
  - Set up uptime monitoring
  - Configure performance monitoring
  - Set up alert rules for critical issues
  - _Requirements: 13.2_

- [ ] 22.3 Create deployment pipeline
  - Set up GitHub repository
  - Configure Vercel deployment
  - Set up preview deployments for PRs
  - Configure production deployment from main branch
  - _Requirements: 13.1_

- [ ] 22.4 Prepare launch materials
  - Create user documentation
  - Write admin guide
  - Prepare training materials
  - Set up support email
  - _Requirements: 8.3_

- [ ] 23. Post-launch tasks
- [ ] 23.1 Monitor initial usage
  - Track error rates and performance
  - Collect user feedback
  - Monitor database performance
  - Review audit logs for issues
  - _Requirements: 6.2, 13.2_

- [ ] 23.2 Address immediate issues
  - Fix critical bugs reported by users
  - Optimize slow queries identified in production
  - Adjust rate limits if needed
  - Update documentation based on feedback
  - _Requirements: 12.3, 14.1_
