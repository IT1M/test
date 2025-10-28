# Design Document

## Overview

The Saudi Mais Medical Inventory System is a full-stack web application built with Next.js 15, leveraging modern React patterns, server-side rendering, and API routes. The system uses PostgreSQL with Prisma ORM for data persistence, NextAuth v5 for authentication, Gemini AI for intelligent insights, and supports bilingual interfaces with next-intl. The architecture follows a clean separation of concerns with distinct layers for presentation, business logic, and data access.

## Architecture

### Technology Stack

**Frontend:**
- Next.js 15 (App Router)
- React 18+
- TypeScript (strict mode)
- TailwindCSS for styling
- Recharts for data visualization
- React Hook Form + Zod for form validation
- next-themes for theme management
- next-intl for internationalization

**Backend:**
- Next.js API Routes
- Prisma ORM
- PostgreSQL database
- NextAuth v5 for authentication
- @google/generative-ai (Gemini SDK)

**Infrastructure:**
- Vercel for hosting and deployment
- PostgreSQL database (managed service)
- Environment-based configuration

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages      │  │  Components  │  │    Hooks     │      │
│  │ (App Router) │  │   (UI/Forms) │  │   (State)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTP/HTTPS
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │     Auth     │  │  Inventory   │  │  Analytics   │      │
│  │   Routes     │  │    Routes    │  │    Routes    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Audit     │  │   Reports    │  │    Backup    │      │
│  │   Routes     │  │    Routes    │  │    Routes    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Prisma     │  │   Gemini AI  │  │   NextAuth   │      │
│  │   Client     │  │   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│                   PostgreSQL Database                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Users     │  │  Inventory   │  │  AuditLog    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Reports    │  │   Backups    │  │   Settings   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Folder Structure

```
/
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── dashboard/
│   │   │   ├── data-entry/
│   │   │   ├── data-log/
│   │   │   ├── analytics/
│   │   │   ├── audit/
│   │   │   ├── backup/
│   │   │   ├── settings/
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── inventory/
│   │   │   ├── analytics/
│   │   │   ├── audit/
│   │   │   ├── reports/
│   │   │   ├── backup/
│   │   │   └── settings/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── forms/
│   │   ├── tables/
│   │   ├── charts/
│   │   ├── filters/
│   │   ├── modals/
│   │   └── layout/
│   ├── services/
│   │   ├── prisma.ts
│   │   ├── gemini.ts
│   │   └── auth.ts
│   ├── db/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── utils/
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   └── constants.ts
│   ├── types/
│   │   └── index.ts
│   ├── styles/
│   │   └── globals.css
│   └── middleware.ts
├── public/
│   ├── reports/
│   └── backups/
├── messages/
│   ├── en.json
│   └── ar.json
├── .env.local
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

## Components and Interfaces

### Authentication System

**NextAuth Configuration (`/src/services/auth.ts`):**

```typescript
interface AuthConfig {
  providers: CredentialsProvider[];
  callbacks: {
    jwt: (token, user) => Promise<JWT>;
    session: (session, token) => Promise<Session>;
  };
  pages: {
    signIn: string;
    error: string;
  };
}

interface ExtendedSession extends Session {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    preferences: UserPreferences;
  };
}
```

**Middleware Protection (`/src/middleware.ts`):**
- Intercept all requests
- Check authentication status
- Validate role-based permissions
- Redirect unauthorized users
- Handle locale routing

### Data Entry System

**Form Component (`/src/components/forms/DataEntryForm.tsx`):**

```typescript
interface InventoryFormData {
  itemName: string;
  batch: string;
  quantity: number;
  reject: number;
  destination: 'MAIS' | 'FOZAN';
  category?: string;
  notes?: string;
}

interface FormState {
  data: InventoryFormData;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isDirty: boolean;
  lastSaved: Date | null;
}
```

**Features:**
- Real-time validation with Zod schema
- Auto-save to localStorage every 2 seconds
- Debounced duplicate batch detection
- Keyboard shortcuts (Ctrl+S, Ctrl+Enter)
- Optimistic UI updates

### Data Viewing System

**Table Component (`/src/components/tables/InventoryTable.tsx`):**

```typescript
interface TableProps {
  data: InventoryItem[];
  pagination: PaginationState;
  filters: FilterState;
  sorting: SortingState;
  onFilterChange: (filters: FilterState) => void;
  onSortChange: (sorting: SortingState) => void;
  onPageChange: (page: number) => void;
}

interface FilterState {
  search: string;
  dateRange: { start: Date; end: Date } | null;
  destination: ('MAIS' | 'FOZAN')[];
  categories: string[];
  hasRejects: boolean | null;
  enteredBy: string[];
}
```

**Features:**
- Virtual scrolling for large datasets
- Column resizing and reordering
- Bulk selection and actions
- Export filtered data
- Responsive card view on mobile

### Analytics Dashboard

**Chart Components:**

```typescript
interface ChartProps {
  data: ChartData[];
  config: ChartConfig;
  loading: boolean;
  error: Error | null;
}

interface KPICardProps {
  title: string;
  value: number | string;
  trend: {
    direction: 'up' | 'down' | 'neutral';
    percentage: number;
  };
  icon: ReactNode;
  onClick?: () => void;
}
```

**AI Insights Panel (`/src/components/analytics/AIInsightsPanel.tsx`):**

```typescript
interface AIInsight {
  id: string;
  type: 'finding' | 'alert' | 'recommendation' | 'prediction';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  generatedAt: Date;
}

interface InsightsState {
  insights: AIInsight[];
  loading: boolean;
  error: Error | null;
  lastRefresh: Date | null;
}
```

### Audit System

**Audit Log Component (`/src/components/audit/AuditLogTable.tsx`):**

```typescript
interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  user: {
    name: string;
    email: string;
    role: UserRole;
  };
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  oldValue: Record<string, any> | null;
  newValue: Record<string, any> | null;
  ipAddress: string;
  userAgent: string;
}

type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'VIEW';
```

## Data Models

### Database Schema (Prisma)

```prisma
model User {
  id            String         @id @default(uuid())
  email         String         @unique
  name          String
  password      String
  role          UserRole       @default(DATA_ENTRY)
  isActive      Boolean        @default(true)
  preferences   Json?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  
  inventoryItems InventoryItem[]
  auditLogs      AuditLog[]
  reports        Report[]
  backups        Backup[]
  settingsUpdates SystemSettings[]
  
  @@index([email])
  @@index([role])
}

enum UserRole {
  ADMIN
  DATA_ENTRY
  SUPERVISOR
  MANAGER
  AUDITOR
}

model InventoryItem {
  id          String      @id @default(uuid())
  itemName    String
  batch       String
  quantity    Int
  reject      Int         @default(0)
  destination Destination
  category    String?
  notes       String?
  enteredById String
  enteredBy   User        @relation(fields: [enteredById], references: [id])
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  auditLogs   AuditLog[]
  
  @@index([itemName])
  @@index([batch])
  @@index([createdAt, destination])
  @@index([enteredById])
}

enum Destination {
  MAIS
  FOZAN
}

