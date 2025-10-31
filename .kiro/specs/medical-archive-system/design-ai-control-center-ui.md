# AI Control Center - UI/UX Design Specification

## Page Structure

### Route
- **Path**: `/ai-control-center` or `/admin/ai-maisco`
- **Access**: Requires `AI_ADMIN` or `ADMIN` role
- **Layout**: Full-page dashboard with sidebar navigation

## Component Hierarchy

```
AIControlCenterPage
├── AIControlHeader
│   ├── PageTitle ("AI Mais Co.")
│   ├── StatusIndicator (System Health)
│   ├── RefreshButton
│   └── UserMenu
├── AIControlSidebar
│   ├── NavigationMenu
│   │   ├── Overview (Dashboard)
│   │   ├── Audit Logs
│   │   ├── Settings
│   │   ├── Automation
│   │   └── Diagnostics
│   └── QuickStats
├── AIControlMainContent
│   ├── [Dynamic Content Based on Route]
│   └── LoadingStates
├── FloatingHelpButton (أيقونة عائمة)
└── HelpModal (نافذة منبثقة)
```

## Floating Help Button & Modal Design

### Floating Help Button

```typescript
// components/ai-control/FloatingHelpButton.tsx
import { HelpCircle, X } from 'lucide-react';
import { useState } from 'react';

export function FloatingHelpButton() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 
                   rounded-full shadow-lg hover:shadow-xl transition-all duration-300 
                   hover:scale-110 flex items-center justify-center group"
        aria-label="Open Help Guide"
      >
        <HelpCircle className="w-7 h-7 text-white" />
        
        {/* Tooltip */}
        <span className="absolute right-16 bg-gray-900 text-white px-3 py-1 rounded-md text-sm
                         opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          دليل الإعداد والمساعدة
        </span>
        
        {/* Pulse Animation */}
        <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20"></span>
      </button>
      
      {/* Help Modal */}
      {isOpen && <HelpModal onClose={() => setIsOpen(false)} />}
    </>
  );
}
```

### Help Modal Component

