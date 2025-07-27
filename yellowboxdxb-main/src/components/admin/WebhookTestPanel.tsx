import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { testWebhook, triggerSync } from '../../services/webhookService';
import { CheckCircle, XCircle, Loader2, Zap, Database, FileText, Users } from 'lucide-react';

interface TestResult {
  name: string;
  success: boolean;
  duration?: number;
  error?: string;
}

export const WebhookTestPanel: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const testCases = [
    {
      name: 'Basic Connectivity',
      icon: <Zap className="w-4 h-4" />,
      test: () => testWebhook()
    },
    {
      name: 'Rider Sync Test',
      icon: <Users className="w-4 h-4" />,
      test: () => triggerSync('rider', 'test-rider-123', 'created', {
        id: 'test-rider-123',
        name: 'Test Rider',
        email: 'test@example.com',
        phone: '+971501234567',
        status: 'Applied',
        createdAt: new Date().toISOString()
      })
    },
    {
      name: 'Expense Sync Test',
      icon: <Database className="w-4 h-4" />,
      test: () => triggerSync('expense', 'test-expense-456', 'created', {
        id: 'test-expense-456',
        riderId: 'test-rider-123',
        amount: 100,
        category: 'Fuel',
        description: 'Test fuel expense',
        status: 'pending',
        createdAt: new Date().toISOString()
      })
    },
    {
      name: 'Document Sync Test',
      icon: <FileText className="w-4 h-4" />,
      test: () => triggerSync('document', 'test-document-789', 'created', {
        id: 'test-document-789',
        riderId: 'test-rider-123',
        type: 'Visa',
        status: 'Pending',
        fileName: 'test-visa.pdf',
        uploadDate: new Date().toISOString()
      })
    }
  ];

  const runAllTests = async () => {
    setTesting(true);
    setResults([]);
    
    const testResults: TestResult[] = [];
    
    for (const testCase of testCases) {
      try {
        const startTime = Date.now();
        await testCase.test();
        const duration = Date.now() - startTime;
        
        testResults.push({
          name: testCase.name,
          success: true,
          duration
        });
      } catch (error) {
        testResults.push({
          name: testCase.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      setResults([...testResults]);
      
      // Wait 500ms between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setTesting(false);
  };

  const runSingleTest = async (testCase: typeof testCases[0]) => {
    setTesting(true);
    
    try {
      const startTime = Date.now();
      await testCase.test();
      const duration = Date.now() - startTime;
      
      const newResult: TestResult = {
        name: testCase.name,
        success: true,
        duration
      };
      
      setResults(prev => {
        const filtered = prev.filter(r => r.name !== testCase.name);
        return [...filtered, newResult];
      });
    } catch (error) {
      const newResult: TestResult = {
        name: testCase.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      setResults(prev => {
        const filtered = prev.filter(r => r.name !== testCase.name);
        return [...filtered, newResult];
      });
    }
    
    setTesting(false);
  };

  const getResultForTest = (testName: string) => {
    return results.find(r => r.name === testName);
  };

  const successCount = results.filter(r => r.success).length;
  const totalTests = results.length;

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          N8N Webhook Testing Panel
        </CardTitle>
        <CardDescription>
          Test the connectivity and functionality of N8N webhook integration for real-time data synchronization.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Status */}
        {results.length > 0 && (
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              {successCount === totalTests ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <span className="font-medium">
                Test Results: {successCount}/{totalTests} passed
              </span>
            </div>
            <Badge variant={successCount === totalTests ? "default" : "destructive"}>
              {successCount === totalTests ? "All Tests Passed" : "Some Tests Failed"}
            </Badge>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={runAllTests} 
            disabled={testing}
            className="flex items-center gap-2"
          >
            {testing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            Run All Tests
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => setResults([])}
            disabled={testing || results.length === 0}
          >
            Clear Results
          </Button>
        </div>

        {/* Individual Test Cases */}
        <div className="grid gap-4 md:grid-cols-2">
          {testCases.map((testCase) => {
            const result = getResultForTest(testCase.name);
            
            return (
              <Card key={testCase.name} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {testCase.icon}
                      <span className="font-medium">{testCase.name}</span>
                    </div>
                    
                    {result && (
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        {result.duration && (
                          <Badge variant="outline" className="text-xs">
                            {result.duration}ms
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {result && (
                    <div className="mb-3">
                      {result.success ? (
                        <p className="text-sm text-green-600">
                          ✅ Test passed successfully
                        </p>
                      ) : (
                        <p className="text-sm text-red-600">
                          ❌ {result.error}
                        </p>
                      )}
                    </div>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runSingleTest(testCase)}
                    disabled={testing}
                    className="w-full"
                  >
                    {testing ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      "Test"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Connection Info */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Connection Information</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>Webhook URL:</strong> https://n8n.srv924607.hstgr.cloud/webhook/yellowbox-sync</p>
            <p><strong>Expected Response:</strong> 200 OK from N8N workflow</p>
            <p><strong>Timeout:</strong> 10 seconds</p>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">Troubleshooting</h4>
          <div className="text-sm text-yellow-700 space-y-1">
            <p>• Ensure N8N Cloud instance is accessible at n8n.srv924607.hstgr.cloud</p>
            <p>• Check that the Yellow Box workflows are imported and activated</p>
            <p>• Verify the webhook URL in the Real-time Data Sync workflow</p>
            <p>• Check browser console for detailed error messages</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};