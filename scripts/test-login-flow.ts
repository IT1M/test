#!/usr/bin/env tsx

/**
 * Test script to verify the login flow works end-to-end
 */

async function testLoginFlow() {
  console.log('🧪 Testing login flow...\n');

  const baseUrl = 'http://localhost:3001';
  
  try {
    // Test 1: Try to access protected route without auth
    console.log('1. Testing protected route access without auth...');
    const protectedResponse = await fetch(`${baseUrl}/en/dashboard`, {
      redirect: 'manual'
    });
    
    console.log(`   Status: ${protectedResponse.status}`);
    console.log(`   Should redirect to login: ${protectedResponse.status === 307 || protectedResponse.status === 302}`);
    
    // Test 2: Test NextAuth endpoints
    console.log('\n2. Testing NextAuth endpoints...');
    const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
    const csrfData = await csrfResponse.json();
    console.log(`   CSRF token received: ${!!csrfData.csrfToken}`);
    
    // Test 3: Test login with credentials
    console.log('\n3. Testing login with credentials...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'admin@saudimais.sa',
        password: 'Admin@123',
        csrfToken: csrfData.csrfToken,
        callbackUrl: `${baseUrl}/en/dashboard`,
        json: 'true'
      }),
      redirect: 'manual'
    });
    
    console.log(`   Login response status: ${loginResponse.status}`);
    console.log(`   Headers:`, Object.fromEntries(loginResponse.headers.entries()));
    
    if (loginResponse.status === 200) {
      const loginData = await loginResponse.json();
      console.log(`   Login response:`, loginData);
    }
    
    console.log('\n✅ Login flow test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testLoginFlow();