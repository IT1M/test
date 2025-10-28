import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create default admin user
  const hashedPassword = await bcrypt.hash('Admin@123', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@saudimais.sa' },
    update: {},
    create: {
      email: 'admin@saudimais.sa',
      name: 'System Administrator',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: {
          email: true,
          inApp: true,
        },
      },
    },
  });

  console.log('✓ Created admin user:', adminUser.email);

  // Create sample inventory items
  const sampleItems = [
    {
      itemName: 'Surgical Masks N95',
      batch: 'MASK2024001',
      quantity: 5000,
      reject: 50,
      destination: 'MAIS' as const,
      category: 'PPE',
      notes: 'High-quality N95 masks for medical staff',
    },
    {
      itemName: 'Latex Gloves Medium',
      batch: 'GLOVE2024002',
      quantity: 10000,
      reject: 150,
      destination: 'FOZAN' as const,
      category: 'PPE',
      notes: 'Powder-free latex examination gloves',
    },
    {
      itemName: 'Surgical Gowns Large',
      batch: 'GOWN2024003',
      quantity: 2000,
      reject: 20,
      destination: 'MAIS' as const,
      category: 'PPE',
      notes: 'Disposable surgical gowns with fluid resistance',
    },
    {
      itemName: 'Digital Thermometers',
      batch: 'THERM2024004',
      quantity: 500,
      reject: 5,
      destination: 'FOZAN' as const,
      category: 'Diagnostic Equipment',
      notes: 'Non-contact infrared thermometers',
    },
    {
      itemName: 'Syringes 10ml',
      batch: 'SYR2024005',
      quantity: 15000,
      reject: 100,
      destination: 'MAIS' as const,
      category: 'Medical Supplies',
      notes: 'Sterile disposable syringes with needles',
    },
    {
      itemName: 'Bandages Elastic 10cm',
      batch: 'BAND2024006',
      quantity: 3000,
      reject: 30,
      destination: 'FOZAN' as const,
      category: 'Medical Supplies',
      notes: 'Elastic compression bandages',
    },
    {
      itemName: 'Alcohol Swabs',
      batch: 'SWAB2024007',
      quantity: 20000,
      reject: 200,
      destination: 'MAIS' as const,
      category: 'Medical Supplies',
      notes: '70% isopropyl alcohol prep pads',
    },
    {
      itemName: 'Blood Pressure Monitors',
      batch: 'BP2024008',
      quantity: 300,
      reject: 3,
      destination: 'FOZAN' as const,
      category: 'Diagnostic Equipment',
      notes: 'Digital automatic blood pressure monitors',
    },
  ];

  for (const item of sampleItems) {
    const inventoryItem = await prisma.inventoryItem.create({
      data: {
        ...item,
        enteredById: adminUser.id,
      },
    });
    console.log(`✓ Created inventory item: ${inventoryItem.itemName}`);
  }

  // Create default system settings
  const defaultSettings = [
    {
      key: 'app.name',
      value: { en: 'Saudi Mais Inventory System', ar: 'نظام مخزون السعودية ميس' },
      category: 'general',
    },
    {
      key: 'app.version',
      value: '1.0.0',
      category: 'general',
    },
    {
      key: 'backup.schedule',
      value: { enabled: true, time: '02:00', timezone: 'Asia/Riyadh' },
      category: 'backup',
    },
    {
      key: 'backup.retention',
      value: { daily: 30, weekly: 12, monthly: 12 },
      category: 'backup',
    },
    {
      key: 'notifications.highRejectThreshold',
      value: 15,
      category: 'notifications',
    },
    {
      key: 'api.rateLimit',
      value: { requestsPerMinute: 100 },
      category: 'api',
    },
    {
      key: 'session.timeout',
      value: 1800, // 30 minutes in seconds
      category: 'security',
    },
    {
      key: 'gemini.cacheTimeout',
      value: 1800, // 30 minutes in seconds
      category: 'api',
    },
  ];

  for (const setting of defaultSettings) {
    const systemSetting = await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: {},
      create: {
        ...setting,
        updatedById: adminUser.id,
      },
    });
    console.log(`✓ Created system setting: ${systemSetting.key}`);
  }

  console.log('\n✅ Database seed completed successfully!');
  console.log('\nDefault Admin Credentials:');
  console.log('Email: admin@saudimais.sa');
  console.log('Password: Admin@123');
  console.log('\n⚠️  Please change the admin password after first login!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
