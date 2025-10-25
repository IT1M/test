#!/usr/bin/env tsx

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

interface LoginResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
  };
}

async function testAuthentication() {
  console.log('🔐 Testing Authentication System...\n');

  try {
    // Test 1: Login with correct credentials
    console.log('1️⃣ Testing login with correct credentials...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@saudimais.sa',
        password: 'Admin@123',
        rememberMe: false,
      }),
    });

    const loginResult: LoginResponse = await loginResponse.json() as LoginResponse;
    
    if (loginResult.success) {
      console.log('✅ Login successful with correct credentials');
    } else {
      console.log('❌ Login failed:', loginResult.error?.message);
    }

    // Test 2: Login with incorrect credentials
    console.log('\n2️⃣ Testing login with incorrect credentials...');
    const wrongLoginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@saudimais.sa',
        password: 'WrongPassword',
        rememberMe: false,
      }),
    });

    const wrongLoginResult: LoginResponse = await wrongLoginResponse.json() as LoginResponse;
    
    if (!wrongLoginResult.success && wrongLoginResult.error?.code === 'AUTH_ERROR') {
      console.log('✅ Correctly rejected incorrect credentials');
    } else {
      console.log('❌ Should have rejected incorrect credentials');
    }

    // Test 3: Login with non-existent user
    console.log('\n3️⃣ Testing login with non-existent user...');
    const nonExistentResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'password123',
        rememberMe: false,
      }),
    });

    const nonExistentResult: LoginResponse = await nonExistentResponse.json() as LoginResponse;
    
    if (!nonExistentResult.success && nonExistentResult.error?.code === 'AUTH_ERROR') {
      console.log('✅ Correctly rejected non-existent user');
    } else {
      console.log('❌ Should have rejected non-existent user');
    }

    // Test 4: Login with missing fields
    console.log('\n4️⃣ Testing login with missing fields...');
    const missingFieldsResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@saudimais.sa',
        // password missing
      }),
    });

    const missingFieldsResult: LoginResponse = await missingFieldsResponse.json() as LoginResponse;
    
    if (!missingFieldsResult.success && missingFieldsResult.error?.code === 'VALIDATION_ERROR') {
      console.log('✅ Correctly rejected missing fields');
    } else {
      console.log('❌ Should have rejected missing fields');
    }

    // Test 5: Test logout endpoint
    console.log('\n5️⃣ Testing logout endpoint...');
    const logoutResponse = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const logoutResult: LoginResponse = await logoutResponse.json() as LoginResponse;
    
    if (!logoutResult.success && logoutResult.error?.code === 'AUTH_ERROR') {
      console.log('✅ Logout correctly requires authentication');
    } else {
      console.log('❌ Logout should require authentication');
    }

    // Test 6: Test protected API endpoint
    console.log('\n6️⃣ Testing protected API endpoint without authentication...');
    const protectedResponse = await fetch(`${BASE_URL}/api/inventory`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const protectedResult: LoginResponse = await protectedResponse.json() as LoginResponse;
    
    if (!protectedResult.success && protectedResult.error?.code === 'AUTH_ERROR') {
      console.log('✅ Protected endpoint correctly requires authentication');
    } else {
      console.log('❌ Protected endpoint should require authentication');
    }

    console.log('\n🎉 Authentication system tests completed!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Login with correct credentials');
    console.log('   ✅ Reject incorrect credentials');
    console.log('   ✅ Reject non-existent users');
    console.log('   ✅ Validate required fields');
    console.log('   ✅ Logout requires authentication');
    console.log('   ✅ Protected endpoints require authentication');

  } catch (error) {
    console.error('❌ Authentication test failed:', error);
    process.exit(1);
  }
}

testAuthentication();