# إعداد قاعدة البيانات - Saudi Mais Inventory System

## 📋 متطلبات النظام

- PostgreSQL 12+ أو Neon Database
- Node.js 18+
- npm أو yarn

## 🚀 خطوات الإعداد

### 1. إعداد متغيرات البيئة

```bash
# انسخ ملف البيئة النموذجي
cp .env.example .env.local

# قم بتحديث DATABASE_URL في .env.local
DATABASE_URL="postgresql://user:password@localhost:5432/saudi_mais_inventory?schema=public"
```

### 2. إعداد قاعدة البيانات

```bash
# تثبيت التبعيات
npm install

# إنشاء قاعدة البيانات وتطبيق المخطط
npm run db:migrate

# أو استخدم push للتطوير
npm run db:push

# إنشاء البيانات الأولية
npm run db:seed
```

### 3. التحقق من الإعداد

```bash
# فحص حالة قاعدة البيانات
npm run db:check

# فتح واجهة إدارة قاعدة البيانات
npm run db:studio
```

## 🔐 بيانات المسؤول الافتراضية

- **البريد الإلكتروني:** admin@saudimais.sa
- **كلمة المرور:** Admin@123

⚠️ **مهم:** قم بتغيير كلمة المرور بعد أول تسجيل دخول!

## 📊 هيكل قاعدة البيانات

### الجداول الرئيسية:
- `User` - المستخدمون والأدوار
- `InventoryItem` - عناصر المخزون
- `AuditLog` - سجل العمليات
- `Report` - التقارير
- `Backup` - النسخ الاحتياطي
- `SystemSettings` - إعدادات النظام
- `Notification` - الإشعارات

## 🛠️ أوامر مفيدة

```bash
# إعادة تعيين قاعدة البيانات
npm run db:reset

# إنشاء migration جديد
npm run db:migrate

# تحديث Prisma Client
npm run db:generate

# فحص قاعدة البيانات
npm run db:check
```