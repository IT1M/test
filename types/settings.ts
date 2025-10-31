// Settings Type Definitions

export type ThemeMode = 'light' | 'dark' | 'auto';
export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
export type GeminiModel = 'gemini-pro' | 'gemini-pro-vision';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'SAR' | 'AED';
export type FieldType = 'text' | 'number' | 'date' | 'dropdown' | 'textarea' | 'checkbox';

export interface GeneralSettings {
  theme: ThemeMode;
  dateFormat: DateFormat;
  language: string;
  timezone: string;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
}

export interface GeminiAPISettings {
  apiKey: string;
  model: GeminiModel;
  rateLimit: number; // requests per minute
  enableCaching: boolean;
  cacheExpiration: number; // minutes
}

export interface DataManagementSettings {
  autoSaveInterval: number; // seconds
  backupSchedule: 'daily' | 'weekly' | 'monthly' | 'manual';
  backupTime: string; // HH:mm format
  dataRetentionDays: number;
  enableAutoBackup: boolean;
}

export interface BusinessSettings {
  companyName: string;
  companyLogo?: string;
  primaryColor: string;
  secondaryColor: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  taxRate: number; // percentage
  currency: Currency;
  invoicePrefix: string;
  orderPrefix: string;
  quotationPrefix: string;
}

export interface PaymentTermsTemplate {
  id: string;
  name: string;
  days: number;
  description: string;
}

export interface InventorySettings {
  lowStockThreshold: number;
  expiryAlertDays: number;
  enableAutoReorder: boolean;
  autoReorderThreshold: number;
  defaultWarehouseLocation: string;
}

export interface NotificationSettings {
  emailNotifications: {
    lowStock: boolean;
    orderStatusChange: boolean;
    paymentReminders: boolean;
    expiryAlerts: boolean;
    newCustomer: boolean;
    systemAlerts: boolean;
  };
  emailRecipients: string[];
  notificationFrequency: 'realtime' | 'hourly' | 'daily';
}

export interface CustomField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[]; // for dropdown
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface CustomFieldsConfig {
  products: CustomField[];
  customers: CustomField[];
  orders: CustomField[];
  medicalRecords: CustomField[];
}

export interface ReportTemplate {
  id: string;
  name: string;
  type: 'invoice' | 'purchase_order' | 'delivery_note' | 'medical_report' | 'quotation';
  template: string; // HTML template with placeholders
  headerImage?: string;
  footerText?: string;
  includeCompanyLogo: boolean;
}

export interface SystemSettings {
  general: GeneralSettings;
  geminiAPI: GeminiAPISettings;
  dataManagement: DataManagementSettings;
  business: BusinessSettings;
  paymentTerms: PaymentTermsTemplate[];
  inventory: InventorySettings;
  notifications: NotificationSettings;
  customFields: CustomFieldsConfig;
  reportTemplates: ReportTemplate[];
  lastUpdated: Date;
  updatedBy: string;
}

// Default settings
export const defaultSettings: SystemSettings = {
  general: {
    theme: 'light',
    dateFormat: 'MM/DD/YYYY',
    language: 'en',
    timezone: 'UTC',
    notificationsEnabled: true,
    soundEnabled: true,
  },
  geminiAPI: {
    apiKey: '',
    model: 'gemini-pro',
    rateLimit: 60,
    enableCaching: true,
    cacheExpiration: 5,
  },
  dataManagement: {
    autoSaveInterval: 30,
    backupSchedule: 'daily',
    backupTime: '02:00',
    dataRetentionDays: 365,
    enableAutoBackup: true,
  },
  business: {
    companyName: 'Medical Products Company',
    primaryColor: '#3b82f6',
    secondaryColor: '#10b981',
    contactEmail: 'info@medicalproducts.com',
    contactPhone: '+1-234-567-8900',
    address: '123 Medical Street, Healthcare City',
    taxRate: 15,
    currency: 'USD',
    invoicePrefix: 'INV',
    orderPrefix: 'ORD',
    quotationPrefix: 'QUO',
  },
  paymentTerms: [
    { id: '1', name: 'Net 30', days: 30, description: 'Payment due within 30 days' },
    { id: '2', name: 'Net 60', days: 60, description: 'Payment due within 60 days' },
    { id: '3', name: 'Net 90', days: 90, description: 'Payment due within 90 days' },
    { id: '4', name: 'Due on Receipt', days: 0, description: 'Payment due immediately' },
  ],
  inventory: {
    lowStockThreshold: 10,
    expiryAlertDays: 90,
    enableAutoReorder: false,
    autoReorderThreshold: 5,
    defaultWarehouseLocation: 'Main Warehouse',
  },
  notifications: {
    emailNotifications: {
      lowStock: true,
      orderStatusChange: true,
      paymentReminders: true,
      expiryAlerts: true,
      newCustomer: false,
      systemAlerts: true,
    },
    emailRecipients: [],
    notificationFrequency: 'realtime',
  },
  customFields: {
    products: [],
    customers: [],
    orders: [],
    medicalRecords: [],
  },
  reportTemplates: [],
  lastUpdated: new Date(),
  updatedBy: 'system',
};
