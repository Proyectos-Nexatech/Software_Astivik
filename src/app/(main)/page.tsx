"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSpreadsheet, FileText, FileDown, Clock, Calendar as CalendarIcon, Filter, Users, AlertCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const requiredDocsByCargo: Record<string, string[]> = {
  "Soldador 1A": ["ss", "examen", "alturas", "confinados", "soldadura"],
  "Sandblaster": ["ss", "examen", "alturas", "confinados"],
  "Electricista": ["ss", "examen", "alturas"]
};

export default function DashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    cumplimientoGlobal: 0,
    aforoActual: 0,
    alertasRecientes: [] as any[],
    contratistasInfo: [] as any[]
  });

  const [proyectos, setProyectos] = useState<any[]>([]);
  const [contratistas, setContratistas] = useState<any[]>([]);

  const [filtroProyecto, setFiltroProyecto] = useState("all");
  const [filtroEmpresa, setFiltroEmpresa] = useState("all");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    
    // Fetch dropdown data
    const [{ data: pData }, { data: cData }] = await Promise.all([
      supabase.from('proyectos').select('*').eq('estado', 'Activo'),
      supabase.from('contratistas').select('*')
    ]);
    if (pData) setProyectos(pData);
    if (cData) setContratistas(cData);

    // Fetch Workers and Docs
    const [{ data: workersRaw }, { data: docs }] = await Promise.all([
      supabase.from('trabajadores').select('*'),
      supabase.from('documentos_hse').select('*')
    ]);

    let workers = workersRaw || [];
    if (filtroEmpresa !== 'all') {
      // Find the name of the selected empresa
      const selectedEmpresa = cData?.find(c => c.id === filtroEmpresa)?.nombre || filtroEmpresa;
      workers = workers.filter(w => w.empresa === selectedEmpresa || w.empresa === filtroEmpresa);
    }

    // 1. Calculate Compliance (Global & Per Contratista)
    let aptosTotales = 0;
    const statsPorEmpresa: Record<string, { total: number; aptos: number }> = {};
    const alertas: any[] = [];

    if (workers.length > 0 && docs) {
      workers.forEach(w => {
        const reqDocs = requiredDocsByCargo[w.cargo] || ["ss", "examen"];
        const wDocs = docs.filter(d => d.trabajador_id === w.id);
        
        let isApto = true;
        reqDocs.forEach(req => {
          const doc = wDocs.find(d => d.tipo_documento === req);
          if (!doc || doc.estado_aprobacion !== 'Aprobado' || doc.estado === 'Vencido' || doc.estado === 'Faltante') {
            isApto = false;
          }
          // Collect recent alerts (rejected or expired docs)
          if (doc && (doc.estado_aprobacion === 'Rechazado' || doc.estado === 'Vencido')) {
            alertas.push({ trabajador: w.nombre, empresa: w.empresa, documento: req, estado: doc.estado, aprobacion: doc.estado_aprobacion });
          }
        });

        if (isApto) aptosTotales++;

        if (!statsPorEmpresa[w.empresa]) {
          statsPorEmpresa[w.empresa] = { total: 0, aptos: 0 };
        }
        statsPorEmpresa[w.empresa].total++;
        if (isApto) statsPorEmpresa[w.empresa].aptos++;
      });
    }

    const totalWorkers = workers.length > 0 ? workers.length : 1;
    const globalCompliance = workers.length > 0 ? (aptosTotales / totalWorkers) * 100 : 0;

    const contratistasInfo = Object.entries(statsPorEmpresa).map(([empresa, data]) => ({
      empresa,
      total: data.total,
      aptos: data.aptos,
      pct: (data.aptos / data.total) * 100
    })).sort((a, b) => b.total - a.total); // Sort by total workers

    // 2. Calculate Aforo (Today's entries minus exits)
    const today = new Date();
    today.setHours(0,0,0,0);
    
    let queryAccesos = supabase
      .from('registros_acceso')
      .select('*')
      .gte('fecha_hora', today.toISOString());
      
    if (filtroProyecto !== 'all') {
      queryAccesos = queryAccesos.eq('proyecto_destino', filtroProyecto);
    }

    const { data: accesos } = await queryAccesos;

    let aforo = 0;
    if (accesos) {
      const entradas = accesos.filter(a => a.tipo === 'ENTRADA').length;
      const salidas = accesos.filter(a => a.tipo === 'SALIDA').length;
      aforo = Math.max(0, entradas - salidas);
    }

    setStats({
      cumplimientoGlobal: globalCompliance,
      aforoActual: aforo,
      alertasRecientes: alertas.slice(0, 10), // only top 10
      contratistasInfo
    });

    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-[1100px] mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard de Inteligencia Operativa</h1>
          <p className="text-slate-500 text-sm mt-1">Datos en tiempo real de seguridad y aforo en planta.</p>
        </div>
      </div>

      <Card className="bg-white shadow-sm border-slate-200">
        <CardContent className="p-4 flex flex-wrap md:flex-nowrap gap-4 items-end">
          <div className="space-y-2 flex-1 min-w-[200px]">
            <label className="text-[11px] font-bold text-slate-500 tracking-wider">PROYECTO / BARCO</label>
            <Select value={filtroProyecto} onValueChange={setFiltroProyecto}>
              <SelectTrigger className="h-10 bg-slate-50">
                <SelectValue placeholder="Todos los proyectos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los proyectos</SelectItem>
                {proyectos.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 flex-1 min-w-[200px]">
            <label className="text-[11px] font-bold text-slate-500 tracking-wider">CONTRATISTA</label>
            <Select value={filtroEmpresa} onValueChange={setFiltroEmpresa}>
              <SelectTrigger className="h-10 bg-slate-50">
                <SelectValue placeholder="Todas las empresas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las empresas</SelectItem>
                {contratistas.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={fetchDashboardData} className="bg-[#0a1e36] hover:bg-[#163354] text-white font-semibold h-10 px-6">
            <Filter className="w-4 h-4 mr-2" /> APLICAR FILTROS
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] font-bold text-slate-500 tracking-wider flex justify-between items-center">
              CUMPLIMIENTO GLOBAL HSE
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${stats.cumplimientoGlobal >= 90 ? 'border-green-500' : 'border-yellow-500'}`}>
                 <div className={`w-2.5 h-2.5 rounded-full ${stats.cumplimientoGlobal >= 90 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-[2.5rem] leading-none font-bold text-slate-900 tracking-tight">
                {loading ? "..." : stats.cumplimientoGlobal.toFixed(1)}%
              </span>
            </div>
            <div className="mt-5 h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div className={`${stats.cumplimientoGlobal >= 90 ? 'bg-green-500' : 'bg-yellow-500'} rounded-full transition-all duration-1000`} style={{ width: `${stats.cumplimientoGlobal}%` }}></div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] font-bold text-slate-500 tracking-wider flex justify-between items-center">
              AFORO ACTUAL EN PLANTA
              <Users className="w-4 h-4 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-[2.5rem] leading-none font-bold text-slate-900 tracking-tight">
                {loading ? "..." : stats.aforoActual}
              </span>
              <span className="text-xs font-medium text-slate-500">trabajadores inside</span>
            </div>
            <div className="mt-5 flex items-center text-xs font-medium text-slate-600">
              <div className="w-2 h-2 rounded-full bg-blue-500 mr-2 shadow-[0_0_0_2px_rgba(59,130,246,0.2)]"></div>
              Basado en registros de torniquete hoy
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 bg-[#0a1e36] text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] font-bold text-blue-200 tracking-wider flex justify-between items-center">
              ALERTAS CRÍTICAS (HOY)
              <AlertCircle className="w-4 h-4 text-red-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-[2.5rem] leading-none font-bold text-white tracking-tight">
                {loading ? "..." : stats.alertasRecientes.length}
              </span>
              <span className="text-xs font-medium text-blue-200">documentos rechazados/vencidos</span>
            </div>
            <div className="mt-5 flex items-center text-xs font-medium text-blue-200">
              <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
              Requieren atención inmediata
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-0 flex gap-6 overflow-x-auto bg-slate-50/50">
          <button className="px-1 py-4 text-xs font-bold tracking-wider border-b-2 border-[#0a1e36] whitespace-nowrap text-slate-900">
            CUMPLIMIENTO POR CONTRATISTA
          </button>
        </div>
        <CardContent className="p-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border border-slate-200 rounded-lg p-5 bg-white shadow-sm">
              <h4 className="text-[11px] font-bold tracking-wider text-slate-600 flex items-center gap-2 mb-5">
                <Users className="w-3.5 h-3.5" /> ESTADO DE HABILITACIÓN POR EMPRESA
              </h4>
              <div className="space-y-5 h-[250px] overflow-y-auto pr-2">
                {stats.contratistasInfo.map(c => (
                  <div key={c.empresa}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-700 font-medium truncate max-w-[150px]">{c.empresa}</span>
                      <span className="font-mono text-slate-600 font-medium text-xs">
                        <span className="font-bold">{c.aptos}/{c.total}</span> aptos ({c.pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className={`${c.pct >= 90 ? 'bg-green-500' : c.pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'} h-full transition-all`} style={{ width: `${c.pct}%` }}></div>
                    </div>
                  </div>
                ))}
                {stats.contratistasInfo.length === 0 && !loading && (
                   <p className="text-sm text-slate-500 italic">No hay trabajadores registrados.</p>
                )}
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-5 bg-white shadow-sm">
              <h4 className="text-[11px] font-bold tracking-wider text-red-600 flex items-center gap-2 mb-5">
                <AlertCircle className="w-3.5 h-3.5" /> ALERTAS Y RECHAZOS RECIENTES
              </h4>
              <div className="space-y-4 h-[250px] overflow-y-auto pr-2">
                {stats.alertasRecientes.map((al, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-red-50/50 rounded-lg border border-red-100">
                    <div>
                      <div className="text-sm font-bold text-slate-800">{al.trabajador}</div>
                      <div className="text-xs text-slate-500">{al.empresa} - {al.documento.toUpperCase()}</div>
                    </div>
                    <div className="text-right">
                       <span className="text-[10px] font-bold bg-red-100 text-red-800 px-2 py-1 rounded">
                         {al.aprobacion === 'Rechazado' ? 'RECHAZADO' : 'VENCIDO'}
                       </span>
                    </div>
                  </div>
                ))}
                {stats.alertasRecientes.length === 0 && !loading && (
                  <p className="text-sm text-slate-500 italic text-center py-10">No hay alertas críticas actualmente.</p>
                )}
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
