'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import ClockDisplay from '@/components/dockmenu/ClockDisplay';
import WeatherDisplay from '@/components/dockmenu/WeatherDisplay';
import ServerStatisticDisplay from '@/components/dockmenu/ServerStatisticDisplay';

function NavLink({ href, children, className }: { href: string; children: React.ReactNode, className?: string }) {
  const pathname = usePathname();
  return (
    <Link
      href={href}
      className={className + (href === pathname ? ' active' : '')}
    >
      {children}
    </Link>
  );
}

export default function DockMenu() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        switch (event.key.toLowerCase()) {
          case '0':
            event.preventDefault();
            router.push('/');
            break;
          case '1':
            event.preventDefault();
            router.push('/terminal');
            break;
          case '2':
            event.preventDefault();
            router.push('/playground');
            break;
          case '3':
            event.preventDefault();
            router.push('/readme');
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [router]);

  return (
    <div className="flex justify-between gap-2 items-center w-full text-green-400 p-2 z-10">
      <div className="flex items-center gap-0 text-sm">
        <NavLink href="/" className="bg-black border border-green-400 font-bold px-2 hover:bg-gray-500 [&.active]:bg-white">⌘ + 0</NavLink>
        <NavLink href="/terminal" className="bg-black border border-green-400 font-bold px-2 hover:bg-gray-500 [&.active]:bg-white">1</NavLink>
        <NavLink href="/playground" className="bg-black border border-green-400 font-bold px-2 hover:bg-gray-500 [&.active]:bg-white">2</NavLink>
        <NavLink href="/readme" className="bg-black border border-green-400 font-bold px-2 hover:bg-gray-500 [&.active]:bg-white">3</NavLink>
      </div>
      <div className="flex items-center gap-2">
        <ClockDisplay />
        <WeatherDisplay />
        <ServerStatisticDisplay />
      </div>
    </div>
  );
}