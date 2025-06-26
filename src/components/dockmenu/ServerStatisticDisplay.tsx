'use client';

import { useQuery } from '@tanstack/react-query';

interface ServerStats {
  cpuUsage: number;
  totalRam: number;
  usedRam: number;
}

const fetchServerStats = async (): Promise<ServerStats> => {
  const response = await fetch('/api/server-statistic');
  if (!response.ok) {
    throw new Error('Failed to fetch server statistics');
  }
  return response.json();
};

const formatBytes = (bytes: number): string => {
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(1)}GB`;
};

export default function ServerStatisticDisplay() {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['server-stats'],
    queryFn: fetchServerStats
  });

  return (
    <div className="bg-black text-sm font-medium px-2">
      {(isLoading || isError || !stats) ?
        'Loading...' :
        `CPU: ${stats.cpuUsage}% | RAM: ${formatBytes(stats.usedRam)}/${formatBytes(stats.totalRam)} (${((stats.usedRam / stats.totalRam) * 100).toFixed(1)}%)`
      }
    </div>
  );
}