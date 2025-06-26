'use client';

import { useState, useEffect } from 'react';

export default function ClockDisplay() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const dayMonth = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    
    return `${dayName}, ${dayMonth} ${year} ${time}`;
  };

  return (
    <div className="bg-black text-sm font-medium px-2">
      {mounted ? formatTime(currentTime) : 'Loading...'}
    </div>
  );
}