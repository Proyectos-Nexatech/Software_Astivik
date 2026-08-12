"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutDashboard, Users, Settings, HelpCircle, LogOut, FileCheck, Building2, ShieldCheck, Key, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Sidebar() {
  const pathname = usePathname();

  const getLinkClasses = (isActive: boolean) => {
    const base = "flex items-center justify-center md:justify-start gap-3 px-2 md:px-3 py-2 font-medium text-sm transition-all border-l-[3px] rounded-r-md";
    if (isActive) {
      return `${base} bg-white/10 text-cyan-300 border-cyan-400`;
    }
    return `${base} text-slate-100 border-transparent hover:bg-white/5 hover:text-white hover:border-slate-400/50`;
  };

  return (
    <aside className="w-16 md:w-64 bg-[#0a1e36] text-slate-100 border-r border-[#0a1e36] flex flex-col h-full shrink-0 transition-all duration-300">
      <div className="h-20 px-3 md:px-6 flex items-center justify-center md:justify-start border-b border-white/10 shrink-0">
        <Link href="/" className="block w-full">
          {/* Logo Astivik (Desktop) y Abreviatura (Mobile) */}
          <div className="flex items-center gap-2">
            <img src="/astivik-logo.jpg" alt="Astivik Shipyard" className="hidden md:block h-10 object-contain mix-blend-screen" />
            <div className="md:hidden w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center text-xs font-bold shadow-sm mx-auto">
              <span className="text-sm font-black">A</span>
            </div>
          </div>
        </Link>
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

      <nav className="flex-1 py-4 px-2 md:pr-3 md:pl-0 space-y-1 overflow-y-auto">
        <Link href="/" title="Dashboard" className={getLinkClasses(pathname === '/')}>
          <LayoutDashboard className="w-5 h-5 md:w-4 md:h-4 shrink-0" /> <span className="hidden md:inline">Dashboard</span>
        </Link>
        <Link href="/proyectos" title="Proyectos" className={getLinkClasses(pathname.startsWith('/proyectos'))}>
          <Home className="w-5 h-5 md:w-4 md:h-4 shrink-0" /> <span className="hidden md:inline">Proyectos</span>
        </Link>
        <Link href="/contratistas" title="Contratistas" className={getLinkClasses(pathname.startsWith('/contratistas'))}>
          <Building2 className="w-5 h-5 md:w-4 md:h-4 shrink-0" /> <span className="hidden md:inline">Contratistas</span>
        </Link>
        <Link href="/personal" title="Personal" className={getLinkClasses(pathname.startsWith('/personal'))}>
          <Users className="w-5 h-5 md:w-4 md:h-4 shrink-0" /> <span className="hidden md:inline">Personal</span>
        </Link>
        <Link href="/visitantes" title="Visitantes" className={getLinkClasses(pathname.startsWith('/visitantes'))}>
          <UserCircle className="w-5 h-5 md:w-4 md:h-4 shrink-0" /> <span className="hidden md:inline">Visitantes</span>
        </Link>
        <Link href="/documentos" title="Documentos HSE" className={getLinkClasses(pathname.startsWith('/documentos'))}>
          <ShieldCheck className="w-5 h-5 md:w-4 md:h-4 shrink-0" /> <span className="hidden md:inline">Documentos HSE</span>
        </Link>
        <Link href="/acceso" title="Control de Acceso" className={getLinkClasses(pathname.startsWith('/acceso'))}>
          <Key className="w-5 h-5 md:w-4 md:h-4 shrink-0" /> <span className="hidden md:inline">Control de Acceso</span>
        </Link>
        <Link href="/reportes" title="Reportes de Cumplimiento" className={getLinkClasses(pathname.startsWith('/reportes'))}>
          <FileCheck className="w-5 h-5 md:w-4 md:h-4 shrink-0" /> <span className="hidden md:inline">Reportes de Cumplimiento</span>
        </Link>
        <Link href="/configuracion" title="Configuración" className={getLinkClasses(pathname.startsWith('/configuracion'))}>
          <Settings className="w-5 h-5 md:w-4 md:h-4 shrink-0" /> <span className="hidden md:inline">Configuración</span>
        </Link>
      </nav>
    </aside>
  );
}
