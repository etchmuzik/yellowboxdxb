import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  DollarSign, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Upload,
  Calendar,
  User
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getExpensesByRider } from '@/services/expenseService';
import { getRiderById } from '@/services/riderService';
import { formatCurrency } from '@/utils/dataUtils';
import { format } from 'date-fns';
import { SpendEvent, Rider } from '@/types';
import { DocumentUploadCard } from '@/components/documents/DocumentUploadCard';
import { ExpenseHistoryList } from '@/components/expenses/ExpenseHistoryList';
import { ProfileInformation } from '@/components/riders/ProfileInformation';

export default function RiderDashboard() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch rider data
  const { data: rider, isLoading: riderLoading } = useQuery<Rider | null>({
    queryKey: ['rider', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;
      // For riders, their user ID is their rider ID
      return getRiderById(currentUser.id);
    },
    enabled: !!currentUser?.id,
  });

  // Fetch rider expenses
  const { data: expenses = [], isLoading: expensesLoading } = useQuery<SpendEvent[]>({
    queryKey: ['expenses', 'rider', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      return getExpensesByRider(currentUser.id);
    },
    enabled: !!currentUser?.id,
  });

  const isLoading = riderLoading || expensesLoading;

  // Calculate expense statistics
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amountAed, 0);
  const approvedExpenses = expenses.filter(exp => exp.status === 'approved');
  const pendingExpenses = expenses.filter(exp => exp.status === 'pending');
  const rejectedExpenses = expenses.filter(exp => exp.status === 'rejected');

  const totalApproved = approvedExpenses.reduce((sum, exp) => sum + exp.amountAed, 0);
  const totalPending = pendingExpenses.reduce((sum, exp) => sum + exp.amountAed, 0);

  // Get stage color based on application stage
  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'Applied': 'bg-gray-100 text-gray-800',
      'Docs Verified': 'bg-blue-100 text-blue-800',
      'Theory Test': 'bg-yellow-100 text-yellow-800',
      'Road Test': 'bg-orange-100 text-orange-800',
      'Medical': 'bg-purple-100 text-purple-800',
      'ID Issued': 'bg-green-100 text-green-800',
      'Active': 'bg-green-500 text-white'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!rider) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Profile Not Found</h2>
          <p className="text-muted-foreground">
            Your rider profile could not be found. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {rider.fullName}</h1>
          <p className="text-muted-foreground">Rider ID: {rider.id}</p>
          <Badge className={`mt-2 ${getStageColor(rider.applicationStage)}`}>
            {rider.applicationStage}
          </Badge>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Join Date</p>
          <p className="font-medium">{format(new Date(rider.joinDate), 'dd MMM yyyy')}</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              {expenses.length} total submissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalApproved)}</div>
            <p className="text-xs text-muted-foreground">
              {approvedExpenses.length} expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPending)}</div>
            <p className="text-xs text-muted-foreground">
              {pendingExpenses.length} awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rider.documents?.filter(doc => doc.status === 'Valid').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Valid documents
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingExpenses.length > 0 && (
                <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">
                        You have {pendingExpenses.length} pending expense{pendingExpenses.length > 1 ? 's' : ''} awaiting approval
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Total amount: {formatCurrency(totalPending)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Test Status */}
              <div className="space-y-3">
                <h4 className="font-medium">Test Status</h4>
                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Theory Test</span>
                    <Badge variant={rider.testStatus.theory === 'Pass' ? 'default' : 'secondary'}>
                      {rider.testStatus.theory}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Road Test</span>
                    <Badge variant={rider.testStatus.road === 'Pass' ? 'default' : 'secondary'}>
                      {rider.testStatus.road}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Medical Test</span>
                    <Badge variant={rider.testStatus.medical === 'Pass' ? 'default' : 'secondary'}>
                      {rider.testStatus.medical}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
              <Button variant="outline" size="sm">
                <DollarSign className="mr-2 h-4 w-4" />
                Submit Expense
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                View Schedule
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expense History</CardTitle>
            </CardHeader>
            <CardContent>
              <ExpenseHistoryList expenses={expenses} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {['Visa', 'Driver License', 'Medical Certificate', 'Insurance', 'Residency ID'].map((docType) => (
              <DocumentUploadCard
                key={docType}
                documentType={docType}
                riderId={rider.id}
                currentDocument={rider.documents?.find(doc => doc.type === docType)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileInformation rider={rider} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}