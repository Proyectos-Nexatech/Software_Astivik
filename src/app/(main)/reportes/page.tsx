"use client";

import { useState, useEffect } from "react";
import Papa from "papaparse";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, Search, FileCheck, FileX, Loader2, Building2, UserCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const requiredDocsByCargo: Record<string, string[]> = {
  "Soldador 1A": ["ss", "examen", "alturas", "confinados", "soldadura"],
  "Sandblaster": ["ss", "examen", "alturas", "confinados"],
  "Electricista": ["ss", "examen", "alturas"]
};

export default function ReportesPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any[]>([]);
  const [contratistas, setContratistas] = useState<string[]>([]);
  const [cargos, setCargos] = useState<string[]>([]);
  
  // Filtros
  const [filtroEmpresa, setFiltroEmpresa] = useState("todas");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch Trabajadores and Documentos
    const [{ data: workersData }, { data: docsData }] = await Promise.all([
      supabase.from('trabajadores').select('*').order('nombre', { ascending: true }),
      supabase.from('documentos_hse').select('*')
    ]);

    if (workersData && docsData) {
      const empresasSet = new Set<string>();
      const cargosSet = new Set<string>();
      
      const processedData = workersData.map(w => {
        empresasSet.add(w.empresa);
        cargosSet.add(w.cargo);
        
        const reqDocs = requiredDocsByCargo[w.cargo] || ["ss", "examen"];
        const wDocs = docsData.filter(d => d.trabajador_id === w.id);
        
        let docsCompletos = 0;
        let estadoGlobal = "AL DÍA";
        const detallesDocs = [];
        
        for (const req of reqDocs) {
          const doc = wDocs.find(d => d.tipo_documento === req);
          let estadoDoc = "Faltante";
          if (doc) {
            if (doc.estado_aprobacion === "Rechazado") estadoDoc = "Rechazado";
            else if (doc.estado === "Vencido") estadoDoc = "Vencido";
            else if (doc.estado_aprobacion === "Aprobado") {
              estadoDoc = "Vigente";
              docsCompletos++;
            } else {
              estadoDoc = "Pendiente";
            }
          }
          
          if (estadoDoc !== "Vigente") {
            estadoGlobal = "NO APTO";
          }
          
          detallesDocs.push(`${req.toUpperCase()}: ${estadoDoc}`);
        }
        
        return {
          ...w,
          reqDocsCount: reqDocs.length,
          docsCompletos,
          estadoGlobal,
          detallesDocs: detallesDocs.join(' | '),
          porcentaje: Math.round((docsCompletos / reqDocs.length) * 100)
        };
      });

      setContratistas(Array.from(empresasSet).sort());
      setCargos(Array.from(cargosSet).sort());
      setReportData(processedData);
    }
    
    setLoading(false);
  };

  const dataFiltrada = reportData.filter(item => {
    const cumpleEmpresa = filtroEmpresa === "todas" || item.empresa === filtroEmpresa;
    const cumpleEstado = filtroEstado === "todos" || 
      (filtroEstado === "apto" && item.estadoGlobal === "AL DÍA") || 
      (filtroEstado === "no_apto" && item.estadoGlobal === "NO APTO");
    const cumpleBusqueda = busqueda === "" || 
      item.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
      item.documento.includes(busqueda);
      
    return cumpleEmpresa && cumpleEstado && cumpleBusqueda;
  });

  const exportarCsv = () => {
    if (dataFiltrada.length === 0) return alert("No hay datos para exportar");
    
    const exportFormat = dataFiltrada.map(r => ({
      Documento: r.documento,
      Nombre: r.nombre,
      Empresa: r.empresa,
      Cargo: r.cargo,
      'Documentos Aprobados': `${r.docsCompletos}/${r.reqDocsCount}`,
      'Cumplimiento (%)': r.porcentaje,
      'Estado Global': r.estadoGlobal,
      'Detalle Documentos': r.detallesDocs
    }));

    const csv = Papa.unparse(exportFormat, { delimiter: ";" });
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_cumplimiento_hse.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reportes de Cumplimiento</h1>
          <p className="text-slate-500 text-sm mt-1">Análisis de estado documental HSE de contratistas y personal.</p>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
          <CardTitle className="text-lg">Filtros de Reporte</CardTitle>
          <CardDescription>Seleccione los criterios para generar el reporte de cumplimiento.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 space-y-2">
              <Label>Empresa Contratista</Label>
              <Select value={filtroEmpresa} onValueChange={(val) => setFiltroEmpresa(val || '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las empresas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las empresas</SelectItem>
                  {contratistas.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 space-y-2">
              <Label>Estado HSE</Label>
              <Select value={filtroEstado} onValueChange={(val) => setFiltroEstado(val || '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="apto">Solo APTOS (Al día)</SelectItem>
                  <SelectItem value="no_apto">Solo NO APTOS (Faltantes/Vencidos)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 space-y-2">
              <Label>Búsqueda</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Buscar por cédula o nombre..." 
                  className="pl-9" 
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex items-end">
              <Button onClick={exportarCsv} className="bg-blue-600 hover:bg-blue-700 text-white w-full md:w-auto">
                <Download className="w-4 h-4 mr-2"/> Exportar CSV
              </Button>
            </div>
          </div>

          <div className="border border-slate-200 rounded-md">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="px-4">Trabajador</TableHead>
                  <TableHead>Contratista</TableHead>
                  <TableHead className="text-center">Cumplimiento Docs</TableHead>
                  <TableHead className="text-center">Estado Global</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : dataFiltrada.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                      No se encontraron resultados para los filtros aplicados.
                    </TableCell>
                  </TableRow>
                ) : (
                  dataFiltrada.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="px-4 py-3">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <UserCircle className="w-4 h-4 text-slate-400" />
                          {r.nombre}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">C.C. {r.documento} • {r.cargo}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {r.empresa}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${r.porcentaje === 100 ? 'bg-green-500' : 'bg-red-500'}`} 
                              style={{ width: `${r.porcentaje}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-slate-600 w-8">{r.porcentaje}%</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">{r.docsCompletos} de {r.reqDocsCount} Aprobados</div>
                      </TableCell>
                      <TableCell className="text-center">
                        {r.estadoGlobal === "AL DÍA" ? (
                          <Badge className="bg-green-100 text-green-800 border border-green-200">
                            <FileCheck className="w-3 h-3 mr-1" /> APTO
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 border border-red-200">
                            <FileX className="w-3 h-3 mr-1" /> NO APTO
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
