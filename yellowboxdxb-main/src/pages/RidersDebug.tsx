import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { simpleRiderService, SimpleRider } from "@/services/simpleFirebaseService";

const RidersDebug = () => {
  const [riders, setRiders] = useState<SimpleRider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRiders = async () => {
      try {
        console.log('🔄 [DEBUG] Starting to fetch riders...');
        setLoading(true);
        setError(null);
        
        const data = await simpleRiderService.getAll();
        console.log('✅ [DEBUG] Riders fetched successfully:', data.length, data);
        
        setRiders(data);
      } catch (error) {
        console.error('❌ [DEBUG] Error fetching riders:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoading(false);
        console.log('🏁 [DEBUG] Fetch completed');
      }
    };

    fetchRiders();
  }, []);

  console.log('🔍 [DEBUG] Current state:', { loading, ridersCount: riders.length, error });

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">🔧 Riders Debug Page</h1>
          <p className="text-muted-foreground">
            Debug version to test rider data loading
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          
          <div className="space-y-2 text-sm">
            <div>
              <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Error:</strong> {error || 'None'}
            </div>
            <div>
              <strong>Riders Count:</strong> {riders.length}
            </div>
            <div>
              <strong>Firebase Connected:</strong> {typeof simpleRiderService !== 'undefined' ? 'Yes' : 'No'}
            </div>
          </div>
        </div>

        {loading && (
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <p className="text-blue-800">🔄 Loading riders...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 p-6 rounded-lg border border-red-200">
            <p className="text-red-800">❌ Error: {error}</p>
          </div>
        )}

        {!loading && !error && riders.length === 0 && (
          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
            <p className="text-yellow-800">⚠️ No riders found in database</p>
          </div>
        )}

        {!loading && riders.length > 0 && (
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <h3 className="text-green-800 font-semibold mb-4">✅ Found {riders.length} riders:</h3>
            
            <div className="space-y-4">
              {riders.slice(0, 5).map((rider, index) => (
                <div key={rider.id} className="bg-white p-4 rounded border">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>#{index + 1} ID:</strong> {rider.id}</div>
                    <div><strong>Name:</strong> {rider.fullName}</div>
                    <div><strong>Email:</strong> {rider.email}</div>
                    <div><strong>Phone:</strong> {rider.phone}</div>
                    <div><strong>Nationality:</strong> {rider.nationality}</div>
                    <div><strong>Status:</strong> {rider.status}</div>
                    <div><strong>Created:</strong> {rider.createdAt?.toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
              
              {riders.length > 5 && (
                <div className="text-center text-gray-500">
                  ... and {riders.length - 5} more riders
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-gray-50 p-6 rounded-lg border">
          <h3 className="font-semibold mb-2">🔧 Troubleshooting Steps:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
            <li>Check browser console for JavaScript errors</li>
            <li>Verify Firebase configuration in .env file</li>
            <li>Ensure Firestore rules allow read access</li>
            <li>Check network tab for failed requests</li>
            <li>Verify the riders collection exists in Firestore</li>
          </ol>
        </div>
      </div>
    </Layout>
  );
};

export default RidersDebug;