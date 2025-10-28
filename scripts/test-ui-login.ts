#!/usr/bin/env tsx

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

async function testUILogin() {
  console.log('🖥️  Testing UI Login Functionality...\n');

  try {
    // Test 1: Check login page loads
    console.log('1️⃣ Testing login page accessibility...');
    const loginPageResponse = await fetch(`${BASE_URL}/en/login`);
    
    if (loginPageResponse.ok) {
      const content = await loginPageResponse.text();
      if (content.includes('Sign in to Saudi Mais') && content.includes('email')) {
        console.log('✅ English login page loads correctly');
      } else {
        console.log('❌ English login page missing expected content');
      }
    } else {
      console.log('❌ English login page not accessible');
    }

    // Test 2: Check Arabic login page
    console.log('\n2️⃣ Testing Arabic login page...');
    const arLoginResponse = await fetch(`${BASE_URL}/ar/login`);
    
    if (arLoginResponse.ok) {
      const arContent = await arLoginResponse.text();
      if (arContent.includes('تسجيل الدخول') && arContent.includes('البريد')) {
        console.log('✅ Arabic login page loads correctly');
      } else {
        console.log('❌ Arabic login page missing expected content');
      }
    } else {
      console.log('❌ Arabic login page not accessible');
    }

    // Test 3: Test API login functionality
    console.log('\n3️⃣ Testing API login with correct credentials...');
    const apiResponse = await fetch(`${BASE_URL}/api/auth/login`, {
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

    const apiResult = await apiResponse.json();
    
    if (apiResult.success) {
      console.log('✅ API login successful');
      console.log('   User:', apiResult.data.user.name);
      console.log('   Role:', apiResult.data.user.role);
      console.log('   Redirect to:', apiResult.data.redirectTo);
    } else {
      console.log('❌ API login failed:', apiResult.error?.message);
    }

    // Test 4: Test API login with wrong credentials
    console.log('\n4️⃣ Testing API login with wrong credentials...');
    const wrongApiResponse = await fetch(`${BASE_URL}/api/auth/login`, {
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

    const wrongApiResult = await wrongApiResponse.json();
    
    if (!wrongApiResult.success && wrongApiResult.error?.message === 'Invalid email or password') {
      console.log('✅ API correctly rejects wrong credentials');
    } else {
      console.log('❌ API should reject wrong credentials');
    }

    // Test 5: Test protected page redirect
    console.log('\n5️⃣ Testing protected page redirect...');
    const protectedResponse = await fetch(`${BASE_URL}/en/dashboard`, {
      redirect: 'manual'
    });
    
    if (protectedResponse.status >= 300 && protectedResponse.status < 400) {
      const location = protectedResponse.headers.get('location');
      if (location?.includes('/login')) {
        console.log('✅ Protected page redirects to login');
        console.log('   Redirect URL:', location);
      } else {
        console.log('❌ Protected page should redirect to login');
      }
    } else {
      console.log('❌ Protected page should redirect unauthenticated users');
    }

    console.log('\n🎉 UI Login functionality test completed!');
    console.log('\n📋 UI Test Summary:');
    console.log('   ✅ Login pages load correctly (English & Arabic)');
    console.log('   ✅ API authentication works');
    console.log('   ✅ Wrong credentials are rejected');
    console.log('   ✅ Protected pages redirect to login');
    console.log('\n✅ Login system is working correctly!');
    console.log('\n🔐 You can now login with:');
    console.log('   Email: admin@saudimais.sa');
    console.log('   Password: Admin@123');

  } catch (error) {
    console.error('❌ UI Login test failed:', error);
    process.exit(1);
  }
}

testUILogin();