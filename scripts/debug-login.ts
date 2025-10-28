#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function debugLogin() {
  console.log('🔍 Debugging login issue...\n');

  try {
    // Get the admin user
    const user = await prisma.user.findUnique({
      where: { email: 'admin@saudimais.sa' },
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Name:', user.name);
    console.log('   Role:', user.role);
    console.log('   Active:', user.isActive);
    console.log('   Password hash:', user.password.substring(0, 20) + '...');

    // Test password comparison
    const testPassword = 'Admin@123';
    console.log('\n🔐 Testing password comparison...');
    console.log('   Test password:', testPassword);
    
    const isValid = await bcrypt.compare(testPassword, user.password);
    console.log('   Password valid:', isValid);

    if (!isValid) {
      console.log('\n🔧 Generating new hash for comparison...');
      const newHash = await bcrypt.hash(testPassword, 12);
      console.log('   New hash:', newHash.substring(0, 20) + '...');
      
      const newComparison = await bcrypt.compare(testPassword, newHash);
      console.log('   New hash comparison:', newComparison);
    }

    // Test different variations
    const variations = [
      'Admin@123',
      'admin@123',
      'ADMIN@123',
      'Admin123',
      'admin@saudimais.sa'
    ];

    console.log('\n🧪 Testing password variations...');
    for (const variation of variations) {
      const result = await bcrypt.compare(variation, user.password);
      console.log(`   "${variation}": ${result}`);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugLogin();