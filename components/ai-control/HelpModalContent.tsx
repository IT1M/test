'use client';

import { Shield, CheckCircle, AlertTriangle } from 'lucide-react';

// Getting Started Content
export function GettingStartedContent() {
  return (
    <div className="prose dark:prose-invert max-w-none" dir="rtl">
      <h3 className="text-2xl font-bold mb-4">مرحباً بك في مركز التحكم بالذكاء الاصطناعي</h3>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 border-r-4 border-blue-600 p-4 rounded-lg mb-6">
        <p className="text-blue-900 dark:text-blue-100 font-medium">
          هذا المركز يوفر لك تحكماً كاملاً في جميع عمليات الذكاء الاصطناعي في النظام
        </p>
      </div>
      
      <h4 className="text-xl font-semibold mt-6 mb-3">الخطوات الأولى:</h4>
      
      <ol className="space-y-4">
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
            1
          </span>
          <div>
            <strong>تحقق من حالة النماذج:</strong>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              انتقل إلى لوحة "Overview" للاطلاع على حالة جميع نماذج الذكاء الاصطناعي المتصلة
            </p>
          </div>
        </li>
        
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
            2
          </span>
          <div>
            <strong>راجع الإعدادات الأمنية:</strong>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              تأكد من تفعيل تعقيم البيانات الطبية (PHI) قبل إرسالها للنماذج الخارجية
            </p>
          </div>
        </li>
        
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
            3
          </span>
          <div>
            <strong>ضبط عتبات الثقة:</strong>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              حدد مستوى الثقة المطلوب لاتخاذ القرارات التلقائية (الافتراضي: 0.75)
            </p>
          </div>
        </li>
        
        <li className="flex gap-3">
          <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
            4
          </span>
          <div>
            <strong>راقب السجلات:</strong>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              استخدم صفحة "Audit Logs" لمراقبة جميع عمليات الذكاء الاصطناعي وتصدير التقارير
            </p>
          </div>
        </li>
      </ol>
      
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-r-4 border-yellow-600 p-4 rounded-lg mt-6">
        <h5 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">⚠️ تنبيه هام</h5>
        <p className="text-yellow-800 dark:text-yellow-200 text-sm">
          أي تغيير في الإعدادات الحرجة يتطلب مصادقة ثنائية (MFA) ويتم تسجيله في سجل التدقيق الأمني
        </p>
      </div>
    </div>
  );
}

// Configuration Content
export function ConfigurationContent() {
  return (
    <div className="prose dark:prose-invert max-w-none" dir="rtl">
      <h3 className="text-2xl font-bold mb-4">إعداد وتكوين النماذج</h3>
      
      <h4 className="text-xl font-semibold mt-6 mb-3">تفعيل/تعطيل النماذج</h4>
      <p>يمكنك التحكم في تشغيل كل نموذج بشكل مستقل:</p>
      
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg my-4">
        <code className="text-sm">
          Settings → Model Configuration → Toggle Switch
        </code>
      </div>
      
      <h4 className="text-xl font-semibold mt-6 mb-3">معايير الأداء</h4>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-right text-sm font-semibold text-gray-900 dark:text-white">المعيار</th>
              <th className="px-4 py-2 text-right text-sm font-semibold text-gray-900 dark:text-white">القيمة الافتراضية</th>
              <th className="px-4 py-2 text-right text-sm font-semibold text-gray-900 dark:text-white">الوصف</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">معدل الاستدعاء</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">60 طلب/دقيقة</td>
              <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">الحد الأقصى للطلبات في الدقيقة</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">زمن التنفيذ</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">30 ثانية</td>
              <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">الحد الأقصى لزمن انتظار الاستجابة</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">عتبة الثقة</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">0.75</td>
              <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">الحد الأدنى للثقة لاتخاذ قرار تلقائي</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h4 className="text-xl font-semibold mt-6 mb-3">إعدادات متقدمة</h4>
      <ul className="space-y-2 text-gray-700 dark:text-gray-300">
        <li>• <strong>Batch Processing:</strong> معالجة دفعات متعددة من الطلبات</li>
        <li>• <strong>Caching:</strong> تخزين مؤقت للاستجابات المتكررة</li>
        <li>• <strong>Fallback Models:</strong> نماذج احتياطية عند فشل النموذج الأساسي</li>
        <li>• <strong>Load Balancing:</strong> توزيع الحمل بين النماذج المتعددة</li>
      </ul>
    </div>
  );
}

