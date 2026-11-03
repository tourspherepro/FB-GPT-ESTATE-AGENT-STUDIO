
import React from 'react';

const EAValuationMock = () => {
  return (
    <div className="w-full h-full bg-gray-100 rounded-xl p-4 flex flex-col gap-3 shadow-md">
      <div className="h-6 w-1/3 bg-gray-200 rounded-md"></div>
      <div className="h-8 w-full bg-gray-200 rounded-md"></div>
      <div className="h-6 w-1/4 bg-gray-200 rounded-md"></div>
      <div className="h-8 w-full bg-gray-200 rounded-md"></div>
      <div className="flex gap-4 mt-2">
        <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 bg-gray-200 rounded-md"></div>
            <div className="h-4 w-full bg-gray-300 rounded-md"></div>
            <div className="h-4 w-full bg-gray-300 rounded-md"></div>
        </div>
        <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 bg-gray-200 rounded-md"></div>
            <div className="h-4 w-full bg-gray-300 rounded-md"></div>
            <div className="h-4 w-full bg-gray-300 rounded-md"></div>
        </div>
      </div>
      <div className="h-16 w-full bg-gray-200 rounded-md mt-2"></div>
      <div className="flex gap-4 mt-auto">
        <div className="h-10 flex-1 bg-gray-300 rounded-md"></div>
        <div className="h-10 flex-1 bg-gray-200 rounded-md"></div>
      </div>
    </div>
  );
};

export default EAValuationMock;
