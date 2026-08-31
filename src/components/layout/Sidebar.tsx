"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutDashboard, Users, Settings, FileCheck, Building2, ShieldCheck, Key, UserCircle, ChevronDown, ChevronRight, Briefcase, HardHat, AlertTriangle, Notebook, UserX } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const [operacionesOpen, setOperacionesOpen] = useState(true);
  const [accesoOpen, setAccesoOpen] = useState(true);

  const getLinkClasses = (isActive: boolean, isSubmenu: boolean = false) => {
    const base = `flex items-center justify-center md:justify-start gap-3 px-2 md:px-3 py-2 font-medium text-sm transition-all border-l-[3px] rounded-r-md ${isSubmenu ? 'md:ml-4' : ''}`;
    if (isActive) {
      return `${base} bg-white/10 text-cyan-300 border-cyan-400`;
    }
    return `${base} text-slate-100 border-transparent hover:bg-white/5 hover:text-white hover:border-slate-400/50`;
  };

  return (
    <aside className="w-16 md:w-64 bg-[#0a1e36] text-slate-100 border-r border-[#0a1e36] flex flex-col h-full shrink-0 transition-all duration-300">
      <div className="h-24 p-4 flex items-center justify-center border-b border-white/10 shrink-0 overflow-hidden">
        <Link href="/" className="block w-full">
          {/* Logo Astivik (Desktop) y Abreviatura (Mobile) */}
          <div className="flex justify-center items-center w-full bg-white rounded">
            <img src="/logo%20negro%20astivik.png" alt="Astivik Shipyard" className="hidden md:block w-full h-12 object-contain" />
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
        
        {/* GRUPO: OPERACIONES HSE */}
        <div className="pt-2">
          <button 
            onClick={() => setOperacionesOpen(!operacionesOpen)}
            className="w-full flex items-center justify-center md:justify-between px-2 md:px-3 py-2 text-slate-400 hover:text-white transition-colors group"
            title="Operaciones HSE"
          >
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 md:w-4 md:h-4 shrink-0" />
              <span className="hidden md:inline text-xs font-bold uppercase tracking-wider">Operaciones HSE</span>
            </div>
            {operacionesOpen ? <ChevronDown className="hidden md:block w-4 h-4 shrink-0" /> : <ChevronRight className="hidden md:block w-4 h-4 shrink-0" />}
          </button>
          
          <div className={`space-y-1 mt-1 ${operacionesOpen ? 'block' : 'hidden md:hidden'}`}>
            <Link href="/proyectos" title="Proyectos" className={getLinkClasses(pathname.startsWith('/proyectos'), true)}>
              <Home className="w-5 h-5 md:w-4 md:h-4 shrink-0 opacity-0 md:hidden" /> <span className="hidden md:inline relative before:content-[''] before:absolute before:-left-3 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:bg-slate-500 before:rounded-full">Proyectos</span>
            </Link>
            <Link href="/documentos" title="Documentos HSE" className={getLinkClasses(pathname.startsWith('/documentos'), true)}>
              <ShieldCheck className="w-5 h-5 md:w-4 md:h-4 shrink-0 opacity-0 md:hidden" /> <span className="hidden md:inline relative before:content-[''] before:absolute before:-left-3 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:bg-slate-500 before:rounded-full">Documentos HSE</span>
            </Link>
            <Link href="/contratistas" title="Contratistas" className={getLinkClasses(pathname.startsWith('/contratistas'), true)}>
              <Building2 className="w-5 h-5 md:w-4 md:h-4 shrink-0 opacity-0 md:hidden" /> <span className="hidden md:inline relative before:content-[''] before:absolute before:-left-3 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:bg-slate-500 before:rounded-full">Contratistas</span>
            </Link>
            <Link href="/reportes" title="Reportes de Cumplimiento" className={getLinkClasses(pathname.startsWith('/reportes'), true)}>
              <FileCheck className="w-5 h-5 md:w-4 md:h-4 shrink-0 opacity-0 md:hidden" /> <span className="hidden md:inline relative before:content-[''] before:absolute before:-left-3 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:bg-slate-500 before:rounded-full">Reportes Cumplimiento</span>
            </Link>
            <Link href="/permisos-trabajo" title="Permisos de Trabajo" className={getLinkClasses(pathname.startsWith('/permisos-trabajo'), true)}>
              <HardHat className="w-5 h-5 md:w-4 md:h-4 shrink-0 opacity-0 md:hidden" /> <span className="hidden md:inline relative before:content-[''] before:absolute before:-left-3 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:bg-slate-500 before:rounded-full">Permisos de Trabajo</span>
            </Link>
            <Link href="/eventos-hse" title="Incidentes y Accidentes" className={getLinkClasses(pathname.startsWith('/eventos-hse'), true)}>
              <AlertTriangle className="w-5 h-5 md:w-4 md:h-4 shrink-0 opacity-0 md:hidden" /> <span className="hidden md:inline relative before:content-[''] before:absolute before:-left-3 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:bg-slate-500 before:rounded-full">Incidentes y Accidentes</span>
            </Link>
            <Link href="/novedades" title="Novedades" className={getLinkClasses(pathname.startsWith('/novedades'), true)}>
              <Notebook className="w-5 h-5 md:w-4 md:h-4 shrink-0 opacity-0 md:hidden" /> <span className="hidden md:inline relative before:content-[''] before:absolute before:-left-3 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:bg-slate-500 before:rounded-full">Novedades</span>
            </Link>
            <Link href="/inasistencias" title="Inasistencias" className={getLinkClasses(pathname.startsWith('/inasistencias'), true)}>
              <UserX className="w-5 h-5 md:w-4 md:h-4 shrink-0 opacity-0 md:hidden" /> <span className="hidden md:inline relative before:content-[''] before:absolute before:-left-3 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:bg-slate-500 before:rounded-full">Inasistencias</span>
            </Link>
          </div>

        </div>

        {/* GRUPO: CONTROL DE ACCESO */}
        <div className="pt-2">
          <button 
            onClick={() => setAccesoOpen(!accesoOpen)}
            className="w-full flex items-center justify-center md:justify-between px-2 md:px-3 py-2 text-slate-400 hover:text-white transition-colors group"
            title="Control de Acceso"
          >
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 md:w-4 md:h-4 shrink-0" />
              <span className="hidden md:inline text-xs font-bold uppercase tracking-wider">Control de Acceso</span>
            </div>
            {accesoOpen ? <ChevronDown className="hidden md:block w-4 h-4 shrink-0" /> : <ChevronRight className="hidden md:block w-4 h-4 shrink-0" />}
          </button>
          
          <div className={`space-y-1 mt-1 ${accesoOpen ? 'block' : 'hidden md:hidden'}`}>
            <Link href="/acceso" title="Torniquete" className={getLinkClasses(pathname.startsWith('/acceso'), true)}>
              <Key className="w-5 h-5 md:w-4 md:h-4 shrink-0 opacity-0 md:hidden" /> <span className="hidden md:inline relative before:content-[''] before:absolute before:-left-3 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:bg-slate-500 before:rounded-full">Torniquete</span>
            </Link>
            <Link href="/personal" title="Personal" className={getLinkClasses(pathname.startsWith('/personal'), true)}>
              <Users className="w-5 h-5 md:w-4 md:h-4 shrink-0 opacity-0 md:hidden" /> <span className="hidden md:inline relative before:content-[''] before:absolute before:-left-3 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:bg-slate-500 before:rounded-full">Personal</span>
            </Link>
            <Link href="/visitantes" title="Visitantes" className={getLinkClasses(pathname.startsWith('/visitantes'), true)}>
              <UserCircle className="w-5 h-5 md:w-4 md:h-4 shrink-0 opacity-0 md:hidden" /> <span className="hidden md:inline relative before:content-[''] before:absolute before:-left-3 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:bg-slate-500 before:rounded-full">Visitantes</span>
            </Link>
          </div>
        </div>

        {/* GRUPO: CONFIGURACIÓN */}
        <div className="pt-2">
          <Link href="/configuracion" title="Configuración" className={getLinkClasses(pathname.startsWith('/configuracion'))}>
            <Settings className="w-5 h-5 md:w-4 md:h-4 shrink-0" /> <span className="hidden md:inline">Configuración</span>
          </Link>
        </div>
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-white/10 hidden md:block shrink-0 mt-auto">
        <p className="text-xs text-white text-center">
          © 2026 Nexatech. Todos los derechos reservados.
        </p>
      </div>
    </aside>
  );
}
