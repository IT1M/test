# 📊 مراقبة النظام - Saudi Mais Inventory System

## 🚀 تشغيل المراقبة الخارجية

### المتطلبات:
- Docker Desktop مُثبت ومُشغل
- Docker Compose

### خطوات التشغيل:

#### 1. تشغيل Docker Desktop
```bash
# على macOS - تشغيل Docker Desktop من Applications
open -a Docker

# أو تشغيل Docker daemon يدوياً
sudo dockerd
```

#### 2. التحقق من حالة Docker
```bash
docker --version
docker-compose --version
docker ps
```

#### 3. تشغيل Uptime Kuma
```bash
cd monitoring
docker-compose -f uptime-kuma.yml up -d
```

#### 4. الوصول للمراقبة
- افتح المتصفح على: `http://localhost:3001`
- قم بإنشاء حساب مسؤول جديد
- أضف مراقبة للنظام الرئيسي

### إعداد المراقبة:

#### مراقبة التطبيق الرئيسي:
- **النوع:** HTTP(s)
- **الرابط:** `http://localhost:3000/api/health`
- **الفترة:** كل 60 ثانية
- **المهلة الزمنية:** 30 ثانية

#### مراقبة قاعدة البيانات:
- **النوع:** HTTP(s) 
- **الرابط:** `http://localhost:3000/api/health/detailed`
- **الفترة:** كل 300 ثانية (5 دقائق)

#### مراقبة الأداء:
- **النوع:** HTTP(s)
- **الرابط:** `http://localhost:3000/api/health/detailed`
- **مراقبة الكلمات المفتاحية:** `"status":"healthy"`

### التنبيهات:

#### إعداد تنبيهات البريد الإلكتروني:
1. اذهب إلى Settings > Notifications
2. أضف إشعار جديد من نوع "Email (SMTP)"
3. أدخل إعدادات SMTP:
   ```
   SMTP Host: smtp.gmail.com
   Port: 587
   Security: STARTTLS
   Username: your-email@gmail.com
   Password: your-app-password
   ```

#### إعداد تنبيهات Slack:
1. أنشئ Webhook في Slack workspace
2. أضف إشعار جديد من نوع "Slack"
3. أدخل Webhook URL

### استكشاف الأخطاء:

#### مشكلة Docker daemon:
```bash
# تشغيل Docker Desktop
open -a Docker

# أو إعادة تشغيل Docker service
sudo systemctl restart docker  # Linux
brew services restart docker   # macOS with Homebrew
```

#### مشكلة المنافذ:
```bash
# التحقق من المنافذ المستخدمة
lsof -i :3001

# إيقاف العملية المستخدمة للمنفذ
kill -9 <PID>
```

#### مشكلة الشبكة:
```bash
# إنشاء شبكة Docker
docker network create saudi-mais-network

# إعادة تشغيل الحاويات
docker-compose -f uptime-kuma.yml down
docker-compose -f uptime-kuma.yml up -d
```

### الأوامر المفيدة:

```bash
# عرض حالة الحاويات
docker-compose -f uptime-kuma.yml ps

# عرض السجلات
docker-compose -f uptime-kuma.yml logs -f

# إيقاف المراقبة
docker-compose -f uptime-kuma.yml down

# إعادة تشغيل المراقبة
docker-compose -f uptime-kuma.yml restart

# تحديث صورة Uptime Kuma
docker-compose -f uptime-kuma.yml pull
docker-compose -f uptime-kuma.yml up -d
```

### النسخ الاحتياطي لبيانات المراقبة:

```bash
# نسخ احتياطي لبيانات Uptime Kuma
docker run --rm -v uptime-kuma-data:/data -v $(pwd):/backup alpine tar czf /backup/uptime-kuma-backup.tar.gz -C /data .

# استعادة النسخة الاحتياطية
docker run --rm -v uptime-kuma-data:/data -v $(pwd):/backup alpine tar xzf /backup/uptime-kuma-backup.tar.gz -C /data
```

## 🔍 مراقبة النظام الداخلية

### Health Check APIs:

#### الفحص الأساسي:
```bash
curl http://localhost:3000/api/health
```

#### الفحص المفصل:
```bash
curl http://localhost:3000/api/health/detailed
```

### مراقبة الأداء:

#### استخدام الذاكرة:
```bash
# مراقبة استخدام الذاكرة
docker stats saudi-mais-app

# مراقبة استخدام القرص
df -h
```

#### مراقبة قاعدة البيانات:
```bash
# الاتصال بقاعدة البيانات
docker-compose exec saudi-mais-db psql -U postgres -d saudi_mais

# فحص حجم قاعدة البيانات
SELECT pg_size_pretty(pg_database_size('saudi_mais'));

# فحص الاتصالات النشطة
SELECT count(*) FROM pg_stat_activity;
```

### تنبيهات مخصصة:

يمكنك إنشاء تنبيهات مخصصة باستخدام:
- **Prometheus + Grafana** للمراقبة المتقدمة
- **New Relic** للمراقبة السحابية
- **DataDog** للمراقبة الشاملة

---

**ملاحظة:** تأكد من تشغيل Docker Desktop قبل تشغيل أي من أوامر Docker أو Docker Compose.