// Security Content
export function SecurityContent() {
  return (
    <div className="prose dark:prose-invert max-w-none" dir="rtl">
      <h3 className="text-2xl font-bold mb-4">الأمان والخصوصية</h3>
      
      <div className="bg-red-50 dark:bg-red-900/20 border-r-4 border-red-600 p-4 rounded-lg mb-6">
        <h5 className="font-semibold text-red-900 dark:text-red-100 mb-2">🔒 سياسة حماية البيانات الطبية</h5>
        <p className="text-red-800 dark:text-red-200 text-sm">
          جميع البيانات الطبية الحساسة (PHI) يتم تعقيمها تلقائياً قبل إرسالها لأي خدمة خارجية
        </p>
      </div>
      
      <h4 className="text-xl font-semibold mt-6 mb-3">آليات الحماية المفعلة:</h4>
      
      <ul className="space-y-3">
        <li className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
          <div>
            <strong>تعقيم تلقائي للبيانات:</strong>
            <p className="text-gray-600 dark:text-gray-400">إزالة الأسماء، أرقام الهوية، تواريخ الميلاد، وأي معلومات تعريفية</p>
          </div>
        </li>
        
        <li className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
          <div>
            <strong>تشفير النقل:</strong>
            <p className="text-gray-600 dark:text-gray-400">TLS 1.3 لجميع الاتصالات الخارجية</p>
          </div>
        </li>
        
        <li className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
          <div>
            <strong>تشفير التخزين:</strong>
            <p className="text-gray-600 dark:text-gray-400">AES-256 للبيانات الحساسة في قاعدة البيانات</p>
          </div>
        </li>
        
        <li className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
          <div>
            <strong>سجل تدقيق شامل:</strong>
            <p className="text-gray-600 dark:text-gray-400">تسجيل جميع العمليات مع معلومات المستخدم والوقت</p>
          </div>
        </li>
      </ul>
      
      <h4 className="text-xl font-semibold mt-6 mb-3">الأدوار والصلاحيات:</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
          <h5 className="font-semibold mb-2 text-gray-900 dark:text-white">AI_ADMIN</h5>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            تحكم كامل في جميع الإعدادات والسجلات
          </p>
        </div>
        
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
          <h5 className="font-semibold mb-2 text-gray-900 dark:text-white">AI_OPERATOR</h5>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            عرض وتشغيل الفحوصات بدون تغيير الإعدادات
          </p>
        </div>
        
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
          <h5 className="font-semibold mb-2 text-gray-900 dark:text-white">AI_AUDITOR</h5>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            عرض وتصدير السجلات فقط
          </p>
        </div>
      </div>

      <h4 className="text-xl font-semibold mt-6 mb-3">معايير الامتثال:</h4>
      <ul className="space-y-2 text-gray-700 dark:text-gray-300">
        <li>• <strong>HIPAA:</strong> حماية المعلومات الصحية الشخصية</li>
        <li>• <strong>GDPR:</strong> حماية البيانات الشخصية للمواطنين الأوروبيين</li>
        <li>• <strong>ISO 27001:</strong> إدارة أمن المعلومات</li>
        <li>• <strong>SOC 2:</strong> ضوابط الأمان والخصوصية</li>
      </ul>
    </div>
  );
}

// Automation Content
export function AutomationContent() {
  return (
    <div className="prose dark:prose-invert max-w-none" dir="rtl">
      <h3 className="text-2xl font-bold mb-4">قواعد الأتمتة</h3>
      
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        يمكنك إنشاء قواعد أتمتة لتنفيذ إجراءات تلقائية بناءً على أحداث معينة في النظام.
      </p>
      
      <h4 className="text-xl font-semibold mt-6 mb-3">أنواع المحفزات (Triggers):</h4>
      
      <div className="space-y-3">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
          <h5 className="font-semibold text-gray-900 dark:text-white mb-2">1. Confidence Threshold</h5>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            تنفيذ إجراء عندما تنخفض درجة الثقة عن حد معين
          </p>
          <code className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded mt-2 block">
            IF confidence &lt; 0.7 THEN send_alert
          </code>
        </div>
        
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
          <h5 className="font-semibold text-gray-900 dark:text-white mb-2">2. Error Rate</h5>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            تنبيه عند ارتفاع معدل الأخطاء
          </p>
          <code className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded mt-2 block">
            IF error_rate &gt; 5% THEN disable_model
          </code>
        </div>
        
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
          <h5 className="font-semibold text-gray-900 dark:text-white mb-2">3. Cost Budget</h5>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            إيقاف النموذج عند تجاوز الميزانية
          </p>
          <code className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded mt-2 block">
            IF daily_cost &gt; $50 THEN pause_model
          </code>
        </div>
      </div>
      
      <h4 className="text-xl font-semibold mt-6 mb-3">الإجراءات المتاحة (Actions):</h4>
      
      <ul className="space-y-2 text-gray-700 dark:text-gray-300">
        <li>• <strong>Send Alert:</strong> إرسال تنبيه للمسؤولين</li>
        <li>• <strong>Send Email:</strong> إرسال بريد إلكتروني</li>
        <li>• <strong>Disable Model:</strong> تعطيل النموذج مؤقتاً</li>
        <li>• <strong>Switch to Fallback:</strong> التحويل للنموذج الاحتياطي</li>
        <li>• <strong>Log Event:</strong> تسجيل الحدث في السجلات</li>
        <li>• <strong>Execute Webhook:</strong> استدعاء API خارجي</li>
      </ul>

      <h4 className="text-xl font-semibold mt-6 mb-3">مثال عملي:</h4>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 border-r-4 border-blue-600 p-4 rounded-lg">
        <p className="text-blue-900 dark:text-blue-100 font-medium mb-2">قاعدة: مراقبة جودة التصنيف</p>
        <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <p><strong>المحفز:</strong> عندما تنخفض درجة الثقة عن 0.75 لمدة 5 دقائق متتالية</p>
          <p><strong>الإجراء:</strong> إرسال تنبيه للمسؤول + تسجيل الحدث + التحويل للمراجعة اليدوية</p>
        </div>
      </div>
    </div>
  );
}

