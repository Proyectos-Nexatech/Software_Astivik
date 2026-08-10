"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutDashboard, Users, Settings, HelpCircle, LogOut, FileCheck, Building2, ShieldCheck, Key, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-16 md:w-64 bg-[#0a1e36] text-slate-300 border-r border-[#0a1e36] flex flex-col h-full shrink-0 transition-all duration-300">
      <div className="h-20 px-3 md:px-6 flex items-center justify-center md:justify-start border-b border-white/10 shrink-0">
        <h1 className="text-xl font-bold flex items-center gap-2 text-white">
          <div className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center shadow-sm">
            <span className="text-sm font-black">SH</span>
          </div>
          <span className="hidden md:block">SafeGuard HSE</span>
        </h1>
      </div>
      
      <div className="p-2 md:p-4 bg-white/5">
        <div className="flex items-center justify-center md:justify-start gap-3 md:mb-4">
          <div className="w-10 h-10 bg-[#163354] border border-white/10 rounded flex items-center justify-center text-blue-400 shrink-0">
            <span className="font-bold">BI</span>
          </div>
          <div className="hidden md:block">
            <h2 className="font-semibold text-sm text-white">HSE BI</h2>
            <p className="text-xs text-blue-200/70">Operations Hub</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-2 md:px-3 space-y-1 overflow-y-auto">
        <Link href="/" title="Dashboard" className={`flex items-center justify-center md:justify-start gap-3 px-2 md:px-3 py-2 rounded-md font-medium text-sm transition-colors ${pathname === '/' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
          <LayoutDashboard className="w-5 h-5 md:w-4 md:h-4 shrink-0" /> <span className="hidden md:inline">Dashboard</span>
        </Link>
        <Link href="/proyectos" title="Proyectos" className={`flex items-center justify-center md:justify-start gap-3 px-2 md:px-3 py-2 rounded-md font-medium text-sm transition-colors ${pathname.startsWith('/proyectos') ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
          <Home className="w-5 h-5 md:w-4 md:h-4 shrink-0" /> <span className="hidden md:inline">Proyectos</span>
        </Link>
        <Link href="/contratistas" title="Contratistas" className={`flex items-center justify-center md:justify-start gap-3 px-2 md:px-3 py-2 rounded-md font-medium text-sm transition-colors ${pathname.startsWith('/contratistas') ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
          <Building2 className="w-5 h-5 md:w-4 md:h-4 shrink-0" /> <span className="hidden md:inline">Contratistas</span>
        </Link>
        <Link href="/personal" title="Personal" className={`flex items-center justify-center md:justify-start gap-3 px-2 md:px-3 py-2 rounded-md font-medium text-sm transition-colors ${pathname.startsWith('/personal') ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
          <Users className="w-5 h-5 md:w-4 md:h-4 shrink-0" /> <span className="hidden md:inline">Personal</span>
        </Link>
        <Link href="/visitantes" title="Visitantes" className={`flex items-center justify-center md:justify-start gap-3 px-2 md:px-3 py-2 rounded-md font-medium text-sm transition-colors ${pathname.startsWith('/visitantes') ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
          <UserCircle className="w-5 h-5 md:w-4 md:h-4 shrink-0" /> <span className="hidden md:inline">Visitantes</span>
        </Link>
        <Link href="/documentos" title="Documentos HSE" className={`flex items-center justify-center md:justify-start gap-3 px-2 md:px-3 py-2 rounded-md font-medium text-sm transition-colors ${pathname.startsWith('/documentos') ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
          <ShieldCheck className="w-5 h-5 md:w-4 md:h-4 shrink-0" /> <span className="hidden md:inline">Documentos HSE</span>
        </Link>
        <Link href="/acceso" title="Control de Acceso" className={`flex items-center justify-center md:justify-start gap-3 px-2 md:px-3 py-2 rounded-md font-medium text-sm transition-colors ${pathname.startsWith('/acceso') ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
          <Key className="w-5 h-5 md:w-4 md:h-4 shrink-0" /> <span className="hidden md:inline">Control de Acceso</span>
        </Link>
        <Link href="/reportes" title="Reportes de Cumplimiento" className={`flex items-center justify-center md:justify-start gap-3 px-2 md:px-3 py-2 rounded-md font-medium text-sm transition-colors ${pathname.startsWith('/reportes') ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
          <FileCheck className="w-5 h-5 md:w-4 md:h-4 shrink-0" /> <span className="hidden md:inline">Reportes de Cumplimiento</span>
        </Link>
        <Link href="/configuracion" title="Configuración" className={`flex items-center justify-center md:justify-start gap-3 px-2 md:px-3 py-2 rounded-md font-medium text-sm transition-colors ${pathname.startsWith('/configuracion') ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
          <Settings className="w-5 h-5 md:w-4 md:h-4 shrink-0" /> <span className="hidden md:inline">Configuración</span>
        </Link>
      </nav>

      <div className="p-2 md:p-4 border-t border-white/10 mt-auto flex items-center justify-center w-full">
        <img src="/astivik-logo.jpg" alt="Astivik Shipyard" className="hidden md:block h-12 opacity-80 hover:opacity-100 transition-opacity bg-white px-2 py-1 rounded" />
        <div className="md:hidden w-8 h-8 bg-white/10 text-white rounded flex items-center justify-center text-xs font-bold">A</div>
      </div>
    </aside>
  );
}
