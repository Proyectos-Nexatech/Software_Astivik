"use client";

import { usePathname } from 'next/navigation';
import { Search, Bell, Grid } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';

export function Topbar() {
  const pathname = usePathname();

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 z-10">
      <nav className="flex gap-6 h-full items-end">
        <Link href="/" className={`text-sm font-semibold pb-5 transition-colors ${pathname === '/' ? 'border-b-2 border-black text-slate-900' : 'text-slate-500 hover:text-black'}`}>DASHBOARD</Link>
        <Link href="/proyectos" className={`text-sm font-semibold pb-5 transition-colors ${pathname.startsWith('/proyectos') ? 'border-b-2 border-black text-slate-900' : 'text-slate-500 hover:text-black'}`}>PROYECTOS</Link>
        <Link href="/personal" className={`text-sm font-semibold pb-5 transition-colors ${pathname.startsWith('/personal') ? 'border-b-2 border-black text-slate-900' : 'text-slate-500 hover:text-black'}`}>PERSONAL</Link>
        <Link href="/reportes" className={`text-sm font-semibold pb-5 transition-colors ${pathname.startsWith('/reportes') ? 'border-b-2 border-black text-slate-900' : 'text-slate-500 hover:text-black'}`}>REPORTES</Link>
      </nav>
      
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar reporte..." 
            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm w-64 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all"
          />
        </div>
        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <Grid className="w-5 h-5" />
        </button>
        <Avatar className="w-8 h-8 cursor-pointer ring-2 ring-transparent hover:ring-slate-200 transition-all">
          <AvatarFallback className="bg-slate-900 text-white text-xs font-bold">SM</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
