
import React from 'react';

const SocialPostMock = () => {
  return (
    <div className="w-full h-full bg-gray-100 rounded-xl p-4 flex flex-col gap-3 shadow-md">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gray-300"></div>
        <div className="h-4 w-24 bg-gray-200 rounded-md"></div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-gray-200 rounded-md"></div>
        <div className="h-3 w-5/6 bg-gray-200 rounded-md"></div>
      </div>
      <div className="flex-1 bg-gray-200 rounded-md"></div>
      <div className="flex justify-between">
        <div className="h-6 w-6 bg-gray-300 rounded-md"></div>
        <div className="h-6 w-6 bg-gray-300 rounded-md"></div>
        <div className="h-6 w-6 bg-gray-300 rounded-md"></div>
      </div>
    </div>
  );
};

export default SocialPostMock;
