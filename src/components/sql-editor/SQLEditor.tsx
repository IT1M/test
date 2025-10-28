'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Save, 
  Download, 
  History, 
  Database, 
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Lock
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface QueryResult {
  id: string;
  query: string;
  result?: any[];
  error?: string;
  executionTime: number;
  timestamp: Date;
  rowCount?: number;
  status: 'success' | 'error' | 'running';
}

interface TableInfo {
  name: string;
  schema: string;
  type: 'table' | 'view';
  rowCount?: number;
  rlsEnabled?: boolean;
  policies?: RLSPolicy[];
}

interface RLSPolicy {
  name: string;
  command: string;
  roles: string[];
  expression: string;
  enabled: boolean;
}

export default function SQLEditor() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<QueryResult[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('editor');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load initial data
  useEffect(() => {
    loadTables();
    loadQueryHistory();
  }, []);

  const loadTables = async () => {
    try {
      const response = await fetch('/api/sql-editor/tables');
      const data = await response.json();
      setTables(data.tables || []);
    } catch (error) {
      console.error('Error loading tables:', error);
      toast.error('فشل في تحميل الجداول');
    }
  };

  const loadQueryHistory = async () => {
    try {
      const response = await fetch('/api/sql-editor/history');
      const data = await response.json();
      setQueryHistory(data.history || []);
    } catch (error) {
      console.error('Error loading query history:', error);
    }
  };

  const executeQuery = async () => {
    if (!query.trim()) {
      toast.error('يرجى إدخال استعلام SQL');
      return;
    }

    setIsExecuting(true);
    const startTime = Date.now();
    const queryId = Date.now().toString();

    const newResult: QueryResult = {
      id: queryId,
      query: query.trim(),
      executionTime: 0,
      timestamp: new Date(),
      status: 'running'
    };

    setResults(prev => [newResult, ...prev]);

    try {
      const response = await fetch('/api/sql-editor/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data = await response.json();
      const executionTime = Date.now() - startTime;

      if (data.success) {
        setResults(prev => prev.map(r => 
          r.id === queryId 
            ? {
                ...r,
                result: data.result,
                executionTime,
                rowCount: data.rowCount,
                status: 'success'
              }
            : r
        ));
        
        // Add to history
        setQueryHistory(prev => {
          const newHistory = [query.trim(), ...prev.filter(q => q !== query.trim())];
          return newHistory.slice(0, 50); // Keep last 50 queries
        });
        
        toast.success(`تم تنفيذ الاستعلام بنجاح (${executionTime}ms)`);
      } else {
        setResults(prev => prev.map(r => 
          r.id === queryId 
            ? {
                ...r,
                error: data.error,
                executionTime,
                status: 'error'
              }
            : r
        ));
        toast.error('خطأ في تنفيذ الاستعلام');
      }
    } catch (error) {
      const executionTime = Date.now() - startTime;
      setResults(prev => prev.map(r => 
        r.id === queryId 
          ? {
              ...r,
              error: 'خطأ في الاتصال بالخادم',
              executionTime,
              status: 'error'
            }
          : r
      ));
      toast.error('خطأ في الاتصال بالخادم');
    } finally {
      setIsExecuting(false);
    }
  };

  const enableRLS = async (tableName: string) => {
    try {
      const response = await fetch('/api/sql-editor/rls/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tableName }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`تم تفعيل RLS للجدول ${tableName}`);
        loadTables(); // Refresh table info
      } else {
        toast.error(data.error || 'فشل في تفعيل RLS');
      }
    } catch (error) {
      toast.error('خطأ في تفعيل RLS');
    }
  };

  const createRLSPolicy = async (tableName: string, policyName: string, command: string, expression: string) => {
    try {
      const response = await fetch('/api/sql-editor/rls/policy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          tableName, 
          policyName, 
          command, 
          expression 
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`تم إنشاء سياسة RLS: ${policyName}`);
        loadTables(); // Refresh table info
      } else {
        toast.error(data.error || 'فشل في إنشاء سياسة RLS');
      }
    } catch (error) {
      toast.error('خطأ في إنشاء سياسة RLS');
    }
  };

  const insertSampleQuery = (queryType: string) => {
    const queries = {
      select: 'SELECT * FROM "InventoryItem" LIMIT 10;',
      users: 'SELECT id, email, name, role, "isActive" FROM "User" ORDER BY "createdAt" DESC;',
      audit: 'SELECT * FROM "AuditLog" ORDER BY timestamp DESC LIMIT 20;',
      rls_enable: 'ALTER TABLE "InventoryItem" ENABLE ROW LEVEL SECURITY;',
      rls_policy: `CREATE POLICY user_inventory_policy ON "InventoryItem"
    FOR ALL TO authenticated
    USING ("enteredById" = auth.uid());`,
      backup: 'SELECT table_name, pg_size_pretty(pg_total_relation_size(schemaname||\'."\'||tablename||\'"\')) as size FROM pg_tables WHERE schemaname = \'public\';'
    };
    
    setQuery(queries[queryType as keyof typeof queries] || '');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const formatResult = (result: any[]) => {
    if (!result || result.length === 0) return null;
    
    const columns = Object.keys(result[0]);
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 dark:border-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-4 py-2 text-right text-sm font-medium text-gray-900 dark:text-gray-100 border-b">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.slice(0, 100).map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                {columns.map((col) => (
                  <td key={col} className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-b">
                    {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col] || '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {result.length > 100 && (
          <p className="text-sm text-gray-500 mt-2 text-center">
            عرض أول 100 صف من {result.length} صف
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Database className="h-8 w-8" />
          محرر SQL المتقدم
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadTables}>
            <Database className="h-4 w-4 mr-2" />
            تحديث الجداول
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="editor">محرر SQL</TabsTrigger>
          <TabsTrigger value="tables">الجداول</TabsTrigger>
          <TabsTrigger value="rls">أمان RLS</TabsTrigger>
          <TabsTrigger value="history">السجل</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                محرر الاستعلامات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Query Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => insertSampleQuery('select')}>
                  استعلام أساسي
                </Button>
                <Button variant="outline" size="sm" onClick={() => insertSampleQuery('users')}>
                  المستخدمين
                </Button>
                <Button variant="outline" size="sm" onClick={() => insertSampleQuery('audit')}>
                  سجل التدقيق
                </Button>
                <Button variant="outline" size="sm" onClick={() => insertSampleQuery('rls_enable')}>
                  تفعيل RLS
                </Button>
                <Button variant="outline" size="sm" onClick={() => insertSampleQuery('rls_policy')}>
                  سياسة RLS
                </Button>
                <Button variant="outline" size="sm" onClick={() => insertSampleQuery('backup')}>
                  معلومات النسخ الاحتياطي
                </Button>
              </div>

              {/* SQL Editor */}
              <div className="space-y-2">
                <textarea
                  ref={textareaRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="أدخل استعلام SQL هنا..."
                  className="w-full h-40 p-3 border rounded-md font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  dir="ltr"
                />
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button 
                      onClick={executeQuery} 
                      disabled={isExecuting || !query.trim()}
                      className="flex items-center gap-2"
                    >
                      {isExecuting ? (
                        <Clock className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      {isExecuting ? 'جاري التنفيذ...' : 'تنفيذ'}
                    </Button>
                    <Button variant="outline" onClick={() => setQuery('')}>
                      مسح
                    </Button>
                  </div>
                  <div className="text-sm text-gray-500">
                    {query.length} حرف
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            {results.map((result) => (
              <Card key={result.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {result.status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                      {result.status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                      {result.status === 'running' && <Clock className="h-5 w-5 text-blue-500 animate-spin" />}
                      <span className="font-medium">
                        {result.timestamp.toLocaleString('ar-SA')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                        {result.executionTime}ms
                      </Badge>
                      {result.rowCount !== undefined && (
                        <Badge variant="outline">
                          {result.rowCount} صف
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-sm" dir="ltr">
                      {result.query}
                    </div>
                    
                    {result.error && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded">
                        <p className="text-red-700 dark:text-red-300 text-sm">{result.error}</p>
                      </div>
                    )}
                    
                    {result.result && formatResult(result.result)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                جداول قاعدة البيانات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {tables.map((table) => (
                  <div key={table.name} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{table.name}</h3>
                        <Badge variant={table.type === 'table' ? 'default' : 'secondary'}>
                          {table.type}
                        </Badge>
                        {table.rlsEnabled && (
                          <Badge variant="outline" className="text-green-600">
                            <Shield className="h-3 w-3 mr-1" />
                            RLS مفعل
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => insertSampleQuery('select')}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          عرض
                        </Button>
                        {!table.rlsEnabled && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => enableRLS(table.name)}
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            تفعيل RLS
                          </Button>
                        )}
                      </div>
                    </div>
                    {table.rowCount !== undefined && (
                      <p className="text-sm text-gray-600">
                        عدد الصفوف: {table.rowCount.toLocaleString('ar-SA')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                إدارة أمان مستوى الصفوف (RLS)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    حول أمان مستوى الصفوف (RLS)
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    RLS يسمح بتحديد سياسات أمان على مستوى الصفوف في الجداول، مما يضمن أن المستخدمين يمكنهم الوصول فقط للبيانات المخولين لها.
                  </p>
                </div>

                {/* RLS Status for each table */}
                <div className="space-y-4">
                  <h4 className="font-medium">حالة RLS للجداول:</h4>
                  {tables.filter(t => t.type === 'table').map((table) => (
                    <div key={table.name} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium">{table.name}</h5>
                          {table.rlsEnabled ? (
                            <Badge className="bg-green-100 text-green-800">
                              <Lock className="h-3 w-3 mr-1" />
                              مفعل
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-600">
                              غير مفعل
                            </Badge>
                          )}
                        </div>
                        {!table.rlsEnabled && (
                          <Button 
                            size="sm"
                            onClick={() => enableRLS(table.name)}
                          >
                            تفعيل RLS
                          </Button>
                        )}
                      </div>
                      
                      {table.policies && table.policies.length > 0 && (
                        <div className="space-y-2">
                          <h6 className="text-sm font-medium">السياسات المطبقة:</h6>
                          {table.policies.map((policy) => (
                            <div key={policy.name} className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">{policy.name}</span>
                                <Badge variant={policy.enabled ? 'default' : 'secondary'}>
                                  {policy.enabled ? 'مفعل' : 'معطل'}
                                </Badge>
                              </div>
                              <p className="text-gray-600 dark:text-gray-400">
                                الأمر: {policy.command} | الأدوار: {policy.roles.join(', ')}
                              </p>
                              <code className="text-xs bg-gray-100 dark:bg-gray-700 p-1 rounded">
                                {policy.expression}
                              </code>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Quick RLS Setup */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">إعداد سريع لـ RLS:</h4>
                  <div className="grid gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => insertSampleQuery('rls_enable')}
                      className="justify-start"
                    >
                      تفعيل RLS لجدول المخزون
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => insertSampleQuery('rls_policy')}
                      className="justify-start"
                    >
                      إنشاء سياسة للمستخدمين المصرح لهم
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                سجل الاستعلامات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {queryHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">لا يوجد استعلامات في السجل</p>
                ) : (
                  queryHistory.map((historyQuery, index) => (
                    <div 
                      key={index}
                      className="border rounded p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => setQuery(historyQuery)}
                    >
                      <code className="text-sm" dir="ltr">{historyQuery}</code>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}