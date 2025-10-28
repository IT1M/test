#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('🔍 Checking database connection and setup...\n');

  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection: SUCCESS');

    // Check users table
    const userCount = await prisma.user.count();
    console.log(`✅ Users table: ${userCount} users found`);

    // Check admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@saudimais.sa' },
      select: { id: true, name: true, email: true, role: true, isActive: true }
    });

    if (adminUser) {
      console.log('✅ Admin user exists:', {
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        active: adminUser.isActive
      });
    } else {
      console.log('❌ Admin user not found');
    }

    // Check inventory items
    const inventoryCount = await prisma.inventoryItem.count();
    console.log(`✅ Inventory items: ${inventoryCount} items found`);

    if (inventoryCount > 0) {
      const sampleItems = await prisma.inventoryItem.findMany({
        take: 3,
        select: {
          itemName: true,
          batch: true,
          quantity: true,
          destination: true,
          category: true
        }
      });
      console.log('📦 Sample inventory items:');
      sampleItems.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.itemName} (${item.batch}) - ${item.quantity} units to ${item.destination}`);
      });
    }

    // Check system settings
    const settingsCount = await prisma.systemSettings.count();
    console.log(`✅ System settings: ${settingsCount} settings configured`);

    if (settingsCount > 0) {
      const sampleSettings = await prisma.systemSettings.findMany({
        take: 3,
        select: { key: true, category: true }
      });
      console.log('⚙️  Sample system settings:');
      sampleSettings.forEach((setting, index) => {
        console.log(`   ${index + 1}. ${setting.key} (${setting.category})`);
      });
    }

    // Check audit logs
    const auditCount = await prisma.auditLog.count();
    console.log(`✅ Audit logs: ${auditCount} entries found`);

    // Check notifications
    const notificationCount = await prisma.notification.count();
    console.log(`✅ Notifications: ${notificationCount} notifications found`);

    // Check reports
    const reportCount = await prisma.report.count();
    console.log(`✅ Reports: ${reportCount} reports found`);

    // Check backups
    const backupCount = await prisma.backup.count();
    console.log(`✅ Backups: ${backupCount} backups found`);

    console.log('\n🎉 Database setup verification completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   • Users: ${userCount}`);
    console.log(`   • Inventory Items: ${inventoryCount}`);
    console.log(`   • System Settings: ${settingsCount}`);
    console.log(`   • Audit Logs: ${auditCount}`);
    console.log(`   • Notifications: ${notificationCount}`);
    console.log(`   • Reports: ${reportCount}`);
    console.log(`   • Backups: ${backupCount}`);

    if (adminUser) {
      console.log('\n🔐 Admin Login Credentials:');
      console.log('   Email: admin@saudimais.sa');
      console.log('   Password: Admin@123');
      console.log('   ⚠️  Remember to change the password after first login!');
    }

  } catch (error) {
    console.error('❌ Database check failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();