model AuditLog {
  id          String    @id @default(uuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  action      AuditAction
  entityType  String
  entityId    String?
  oldValue    Json?
  newValue    Json?
  ipAddress   String?
  userAgent   String?
  timestamp   DateTime  @default(now())
  
  inventoryItem InventoryItem? @relation(fields: [entityId], references: [id])
  
  @@index([userId, timestamp])
  @@index([entityType, entityId])
  @@index([timestamp])
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  LOGIN
  LOGOUT
  EXPORT
  VIEW
}

model Report {
  id           String       @id @default(uuid())
  title        String
  type         ReportType
  periodStart  DateTime
  periodEnd    DateTime
  generatedById String
  generatedBy  User         @relation(fields: [generatedById], references: [id])
  fileUrl      String?
  dataSnapshot Json
  aiInsights   String?
  status       ReportStatus @default(GENERATING)
  createdAt    DateTime     @default(now())
  
  @@index([type, periodStart])
  @@index([generatedById])
}

enum ReportType {
  MONTHLY
  YEARLY
  CUSTOM
  AUDIT
}

enum ReportStatus {
  GENERATING
  COMPLETED
  FAILED
}

model Backup {
  id          String       @id @default(uuid())
  fileName    String
  fileSize    Int
  fileType    BackupType
  recordCount Int
  storagePath String
  status      BackupStatus @default(IN_PROGRESS)
  createdAt   DateTime     @default(now())
  createdById String
  createdBy   User         @relation(fields: [createdById], references: [id])
  
  @@index([createdAt])
}

enum BackupType {
  CSV
  JSON
  SQL
}

enum BackupStatus {
  IN_PROGRESS
  COMPLETED
  FAILED
}

model SystemSettings {
  id        String   @id @default(uuid())
  key       String   @unique
  value     Json
  category  String
  updatedById String
  updatedBy User     @relation(fields: [updatedById], references: [id])
  updatedAt DateTime @updatedAt
  
  @@index([category])
}
```

### API Response Types

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    pages?: number;
  };
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
```

## Error Handling

### Error Types

```typescript
class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
  }
}

class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super('AUTH_ERROR', message, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super('AUTHORIZATION_ERROR', message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
  }
}
```

### Error Handling Strategy

**API Routes:**
- Wrap all route handlers in try-catch blocks
- Use centralized error handler middleware
- Return consistent error response format
- Log errors with context (user, request, timestamp)
- Never expose sensitive information in production

**Client-Side:**
- Display user-friendly error messages
- Provide retry mechanisms for transient failures
- Show loading states during operations
- Implement error boundaries for component failures
- Toast notifications for user feedback

### Validation Strategy

**Zod Schemas:**

```typescript
const InventoryItemSchema = z.object({
  itemName: z.string().min(2).max(100).trim(),
  batch: z.string().min(3).max(50).regex(/^[A-Z0-9]+$/),
  quantity: z.number().int().positive().max(1000000),
  reject: z.number().int().min(0),
  destination: z.enum(['MAIS', 'FOZAN']),
  category: z.string().min(2).max(50).optional(),
  notes: z.string().max(500).optional(),
}).refine(data => data.reject <= data.quantity, {
  message: 'Reject quantity cannot exceed total quantity',
  path: ['reject'],
});
```

## Testing Strategy

### Unit Testing

**Tools:** Jest, React Testing Library

**Coverage:**
- Utility functions (validators, formatters)
- Custom hooks
- Service layer functions
- Component logic

**Example:**
```typescript
describe('InventoryItemSchema', () => {
  it('should validate correct inventory data', () => {
    const validData = {
      itemName: 'Surgical Mask',
      batch: 'BATCH123',
      quantity: 1000,
      reject: 10,
      destination: 'MAIS',
    };
    expect(() => InventoryItemSchema.parse(validData)).not.toThrow();
  });
  
  it('should reject when reject > quantity', () => {
    const invalidData = {
      itemName: 'Surgical Mask',
      batch: 'BATCH123',
      quantity: 100,
      reject: 150,
      destination: 'MAIS',
    };
    expect(() => InventoryItemSchema.parse(invalidData)).toThrow();
  });
});
```

### Integration Testing

**Tools:** Playwright or Cypress

**Coverage:**
- Authentication flows
- CRUD operations
- Filter and search functionality
- Export operations
- Role-based access control

**Example:**
```typescript
test('data entry flow', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'clerk@mais.sa');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/data-entry');
  
  await page.fill('[name="itemName"]', 'Surgical Gloves');
  await page.fill('[name="batch"]', 'BATCH456');
  await page.fill('[name="quantity"]', '500');
  await page.selectOption('[name="destination"]', 'MAIS');
  await page.click('button:has-text("Save Entry")');
  
  await expect(page.locator('.toast-success')).toBeVisible();
});
```

### API Testing

**Tools:** Jest + Supertest

**Coverage:**
- All API endpoints
- Authentication and authorization
- Input validation
- Error responses
- Rate limiting

### Performance Testing

**Tools:** Lighthouse, WebPageTest

**Metrics:**
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Lighthouse Performance Score > 90
- API response times < 500ms (p95)

### Security Testing

**Checklist:**
- SQL injection prevention (Prisma)
- XSS prevention (React escaping)
- CSRF protection (NextAuth)
- Rate limiting verification
- Authentication bypass attempts
- Authorization escalation attempts
- Sensitive data exposure checks

## Performance Optimization

### Database Optimization

**Indexes:**
- Composite indexes on frequently queried columns
- Index on foreign keys
- Index on timestamp fields for audit logs

**Query Optimization:**
- Use `select` to fetch only needed fields
- Implement cursor-based pagination for large datasets
- Use database-level aggregations
- Connection pooling (max 10 connections)

### Caching Strategy

**Client-Side:**
- React Query for API response caching
- LocalStorage for user preferences
- SessionStorage for temporary form data

**Server-Side:**
- Cache Gemini AI responses (30 minutes)
- Cache analytics calculations (5 minutes)
- Cache user permissions in session

### Code Splitting

- Route-based code splitting (automatic with Next.js)
- Dynamic imports for heavy components (charts, modals)
- Lazy load images and non-critical assets

### Asset Optimization

- Image optimization with Next.js Image component
- WebP format for images
- SVG for icons
- Minification and compression (automatic with Vercel)

## Security Considerations

### Authentication Security

- Bcrypt password hashing (12 rounds)
- Secure session management with NextAuth
- HTTP-only cookies for session tokens
- CSRF token validation
- Session timeout after 30 minutes of inactivity

### Authorization Security

- Role-based access control on all routes
- Permission validation on every API request
- Principle of least privilege
- Audit logging for all sensitive operations

### Data Security

- HTTPS only (enforced)
- Input sanitization and validation
- Parameterized queries (Prisma)
- No sensitive data in client-side code
- Environment variables for secrets

### API Security

- Rate limiting (100 req/min per user)
- Request size limits
- CORS configuration
- API key rotation strategy
- Audit logging for all API calls

## Deployment Strategy

### Environment Configuration

**Development:**
- Local PostgreSQL database
- Hot reload enabled
- Debug logging
- Mock email service

**Staging:**
- Managed PostgreSQL (Vercel Postgres)
- Production-like configuration
- Real email service (test mode)
- Performance monitoring

**Production:**
- Managed PostgreSQL with backups
- CDN for static assets
- Error tracking (Sentry)
- Uptime monitoring
- Automated backups

### CI/CD Pipeline

1. Code push to GitHub
2. Run linting and type checking
3. Run unit tests
4. Run integration tests
5. Build application
6. Deploy to Vercel (preview for PRs, production for main)
7. Run smoke tests
8. Notify team

### Monitoring and Logging

**Application Monitoring:**
- Vercel Analytics for performance
- Error tracking with Sentry
- Custom logging for business events

**Database Monitoring:**
- Query performance tracking
- Connection pool monitoring
- Slow query alerts

**Alerts:**
- Error rate > 1%
- Response time > 2s (p95)
- Database connection failures
- Backup failures

## Internationalization

### Language Support

**Supported Locales:**
- English (en)
- Arabic (ar)

**Implementation:**
- next-intl for translations
- Separate message files (`/messages/en.json`, `/messages/ar.json`)
- RTL layout support for Arabic
- Locale-aware date and number formatting

**Translation Structure:**

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete"
  },
  "auth": {
    "login": "Login",
    "email": "Email Address",
    "password": "Password"
  },
  "inventory": {
    "itemName": "Item Name",
    "batch": "Batch Number",
    "quantity": "Quantity"
  }
}
```

### RTL Support

- Automatic layout flip for Arabic
- Mirror icons and directional elements
- Preserve number and date formats
- Test all components in both directions

## Accessibility

### WCAG 2.1 AA Compliance

**Keyboard Navigation:**
- All interactive elements keyboard accessible
- Logical tab order
- Skip to content links
- Keyboard shortcuts documented

**Screen Reader Support:**
- Semantic HTML elements
- ARIA labels and descriptions
- Live regions for dynamic content
- Form labels properly associated

**Visual Accessibility:**
- Color contrast ratio > 4.5:1
- Focus indicators visible
- Text resizable up to 200%
- No information conveyed by color alone

**Testing:**
- Automated testing with axe-core
- Manual testing with NVDA/JAWS
- Keyboard-only navigation testing
- Mobile screen reader testing

## Future Enhancements

### Phase 2 (Q1 2026)
- Native mobile apps (iOS/Android)
- Barcode scanning
- Item photos and attachments
- Advanced workflow approvals

### Phase 3 (Q2 2026)
- Real-time collaboration (WebSocket)
- Integration with accounting software
- Custom dashboard widgets
- Multi-location support

### Phase 4 (Q3 2026)
- Machine learning for anomaly detection
- Predictive analytics
- IoT device integration
- Advanced reporting templates
