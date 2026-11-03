

'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { getRatingColor, getRatingTextColor } from '@/lib/epcUtils';

interface EpcRatingChartProps {
  current: number;
  potential: number;
  currentRating: string;
  potentialRating: string;
}

const EpcRatingChart: React.FC<EpcRatingChartProps> = ({ current, potential, currentRating, potentialRating }) => {
  const chartData = [
    { name: 'Efficiency Score', current, potential }
  ];

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="w-full md:w-2/3 h-48">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis type="category" dataKey="name" hide />
                    <Tooltip 
                        cursor={{fill: 'transparent'}} 
                        contentStyle={{
                            background: 'rgba(30, 41, 59, 0.9)',
                            borderColor: '#334155',
                            borderRadius: '0.5rem',
                            color: '#f1f5f9'
                        }}
                    />
                    <Legend wrapperStyle={{paddingTop: '20px'}}/>
                    <Bar dataKey="potential" name="Potential" stackId="a" fill="#38bdf8" radius={[0, 8, 8, 0]} barSize={30} />
                    <Bar dataKey="current" name="Current" stackId="a" fill={getRatingColor(currentRating, true)} radius={[8, 0, 0, 8]} barSize={30} />
                </BarChart>
            </ResponsiveContainer>
        </div>
        <div className="w-full md:w-1/3 flex flex-row md:flex-col justify-around gap-4">
            <div className="text-center">
                <p className="text-sm text-muted-foreground">Current</p>
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center font-bold text-4xl mt-1 ${getRatingColor(currentRating)} ${getRatingTextColor(currentRating)}`}>
                    {currentRating}
                </div>
            </div>
             <div className="text-center">
                <p className="text-sm text-muted-foreground">Potential</p>
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center font-bold text-4xl mt-1 ${getRatingColor(potentialRating)} ${getRatingTextColor(potentialRating)}`}>
                    {potentialRating}
                </div>
            </div>
        </div>
    </div>
  );
};

export default EpcRatingChart;
