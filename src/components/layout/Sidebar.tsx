"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutDashboard, Users, Settings, HelpCircle, LogOut, FileCheck, Building2, ShieldCheck, Key, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#0a1e36] text-slate-300 border-r border-[#0a1e36] flex flex-col h-full shrink-0">
      <div className="h-20 px-6 flex items-center border-b border-white/10 shrink-0">
        <h1 className="text-xl font-bold flex items-center gap-2 text-white">
          <div className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center shadow-sm">
            <span className="text-sm font-black">SH</span>
          </div>
          SafeGuard HSE
        </h1>
      </div>
      
      <div className="p-4 bg-white/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[#163354] border border-white/10 rounded flex items-center justify-center text-blue-400">
            <span className="font-bold">BI</span>
          </div>
          <div>
            <h2 className="font-semibold text-sm text-white">HSE BI</h2>
            <p className="text-xs text-blue-200/70">Operations Hub</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        <Link href="/" className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${pathname === '/' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
          <LayoutDashboard className="w-4 h-4" /> Dashboard
        </Link>
        <Link href="/proyectos" className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${pathname.startsWith('/proyectos') ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
          <Home className="w-4 h-4" /> Proyectos
        </Link>
        <Link href="/contratistas" className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${pathname.startsWith('/contratistas') ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
          <Building2 className="w-4 h-4" /> Contratistas
        </Link>
        <Link href="/personal" className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${pathname.startsWith('/personal') ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
          <Users className="w-4 h-4" /> Personal
        </Link>
        <Link href="/visitantes" className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${pathname.startsWith('/visitantes') ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
          <UserCircle className="w-4 h-4" /> Visitantes
        </Link>
        <Link href="/documentos" className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${pathname.startsWith('/documentos') ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
          <ShieldCheck className="w-4 h-4" /> Documentos HSE
        </Link>
        <Link href="/acceso" className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${pathname.startsWith('/acceso') ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
          <Key className="w-4 h-4" /> Control de Acceso
        </Link>
        <Link href="/reportes" className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${pathname.startsWith('/reportes') ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
          <FileCheck className="w-4 h-4" /> Reportes de Cumplimiento
        </Link>
        <Link href="/configuracion" className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${pathname.startsWith('/configuracion') ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
          <Settings className="w-4 h-4" /> Configuración
        </Link>
      </nav>

      <div className="p-4 border-t border-white/10 mt-auto flex items-center justify-center w-full">
        <img src="/astivik-logo.jpg" alt="Astivik Shipyard" className="h-12 opacity-80 hover:opacity-100 transition-opacity bg-white px-2 py-1 rounded" />
      </div>
    </aside>
  );
}
