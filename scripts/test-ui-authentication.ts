#!/usr/bin/env tsx

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

async function testUIAuthentication() {
  console.log('🖥️  Testing UI Authentication Flow...\n');

  try {
    // Test 1: Access login page
    console.log('1️⃣ Testing login page accessibility...');
    const loginPageResponse = await fetch(`${BASE_URL}/en/login`);
    
    if (loginPageResponse.ok) {
      console.log('✅ Login page accessible');
    } else {
      console.log('❌ Login page not accessible:', loginPageResponse.status);
    }

    // Test 2: Access Arabic login page
    console.log('\n2️⃣ Testing Arabic login page...');
    const arabicLoginResponse = await fetch(`${BASE_URL}/ar/login`);
    
    if (arabicLoginResponse.ok) {
      console.log('✅ Arabic login page accessible');
    } else {
      console.log('❌ Arabic login page not accessible:', arabicLoginResponse.status);
    }

    // Test 3: Access protected dashboard without auth
    console.log('\n3️⃣ Testing dashboard redirect without authentication...');
    const dashboardResponse = await fetch(`${BASE_URL}/en/dashboard`, {
      redirect: 'manual'
    });
    
    if (dashboardResponse.status === 302 || dashboardResponse.status === 307) {
      console.log('✅ Dashboard correctly redirects unauthenticated users');
    } else {
      console.log('❌ Dashboard should redirect unauthenticated users');
    }

    // Test 4: Test root path redirect
    console.log('\n4️⃣ Testing root path redirect...');
    const rootResponse = await fetch(`${BASE_URL}/`, {
      redirect: 'manual'
    });
    
    if (rootResponse.status === 302 || rootResponse.status === 307) {
      console.log('✅ Root path correctly redirects');
    } else {
      console.log('❌ Root path should redirect');
    }

    // Test 5: Test locale redirect
    console.log('\n5️⃣ Testing locale-specific redirects...');
    const enRootResponse = await fetch(`${BASE_URL}/en`, {
      redirect: 'manual'
    });
    
    if (enRootResponse.status === 302 || enRootResponse.status === 307) {
      console.log('✅ English root correctly redirects');
    } else {
      console.log('❌ English root should redirect');
    }

    // Test 6: Test protected pages
    const protectedPages = [
      '/en/data-entry',
      '/en/analytics',
      '/en/reports',
      '/en/audit',
      '/en/backup',
      '/en/settings'
    ];

    console.log('\n6️⃣ Testing protected pages redirect...');
    for (const page of protectedPages) {
      const response = await fetch(`${BASE_URL}${page}`, {
        redirect: 'manual'
      });
      
      if (response.status === 302 || response.status === 307) {
        console.log(`✅ ${page} correctly redirects unauthenticated users`);
      } else {
        console.log(`❌ ${page} should redirect unauthenticated users`);
      }
    }

    console.log('\n🎉 UI Authentication flow tests completed!');

  } catch (error) {
    console.error('❌ UI Authentication test failed:', error);
    process.exit(1);
  }
}

testUIAuthentication();