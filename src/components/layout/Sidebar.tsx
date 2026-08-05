"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutDashboard, Users, Settings, HelpCircle, LogOut, FileCheck, Building2, ShieldCheck, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col h-full shrink-0">
      <div className="h-20 px-6 flex items-center border-b border-slate-200 shrink-0">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <div className="w-8 h-8 bg-black text-white rounded flex items-center justify-center">
            <span className="text-sm font-black">SH</span>
          </div>
          SafeGuard HSE
        </h1>
      </div>
      
      <div className="p-4 bg-slate-100/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-black rounded flex items-center justify-center text-white">
            <span className="font-bold">BI</span>
          </div>
          <div>
            <h2 className="font-semibold text-sm">HSE BI</h2>
            <p className="text-xs text-slate-500">Operations Hub</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        <Link href="/" className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${pathname === '/' ? 'bg-blue-100 text-blue-800' : 'text-slate-600 hover:bg-slate-100'}`}>
          <LayoutDashboard className="w-4 h-4" /> Dashboard
        </Link>
        <Link href="/proyectos" className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${pathname.startsWith('/proyectos') ? 'bg-blue-100 text-blue-800' : 'text-slate-600 hover:bg-slate-100'}`}>
          <Home className="w-4 h-4" /> Proyectos
        </Link>
        <Link href="/contratistas" className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${pathname.startsWith('/contratistas') ? 'bg-blue-100 text-blue-800' : 'text-slate-600 hover:bg-slate-100'}`}>
          <Building2 className="w-4 h-4" /> Contratistas
        </Link>
        <Link href="/personal" className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${pathname.startsWith('/personal') ? 'bg-blue-100 text-blue-800' : 'text-slate-600 hover:bg-slate-100'}`}>
          <Users className="w-4 h-4" /> Personal
        </Link>
        <Link href="/documentos" className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${pathname.startsWith('/documentos') ? 'bg-blue-100 text-blue-800' : 'text-slate-600 hover:bg-slate-100'}`}>
          <ShieldCheck className="w-4 h-4" /> Documentos HSE
        </Link>
        <Link href="/acceso" className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${pathname.startsWith('/acceso') ? 'bg-blue-100 text-blue-800' : 'text-slate-600 hover:bg-slate-100'}`}>
          <Key className="w-4 h-4" /> Control de Acceso
        </Link>
        <Link href="/reportes" className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${pathname.startsWith('/reportes') ? 'bg-blue-100 text-blue-800' : 'text-slate-600 hover:bg-slate-100'}`}>
          <FileCheck className="w-4 h-4" /> Compliance Reports
        </Link>
        <Link href="/configuracion" className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${pathname.startsWith('/configuracion') ? 'bg-blue-100 text-blue-800' : 'text-slate-600 hover:bg-slate-100'}`}>
          <Settings className="w-4 h-4" /> Configuración
        </Link>
      </nav>

      <div className="p-4 border-t border-slate-200 space-y-1 mt-auto">
        <Link href="/support" className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-md font-medium text-sm transition-colors">
          <HelpCircle className="w-4 h-4" /> Soporte
        </Link>
      </div>
    </aside>
  );
}
