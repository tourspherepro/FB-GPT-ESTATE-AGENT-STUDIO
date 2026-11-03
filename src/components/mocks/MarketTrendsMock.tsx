
import React from 'react';

const MarketTrendsMock = () => {
  return (
    <div className="w-full h-full bg-gray-100 rounded-xl p-4 flex flex-col gap-4 shadow-md">
        <div className="flex justify-between">
            <div className="h-6 w-24 bg-gray-200 rounded-md"></div>
            <div className="h-6 w-20 bg-gray-200 rounded-md"></div>
        </div>
        <div className="flex-1 bg-gray-200 rounded-md flex items-end p-2 gap-2">
            <div className="w-1/5 h-1/3 bg-gray-300 rounded-t-sm"></div>
            <div className="w-1/5 h-1/2 bg-gray-300 rounded-t-sm"></div>
            <div className="w-1/5 h-3/4 bg-gray-300 rounded-t-sm"></div>
            <div className="w-1/5 h-2/3 bg-gray-300 rounded-t-sm"></div>
            <div className="w-1/5 h-1/2 bg-gray-300 rounded-t-sm"></div>
        </div>
         <div className="flex justify-between">
            <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
            <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
            <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
            <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
        </div>
    </div>
  );
};

export default MarketTrendsMock;