```typescript
// components/ai-control/HelpModal.tsx
import { X, Book, Settings, Shield, Zap, AlertTriangle, Download } from 'lucide-react';
import { useState } from 'react';

interface HelpSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export function HelpModal({ onClose }: { onClose: () => void }) {
  const [activeSection, setActiveSection] = useState('getting-started');
  
  const sections: HelpSection[] = [
    {
      id: 'getting-started',
      title: 'البدء السريع',
      icon: <Zap className="w-5 h-5" />,
      content: <GettingStartedContent />
    },
    {
      id: 'configuration',
      title: 'إعداد النماذج',
      icon: <Settings className="w-5 h-5" />,
      content: <ConfigurationContent />
    },
    {
      id: 'security',
      title: 'الأمان والخصوصية',
      icon: <Shield className="w-5 h-5" />,
      content: <SecurityContent />
    },
    {
      id: 'automation',
      title: 'قواعد الأتمتة',
      icon: <Zap className="w-5 h-5" />,
      content: <AutomationContent />
    },
    {
      id: 'troubleshooting',
      title: 'حل المشكلات',
      icon: <AlertTriangle className="w-5 h-5" />,
      content: <TroubleshootingContent />
    },
    {
      id: 'api-reference',
      title: 'مرجع API',
      icon: <Book className="w-5 h-5" />,
      content: <APIReferenceContent />
    }
  ];
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      {/* Modal Container */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] 
                      flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg 
                            flex items-center justify-center">
              <Book className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                دليل مركز التحكم بالذكاء الاصطناعي
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                AI Mais Co. - Administrator Guide
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <nav className="p-4 space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-right
                    ${activeSection === section.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                >
                  {section.icon}
                  <span className="font-medium">{section.title}</span>
                </button>
              ))}
            </nav>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {sections.find(s => s.id === activeSection)?.content}
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            آخر تحديث: {new Date().toLocaleDateString('ar-SA')}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            تحميل الدليل الكامل PDF
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Help Content Sections

```typescript
// Getting Started Content
function GettingStartedContent() {
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
function ConfigurationContent() {
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
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead>
          <tr>
            <th className="px-4 py-2 text-right">المعيار</th>
            <th className="px-4 py-2 text-right">القيمة الافتراضية</th>
            <th className="px-4 py-2 text-right">الوصف</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          <tr>
            <td className="px-4 py-2">معدل الاستدعاء</td>
            <td className="px-4 py-2">60 طلب/دقيقة</td>
            <td className="px-4 py-2">الحد الأقصى للطلبات في الدقيقة</td>
          </tr>
          <tr>
            <td className="px-4 py-2">زمن التنفيذ</td>
            <td className="px-4 py-2">30 ثانية</td>
            <td className="px-4 py-2">الحد الأقصى لزمن انتظار الاستجابة</td>
          </tr>
          <tr>
            <td className="px-4 py-2">عتبة الثقة</td>
            <td className="px-4 py-2">0.75</td>
            <td className="px-4 py-2">الحد الأدنى للثقة لاتخاذ قرار تلقائي</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// Security Content
function SecurityContent() {
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
          <Shield className="w-5 h-5 text-green-600 mt-1" />
          <div>
            <strong>تعقيم تلقائي للبيانات:</strong>
            <p className="text-gray-600 dark:text-gray-400">إزالة الأسماء، أرقام الهوية، تواريخ الميلاد، وأي معلومات تعريفية</p>
          </div>
        </li>
        
        <li className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-green-600 mt-1" />
          <div>
            <strong>تشفير النقل:</strong>
            <p className="text-gray-600 dark:text-gray-400">TLS 1.3 لجميع الاتصالات الخارجية</p>
          </div>
        </li>
        
        <li className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-green-600 mt-1" />
          <div>
            <strong>تشفير التخزين:</strong>
            <p className="text-gray-600 dark:text-gray-400">AES-256 للبيانات الحساسة في قاعدة البيانات</p>
          </div>
        </li>
        
        <li className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-green-600 mt-1" />
          <div>
            <strong>سجل تدقيق شامل:</strong>
            <p className="text-gray-600 dark:text-gray-400">تسجيل جميع العمليات مع معلومات المستخدم والوقت</p>
          </div>
        </li>
      </ul>
      
      <h4 className="text-xl font-semibold mt-6 mb-3">الأدوار والصلاحيات:</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h5 className="font-semibold mb-2">AI_ADMIN</h5>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            تحكم كامل في جميع الإعدادات والسجلات
          </p>
        </div>
        
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h5 className="font-semibold mb-2">AI_OPERATOR</h5>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            عرض وتشغيل الفحوصات بدون تغيير الإعدادات
          </p>
        </div>
        
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h5 className="font-semibold mb-2">AI_AUDITOR</h5>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            عرض وتصدير السجلات فقط
          </p>
        </div>
      </div>
    </div>
  );
}
```

## Dashboard Layout (Desktop)

```
┌─────────────────────────────────────────────────────────────────┐
│  AI Mais Co.  [🟢 Healthy]              [🔄 Refresh]  [👤 User] │
├──────────┬──────────────────────────────────────────────────────┤
│          │  📊 Overview Dashboard                               │
│ Overview │  ┌──────────┬──────────┬──────────┬──────────┐      │
│ ────────>│  │ Health   │Throughput│Avg Conf  │ Cost     │      │
│ Audit    │  │  🟢 98%  │ 1.2K/day │  0.87    │ $12.45   │      │
│ Settings │  └──────────┴──────────┴──────────┴──────────┘      │
│ Automate │                                                       │
│ Diagnose │  📈 Model Status                                     │
│          │  ┌─────────────────────────────────────────────┐    │
│          │  │ Model Name    │ Status │ Conf │ Resp Time  │    │
│          │  ├─────────────────────────────────────────────┤    │
│          │  │ doc-classifier│  🟢    │ 0.89 │   120ms    │    │
│          │  │ ocr-extractor │  🟢    │ 0.82 │   340ms    │    │
│          │  │ medical-nlp   │  🟡    │ 0.71 │   890ms    │    │
│          │  └─────────────────────────────────────────────┘    │
│          │                                                       │
│          │  📉 Performance Charts                               │
│          │  [Response Time Graph] [Confidence Graph]            │
│          │                                                       │
└──────────┴──────────────────────────────────────────────────────┘
                                                    [❓] ← Floating Help
```

## Mobile Layout

```
┌─────────────────────────┐
│ ☰  AI Mais Co.  [👤]   │
├─────────────────────────┤
│ 🟢 System Healthy       │
│                         │
│ ┌─────────────────────┐ │
│ │ Health      98%     │ │
│ │ Throughput  1.2K    │ │
│ │ Avg Conf    0.87    │ │
│ │ Cost        $12.45  │ │
│ └─────────────────────┘ │
│                         │
│ 📊 Models (3)           │
│ ┌─────────────────────┐ │
│ │ doc-classifier  🟢  │ │
│ │ Conf: 0.89          │ │
│ │ [View Details]      │ │
│ └─────────────────────┘ │
│                         │
│ [Swipe for more →]      │
│                         │
└─────────────────────────┘
              [❓] ← Floating
```

## Color Scheme & Visual Design

### Status Colors
- 🟢 **Healthy/Active**: `bg-green-500` - Confidence > 0.8, Response < 500ms
- 🟡 **Warning**: `bg-yellow-500` - Confidence 0.6-0.8, Response 500-1000ms
- 🔴 **Critical**: `bg-red-500` - Confidence < 0.6, Response > 1000ms
- ⚫ **Inactive**: `bg-gray-400` - Model disabled

### Theme Support
- **Light Mode**: Clean white backgrounds with subtle shadows
- **Dark Mode**: Dark gray backgrounds (#1a1a1a) with blue accents
- **Auto Mode**: Follows system preference

### Typography
- **Headings**: Inter font, bold weights
- **Body**: Inter font, regular weight
- **Code**: JetBrains Mono, monospace
- **Arabic**: Support for RTL layout with proper font rendering

## Animations & Interactions

### Loading States
```typescript
// Skeleton loader for dashboard cards
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
</div>
```

### Transitions
- Page transitions: 300ms ease-in-out
- Modal animations: fade-in + zoom-in
- Hover effects: 200ms ease
- Button clicks: scale(0.95) feedback

### Real-time Updates
- WebSocket connection for live data
- Fallback to 60-second polling
- Visual indicator when data refreshes
- Smooth chart animations on data update

## Accessibility

- **ARIA Labels**: All interactive elements
- **Keyboard Navigation**: Full support with visible focus indicators
- **Screen Reader**: Semantic HTML and ARIA descriptions
- **Color Contrast**: WCAG AA compliant (4.5:1 minimum)
- **RTL Support**: Proper Arabic text rendering and layout

## Responsive Breakpoints

```typescript
const breakpoints = {
  mobile: '0-767px',
  tablet: '768px-1023px',
  desktop: '1024px-1439px',
  wide: '1440px+'
};
```

## Performance Targets

- **Initial Load**: < 2 seconds
- **Time to Interactive**: < 3 seconds
- **Dashboard Refresh**: < 500ms
- **Chart Rendering**: < 200ms
- **Modal Open**: < 100ms
