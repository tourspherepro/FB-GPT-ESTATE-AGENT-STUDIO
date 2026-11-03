
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface EpcStandardGraphProps {
  currentValue: number;
  potentialValue: number;
}

const bands = [
  { label: 'A', text: '92+', color: 'bg-[#008051]', scoreColor: 'bg-[#20A976]', width: 'w-[40%]', min: 92, max: Infinity },
  { label: 'B', text: '81-91', color: 'bg-[#00a950]', scoreColor: 'bg-[#50C279]', width: 'w-[50%]', min: 81, max: 91 },
  { label: 'C', text: '69-80', color: 'bg-[#98ce4c]', scoreColor: 'bg-[#B4DA77]', width: 'w-[60%]', min: 69, max: 80 },
  { label: 'D', text: '55-68', color: 'bg-[#feee35]', scoreColor: 'bg-[#F9E66F]', width: 'w-[70%]', min: 55, max: 68 },
  { label: 'E', text: '39-54', color: 'bg-[#f4ac34]', scoreColor: 'bg-[#F2BD6A]', width: 'w-[80%]', min: 39, max: 54 },
  { label: 'F', text: '21-38', color: 'bg-[#ea672a]', scoreColor: 'bg-[#EF8A5C]', width: 'w-[90%]', min: 21, max: 38 },
  { label: 'G', text: '1-20', color: 'bg-[#de002c]', scoreColor: 'bg-[#E54D5A]', width: 'w-full', min: 1, max: 20 },
];

const getBandForScore = (score: number) => {
    return bands.find(b => score >= b.min && score <= b.max) ?? bands[bands.length - 1];
}

const EpcStandardGraph: React.FC<EpcStandardGraphProps> = ({ currentValue, potentialValue }) => {
  const currentBand = getBandForScore(currentValue);
  const potentialBand = getBandForScore(potentialValue);

  // Calculate vertical position (percentage from top)
  const getTopPosition = (score: number) => {
    if (score >= 92) return 100 - 97;
    if (score <= 1) return 100 - 3;
    // This is a linear interpolation between the top and bottom of the graph.
    // The graph area for scores is roughly from 3% (for score 1) to 97% (for score 100).
    const scoreRange = 100 - 1;
    const positionRange = 97 - 3;
    const position = 3 + ((score - 1) / scoreRange) * positionRange;
    return 100 - position;
  };

  const getArrowColor = (score: number) => {
    if (score >= 92) return 'bg-[#008051]'; // A
    if (score >= 81) return 'bg-[#00a950]'; // B
    if (score >= 69) return 'bg-[#98ce4c]'; // C
    if (score >= 55) return 'bg-[#feee35]'; // D
    if (score >= 39) return 'bg-[#f4ac34]'; // E
    if (score >= 21) return 'bg-[#ea672a]'; // F
    return 'bg-[#de002c]'; // G
  }
  
  const getArrowTextColor = (score: number) => {
    if (score >= 69 && score <= 80) return 'text-black'; // C
    if (score >= 55 && score <= 68) return 'text-black'; // D
    return 'text-white';
  }


  return (
    <div className="w-full font-sans border border-gray-400 p-1">
        <h3 className="text-sm font-bold text-center text-black mb-2">Energy Efficiency Rating</h3>
        <div className="grid grid-cols-[50px_1fr_120px]">
            {/* Header */}
            <div className="font-bold text-black border-b border-gray-400 text-xs text-center">Score</div>
            <div className="font-bold text-black border-b border-gray-400 text-xs">Energy rating</div>
            <div className="font-bold text-black border-b border-gray-400 grid grid-cols-2 text-center text-xs">
                <span>Current</span>
                <span>Potential</span>
            </div>

            {/* Chart Body */}
            <div className="col-start-1 col-span-1 row-start-2 row-span-7 flex flex-col gap-px">
                 {bands.map(({ text, scoreColor }) => (
                    <div key={text} className={cn("h-6 flex items-center justify-center text-xs text-black", scoreColor)}>{text}</div>
                ))}
            </div>
             <div className="col-start-2 col-span-1 row-start-2 row-span-7 flex flex-col gap-px">
                {bands.map(({ label, color, width }) => (
                    <div key={label} className={cn("h-6 flex items-center justify-end pr-1 text-black font-bold text-lg", color, width)}>
                       {label}
                    </div>
                ))}
            </div>
            <div className="col-start-3 col-span-1 row-start-2 row-span-7 relative">
                <div className="absolute w-full h-full">
                    <div className="relative h-full">
                         <div style={{ top: `${getTopPosition(potentialValue)}%`, transform: 'translateY(-50%)'}} className="absolute right-0 w-[50px] text-center">
                            <div className={cn("font-bold text-sm p-1 shadow-md flex items-center justify-center gap-1", getArrowColor(potentialValue), getArrowTextColor(potentialValue))}>
                                <div className={cn("w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent", `border-r-[6px] border-r-inherit`)} style={{borderColor: `transparent transparent transparent ${getArrowColor(potentialValue)}`}}></div>
                                <span className="flex-1">{potentialValue}</span>
                            </div>
                        </div>
                        <div style={{ top: `${getTopPosition(currentValue)}%`, transform: 'translateY(-50%)'}} className="absolute left-0 w-[50px] text-center">
                             <div className={cn("font-bold text-sm p-1 shadow-md flex items-center justify-center gap-1", getArrowColor(currentValue), getArrowTextColor(currentValue))}>
                                <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px]" style={{borderColor: `transparent ${getArrowColor(currentValue)} transparent transparent`}}></div>
                                <span className="flex-1">{currentValue}</span>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default EpcStandardGraph;
