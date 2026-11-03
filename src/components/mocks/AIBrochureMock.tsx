
import React from 'react';

const AIBrochureMock = () => {
  return (
    <div className="w-full h-full bg-gray-100 rounded-xl p-4 flex gap-4 shadow-md">
      <div className="w-1/3 flex flex-col gap-3">
        <div className="h-6 w-full bg-gray-300 rounded-md"></div>
        <div className="h-4 w-full bg-gray-200 rounded-md"></div>
        <div className="h-4 w-2/3 bg-gray-200 rounded-md"></div>
        <div className="h-4 w-full bg-gray-200 rounded-md mt-4"></div>
        <div className="h-4 w-full bg-gray-200 rounded-md"></div>
        <div className="h-4 w-1/2 bg-gray-200 rounded-md"></div>
        <div className="mt-auto h-10 w-full bg-gray-300 rounded-md"></div>
      </div>
      <div className="w-2/3 bg-gray-200 rounded-lg flex items-center justify-center">
        <div className="w-3/4 h-5/6 bg-gray-300 rounded-md p-4 space-y-3">
            <div className="h-24 w-full bg-gray-200 rounded-md"></div>
            <div className="h-4 w-full bg-gray-200 rounded-md"></div>
            <div className="h-4 w-2/3 bg-gray-200 rounded-md"></div>
        </div>
      </div>
    </div>
  );
};

export default AIBrochureMock;
