
import { useAuth } from "@/hooks/use-auth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { isRider, isFinance, isOperations, isAdmin, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Check if user wants to force landing page view
  const forceLanding = searchParams.get('landing') === 'true';

  useEffect(() => {
    // If user is authenticated and not forcing landing page, redirect to appropriate dashboard
    if (!loading && isAuthenticated && !forceLanding) {
      console.log('Index.tsx routing check:', {
        isAdmin: isAdmin(),
        isOperations: isOperations(),
        isFinance: isFinance(),
        isRider: isRider(),
        currentUser: currentUser
      });

      if (isAdmin()) {
        console.log('Redirecting to /admin');
        navigate('/admin');
      } else if (isOperations()) {
        console.log('Redirecting to /operations');
        navigate('/operations');
      } else if (isFinance()) {
        console.log('Redirecting to /finance');
        navigate('/finance');
      } else if (isRider()) {
        console.log('Redirecting to /rider');
        navigate('/rider');
      } else {
        console.log('No role match - user:', currentUser);
      }
    }
  }, [loading, isAuthenticated, isAdmin, isOperations, isFinance, isRider, navigate, forceLanding, currentUser]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show landing page for unauthenticated users OR when forcing landing view
  if (!isAuthenticated || forceLanding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="mb-8">
              <h1 className="text-5xl font-bold text-gray-900 mb-4">
                Yellow Box
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Fleet Management System for Dubai Delivery Riders
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto mb-12">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="text-3xl mb-4">🚴‍♂️</div>
                  <h3 className="text-lg font-semibold mb-2">Rider Management</h3>
                  <p className="text-gray-600">Complete lifecycle tracking from application to active delivery</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="text-3xl mb-4">📊</div>
                  <h3 className="text-lg font-semibold mb-2">Analytics & Reports</h3>
                  <p className="text-gray-600">Real-time insights and comprehensive reporting</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="text-3xl mb-4">🏍️</div>
                  <h3 className="text-lg font-semibold mb-2">Fleet Tracking</h3>
                  <p className="text-gray-600">GPS tracking and bike management system</p>
                </div>
              </div>
            </div>

            <div className="space-x-4">
              {isAuthenticated ? (
                <Button
                  onClick={() => {
                    if (isAdmin()) {
                      navigate('/admin');
                    } else if (isOperations()) {
                      navigate('/operations');
                    } else if (isFinance()) {
                      navigate('/finance');
                    } else if (isRider()) {
                      navigate('/rider');
                    }
                  }}
                  size="lg"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-3"
                >
                  Go to Dashboard
                </Button>
              ) : (
                <Button
                  onClick={() => navigate('/login')}
                  size="lg"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-3"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback loading state
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Welcome to Yellow Box</h2>
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
};

export default Index;
