import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;

  const cpuUsage = getCpuUsage();

  const stats = {
    cpuUsage,
    totalRam: totalMemory,
    usedRam: usedMemory
  };

  return NextResponse.json(stats);
}

function getCpuUsage(): number {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;
  
  cpus.forEach((cpu) => {
    for (const type in cpu.times) {
      total += cpu.times[type as keyof typeof cpu.times];
    }
    idle += cpu.times.idle;
  });
  
  const idlePercentage = (idle / total) * 100;
  const cpuUsagePercentage = 100 - idlePercentage;
  
  return Math.round(cpuUsagePercentage);
}