'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { db } from '@/lib/db/schema';
import { PasswordHasher } from '@/lib/security/encryption';
import { InputSanitizer } from '@/lib/security/sanitization';
import { logAuthEvent } from '@/lib/security/audit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuthStore();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Sanitize inputs
      const sanitizedUsername = InputSanitizer.sanitizeString(username);
      const sanitizedPassword = password; // Don't sanitize password, just use as-is

      if (!sanitizedUsername || !sanitizedPassword) {
        setError('Please enter both username and password');
        setIsLoading(false);
        return;
      }

      // Find user by username
      let user = await db.users
        .where('username')
        .equalsIgnoreCase(sanitizedUsername)
        .first();

      // Create default admin user if logging in as admin and user doesn't exist
      if (!user && sanitizedUsername.toLowerCase() === 'admin') {
        const { hash, salt } = PasswordHasher.hash('admin123');
        const { Permission } = await import('@/lib/auth/rbac');
        const adminUser = {
          id: 'admin-default',
          username: 'admin',
          email: 'admin@maiscompany.com',
          role: 'admin' as const,
          permissions: Object.values(Permission).map(p => p.toString()),
          isActive: true,
          passwordHash: hash,
          passwordSalt: salt,
          createdAt: new Date(),
          lastLogin: new Date(),
        };
        await db.users.add(adminUser);
        user = adminUser;
      }

      if (!user) {
        setError('Invalid username or password');
        await logAuthEvent('failed_login', sanitizedUsername, {
          reason: 'user_not_found',
        });
        setIsLoading(false);
        return;
      }

      // Check if user is active
      if (!user.isActive) {
        setError('Your account has been deactivated. Please contact an administrator.');
        await logAuthEvent('failed_login', user.id, {
          reason: 'account_inactive',
        });
        setIsLoading(false);
        return;
      }

      // Verify password
      const isPasswordValid = PasswordHasher.verify(
        sanitizedPassword,
        user.passwordHash || '',
        user.passwordSalt || ''
      );

      if (!isPasswordValid) {
        setError('Invalid username or password');
        await logAuthEvent('failed_login', user.id, {
          reason: 'invalid_password',
        });
        setIsLoading(false);
        return;
      }

      // Update last login
      await db.users.update(user.id, {
        lastLogin: new Date(),
      });

      // Log successful login
      await logAuthEvent('login', user.id, {
        username: user.username,
      });

      // Set user in auth store
      login(user);

      toast.success(`Welcome back, ${user.username}!`);
      router.push('/');
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">
            Medical Products Management System
          </CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 space-y-2">
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              <p>Session timeout: 30 minutes of inactivity</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Demo Credentials:
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                Username: <span className="font-mono font-bold">admin</span> | Password: <span className="font-mono font-bold">admin123</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
