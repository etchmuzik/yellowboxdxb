
import React from "react";
export const LoginHeader = () => {
  return <div className="text-center mb-8">
      <div className="flex items-center justify-center mb-4">
        <div className="h-14 w-14 bg-yellowbox-yellow rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-black font-bold text-2xl">YB</span>
        </div>
      </div>
      <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-yellow-500">
        Yellow Box
      </h1>
      <p className="text-muted-foreground mt-2 text-lg">
        Driver Spend Management System
      </p>
      <div className="mt-2 flex justify-center">
        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">YELLOW BOX DXB</span>
      </div>
    </div>;
};
