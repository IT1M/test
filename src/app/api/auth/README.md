# Authentication System Documentation

## Overview
This authentication system is built with NextAuth v5 and provides secure user authentication, role-based access control, and comprehensive audit logging.

## Components

### 1. NextAuth Configuration (`/src/services/auth.ts`)
- JWT-based session strategy with 30-minute timeout
- Credentials provider for email/password authentication
- Password verification using bcrypt
- User role and preferences included in session
- Active user status checking

### 2. API Routes

#### `/api/auth/[...nextauth]` - NextAuth Handler
- Handles all NextAuth authentication flows
- GET and POST methods for sign-in, sign-out, etc.

#### `/api/auth/login` - Login Endpoint
- Validates email and password
- Creates audit log for login attempts (success and failure)
- Returns appropriate error messages

#### `/api/auth/register` - Registration Endpoint
- Validates email format and password strength (min 8 characters)
- Checks for existing users
- Hashes passwords with bcrypt (12 rounds)
- Creates audit log for new user registration
- Assigns default role (DATA_ENTRY)

#### `/api/auth/change-password` - Password Change Endpoint
- Requires authentication
- Validates current password
- Enforces password strength requirements
- Creates audit log for password changes

#### `/api/auth/logout` - Logout Endpoint
- Requires authentication
- Creates audit log for logout
- Terminates user session

### 3. Middleware (`/src/middleware.ts`)
- Protects routes based on authentication status
- Implements role-based access control
- Handles locale routing (en/ar)
- Redirects unauthenticated users to login
- Redirects authenticated users away from auth pages
- Redirects users to role-appropriate dashboards

### 4. Utilities

#### `/src/utils/audit.ts` - Audit Logging
- `createAuditLog()` - Creates audit log entries
- `getClientInfo()` - Extracts IP address and user agent from requests
- Captures old/new values for UPDATE actions

#### `/src/utils/rbac.ts` - Role-Based Access Control
- `hasRouteAccess()` - Check if user role can access a route
- `hasMinimumRole()` - Check role hierarchy
- `getDefaultDashboard()` - Get role-specific dashboard
- `canPerformAction()` - Check action permissions on resources

## User Roles

1. **ADMIN** - Full system access
2. **MANAGER** - Analytics, reports, settings
3. **SUPERVISOR** - Data management, editing, deletion
4. **DATA_ENTRY** - Create inventory items
5. **AUDITOR** - View audit logs and data

## Role-Based Dashboards

- ADMIN → `/dashboard`
- MANAGER → `/analytics`
- SUPERVISOR → `/data-log`
- DATA_ENTRY → `/data-entry`
- AUDITOR → `/audit`

## Security Features

1. **Password Security**
   - Bcrypt hashing with 12 rounds
   - Minimum 8 characters
   - Never exposed in responses

2. **Session Security**
   - JWT-based sessions
   - 30-minute timeout
   - HTTP-only cookies (configured by NextAuth)

3. **Audit Logging**
   - All authentication events logged
   - IP address and user agent captured
   - Failed login attempts tracked

4. **Input Validation**
   - Email format validation
   - Password strength requirements
   - User existence checks

## Usage Examples

### Server-Side Authentication Check
```typescript
import { auth } from "@/services/auth";

export default async function ProtectedPage() {
  const session = await auth();
  
  if (!session) {
    redirect("/login");
  }
  
  // Access user data
  const { id, email, name, role } = session.user;
}
```

### API Route Protection
```typescript
import { auth } from "@/services/auth";

export async function GET(request: Request) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  
  // Check role-based permissions
  if (!canPerformAction(session.user.role, "read", "inventory")) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }
}
```

### Creating Audit Logs
```typescript
import { createAuditLog, getClientInfo } from "@/utils/audit";

const { ipAddress, userAgent } = getClientInfo(request);

await createAuditLog({
  userId: session.user.id,
  action: "CREATE",
  entityType: "InventoryItem",
  entityId: item.id,
  newValue: item,
  ipAddress,
  userAgent,
});
```

## Environment Variables Required

```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
DATABASE_URL="postgresql://..."
```

## Testing

To test the authentication system:

1. Ensure database is running and seeded with test users
2. Start the development server: `npm run dev`
3. Navigate to `/login`
4. Use credentials from seeded data
5. Verify redirect to role-appropriate dashboard
6. Check audit logs in database

## Next Steps

- Implement login/register UI pages
- Add email verification
- Implement password reset flow
- Add two-factor authentication (optional)
- Configure email notifications for security events
