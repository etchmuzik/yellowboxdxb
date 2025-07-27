import React from 'react';

export const PageLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center space-y-4">
        {/* Yellow Box Logo/Icon */}
        <div className="w-16 h-16 bg-yellow-500 rounded-lg flex items-center justify-center">
          <div className="w-8 h-8 bg-black rounded-sm"></div>
        </div>
        
        {/* Loading Spinner */}
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
        
        {/* Loading Text */}
        <p className="text-sm text-muted-foreground animate-pulse">
          Loading Yellow Box...
        </p>
      </div>
    </div>
  );
};

export default PageLoader;