// Troubleshooting Content
export function TroubleshootingContent() {
  return (
    <div className="prose dark:prose-invert max-w-none" dir="rtl">
      <h3 className="text-2xl font-bold mb-4">حل المشكلات الشائعة</h3>
      
      <div className="space-y-6">
        {/* Problem 1 */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white m-0">
              النموذج لا يستجيب أو بطيء جداً
            </h4>
          </div>
          
          <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
            <p><strong>الأسباب المحتملة:</strong></p>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>تجاوز حد الطلبات (Rate Limit)</li>
              <li>مشكلة في الاتصال بالإنترنت</li>
              <li>النموذج قيد الصيانة</li>
            </ul>
            
            <p className="mt-3"><strong>الحلول:</strong></p>
            <ol className="list-decimal list-inside space-y-1 mr-4">
              <li>تحقق من حالة النموذج في صفحة Diagnostics</li>
              <li>راجع معدل الطلبات في Cost Analytics</li>
              <li>جرب التحويل للنموذج الاحتياطي</li>
              <li>تواصل مع الدعم الفني إذا استمرت المشكلة</li>
            </ol>
          </div>
        </div>

        {/* Problem 2 */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-1 flex-shrink-0" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white m-0">
              درجة الثقة منخفضة باستمرار
            </h4>
          </div>
          
          <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
            <p><strong>الأسباب المحتملة:</strong></p>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>جودة البيانات المدخلة ضعيفة</li>
              <li>النموذج يحتاج لإعادة تدريب</li>
              <li>البيانات خارج نطاق تدريب النموذج</li>
            </ul>
            
            <p className="mt-3"><strong>الحلول:</strong></p>
            <ol className="list-decimal list-inside space-y-1 mr-4">
              <li>راجع جودة البيانات المدخلة</li>
              <li>تحقق من تطابق البيانات مع نطاق النموذج</li>
              <li>استخدم نموذج أكثر تخصصاً للمهمة</li>
              <li>اطلب إعادة تدريب النموذج على بيانات جديدة</li>
            </ol>
          </div>
        </div>

        {/* Problem 3 */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white m-0">
              التكلفة أعلى من المتوقع
            </h4>
          </div>
          
          <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
            <p><strong>الأسباب المحتملة:</strong></p>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>استخدام مفرط للنماذج</li>
              <li>عدم تفعيل التخزين المؤقت (Caching)</li>
              <li>استخدام نماذج مكلفة لمهام بسيطة</li>
            </ul>
            
            <p className="mt-3"><strong>الحلول:</strong></p>
            <ol className="list-decimal list-inside space-y-1 mr-4">
              <li>فعّل التخزين المؤقت للاستجابات المتكررة</li>
              <li>استخدم نماذج أقل تكلفة للمهام البسيطة</li>
              <li>ضع حدود للميزانية اليومية</li>
              <li>راجع قواعد الأتمتة لتقليل الاستخدام غير الضروري</li>
            </ol>
          </div>
        </div>

        {/* Problem 4 */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white m-0">
              خطأ في تعقيم البيانات الطبية
            </h4>
          </div>
          
          <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
            <p><strong>الأسباب المحتملة:</strong></p>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>تعطيل خاصية التعقيم التلقائي</li>
              <li>بيانات بصيغة غير مدعومة</li>
            </ul>
            
            <p className="mt-3"><strong>الحلول:</strong></p>
            <ol className="list-decimal list-inside space-y-1 mr-4">
              <li>تأكد من تفعيل PHI Sanitization في الإعدادات</li>
              <li>راجع سجل الأمان للتحقق من العمليات</li>
              <li>تواصل مع فريق الأمان فوراً</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 border-r-4 border-green-600 p-4 rounded-lg mt-6">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
          <div>
            <h5 className="font-semibold text-green-900 dark:text-green-100 mb-2">
              لم تجد حلاً لمشكلتك؟
            </h5>
            <p className="text-green-800 dark:text-green-200 text-sm">
              تواصل مع فريق الدعم الفني عبر البريد الإلكتروني: support@maiscompany.com
              <br />
              أو اتصل على: 800-123-4567 (متاح 24/7)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// API Reference Content
export function APIReferenceContent() {
  return (
    <div className="prose dark:prose-invert max-w-none" dir="rtl">
      <h3 className="text-2xl font-bold mb-4">مرجع API</h3>
      
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        يوفر مركز التحكم بالذكاء الاصطناعي واجهات برمجية (APIs) للتكامل مع الأنظمة الخارجية.
      </p>

      <h4 className="text-xl font-semibold mt-6 mb-3">نقاط النهاية الرئيسية:</h4>

      {/* Endpoint 1 */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-mono rounded">
            GET
          </span>
          <code className="text-sm font-mono text-gray-900 dark:text-white">/api/ai-control/status</code>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          الحصول على حالة النظام وجميع النماذج
        </p>
        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-xs font-mono overflow-x-auto">
          <pre className="text-gray-800 dark:text-gray-200">{`{
  "systemHealth": "healthy",
  "models": [
    {
      "model_id": "gemini-pro",
      "status": "active",
      "avg_confidence": 0.87
    }
  ]
}`}</pre>
        </div>
      </div>

      {/* Endpoint 2 */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-mono rounded">
            GET
          </span>
          <code className="text-sm font-mono text-gray-900 dark:text-white">/api/ai-control/logs</code>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          استرجاع سجلات العمليات مع إمكانية التصفية
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          <strong>Query Parameters:</strong> page, page_size, model_name, start_date, end_date, min_confidence
        </p>
        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-xs font-mono overflow-x-auto">
          <pre className="text-gray-800 dark:text-gray-200">{`{
  "logs": [...],
  "total": 1250,
  "page": 1,
  "page_size": 50
}`}</pre>
        </div>
      </div>

      {/* Endpoint 3 */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-mono rounded">
            POST
          </span>
          <code className="text-sm font-mono text-gray-900 dark:text-white">/api/ai-control/alerts</code>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          إنشاء قاعدة تنبيه جديدة
        </p>
        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-xs font-mono overflow-x-auto">
          <pre className="text-gray-800 dark:text-gray-200">{`{
  "name": "Low Confidence Alert",
  "trigger": "confidence_threshold",
  "threshold": 0.7,
  "action": "send_email"
}`}</pre>
        </div>
      </div>

      {/* Endpoint 4 */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs font-mono rounded">
            PUT
          </span>
          <code className="text-sm font-mono text-gray-900 dark:text-white">/api/ai-control/settings</code>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          تحديث إعدادات النظام
        </p>
        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-xs font-mono overflow-x-auto">
          <pre className="text-gray-800 dark:text-gray-200">{`{
  "phi_sanitization_enabled": true,
  "confidence_threshold": 0.75,
  "rate_limit": 60
}`}</pre>
        </div>
      </div>

      <h4 className="text-xl font-semibold mt-6 mb-3">المصادقة (Authentication):</h4>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 border-r-4 border-blue-600 p-4 rounded-lg">
        <p className="text-blue-900 dark:text-blue-100 text-sm mb-2">
          جميع الطلبات تتطلب رمز API صالح في الرأس:
        </p>
        <code className="text-xs bg-white dark:bg-gray-900 px-2 py-1 rounded block">
          Authorization: Bearer YOUR_API_KEY
        </code>
      </div>

      <h4 className="text-xl font-semibold mt-6 mb-3">معدلات الحد (Rate Limits):</h4>
      
      <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
        <li>• <strong>Standard:</strong> 100 طلب/دقيقة</li>
        <li>• <strong>Premium:</strong> 500 طلب/دقيقة</li>
        <li>• <strong>Enterprise:</strong> غير محدود</li>
      </ul>

      <h4 className="text-xl font-semibold mt-6 mb-3">أكواد الاستجابة:</h4>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-mono rounded">200</span>
          <span className="text-gray-700 dark:text-gray-300">نجاح العملية</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 font-mono rounded">400</span>
          <span className="text-gray-700 dark:text-gray-300">خطأ في البيانات المرسلة</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-mono rounded">401</span>
          <span className="text-gray-700 dark:text-gray-300">غير مصرح (رمز API غير صالح)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-mono rounded">429</span>
          <span className="text-gray-700 dark:text-gray-300">تجاوز معدل الطلبات</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-mono rounded">500</span>
          <span className="text-gray-700 dark:text-gray-300">خطأ في الخادم</span>
        </div>
      </div>
    </div>
  );
}
