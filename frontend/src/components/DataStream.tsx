'use client';

import { useState, useEffect } from 'react';

interface DataStreamProps {
  activeStep?: number;
  className?: string;
  customPool?: string[][];
}

const defaultPool = [
  [
    "> Analyzing Business Logic",
    "> Understanding User Flows",
    "> Finding Bottlenecks",
    "> Mapping Architecture",
    "> Creating Dependency Graph",
    "> Optimizing Data",
    "> Validating Inputs"
  ],
  [
    "> Building React Components",
    "> Creating UI Elements",
    "> Styling Interfaces",
    "> Managing State",
    "> Building Interactions",
    "> Rendering Layouts",
    "> Applying Brand Design"
  ],
  [
    "> Strengthening Security",
    "> Optimizing Database Queries",
    "> Improving Code Quality",
    "> Setting Up APIs",
    "> Compressing Assets",
    "> Running Tests",
    "> Finalizing Build"
  ],
  [
    "> Setting Up Servers",
    "> Configuring CDN",
    "> Setting DNS Records",
    "> Establishing SSL",
    "> Switching Traffic",
    "> Monitoring Progress",
    "> Going Live"
  ]
];

export const DataStream = ({ activeStep = 0, className = "", customPool }: DataStreamProps) => {
  const pool = customPool || defaultPool;
  const [logs, setLogs] = useState<string[]>([]);
  
  useEffect(() => {
    // Ensure activeStep is within bounds
    const step = activeStep % pool.length;
    setLogs(pool[step]);
    
    const interval = setInterval(() => {
      setLogs(prev => {
        const next = [...prev];
        const removed = next.shift();
        if (removed) next.push(removed);
        return next;
      });
    }, 1500);
    
    return () => clearInterval(interval);
  }, [activeStep, pool]);

  return (
    <div className={`font-mono text-[10px] text-ai-blue/60 space-y-2 overflow-hidden h-full flex flex-col justify-end ${className}`}>
      {logs.map((log, i) => (
        <div key={i} className={`transition-all duration-500 whitespace-nowrap ${i === logs.length - 1 ? 'text-ai-blue opacity-100' : 'opacity-40'}`}>
          {log}
        </div>
      ))}
    </div>
  );
};

export default DataStream;
