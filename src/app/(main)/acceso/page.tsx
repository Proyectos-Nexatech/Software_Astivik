"use client";

import { useState, useEffect } from "react";
import Papa from "papaparse";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, ShieldAlert, XCircle, CheckCircle2, UserCircle, DoorOpen, Download, Search, LogOut, FileCheck } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

// Required docs per cargo
const requiredDocsByCargo: Record<string, string[]> = {
  "Soldador 1A": ["ss", "examen", "alturas", "confinados", "soldadura"],
  "Sandblaster": ["ss", "examen", "alturas", "confinados"],
  "Electricista": ["ss", "examen", "alturas"]
};

export default function ControlAccesoPage() {
  const supabase = createClient();
  const [documentoBusqueda, setDocumentoBusqueda] = useState("");
  const [trabajadorActual, setTrabajadorActual] = useState<any>(null);
  const [estadoAcceso, setEstadoAcceso] = useState<{ tipo: string, mensaje: string, detalles: string[] } | null>(null);
  
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<string>("");
  const [registrosRecientes, setRegistrosRecientes] = useState<any[]>([]);
  const [vigenciasConfig, setVigenciasConfig] = useState<Record<string, number>>({});
  const [transitosSearch, setTransitosSearch] = useState("");
  const [transitosFiltroTipo, setTransitosFiltroTipo] = useState("TODOS");
  const [visibleLimit, setVisibleLimit] = useState(10);

  // Report State
  const [reportData, setReportData] = useState<any[]>([]);
  const [filtroRango, setFiltroRango] = useState("hoy");
  const [filtroEmpresa, setFiltroEmpresa] = useState("todas");
  const [filtroProyecto, setFiltroProyecto] = useState("todos");
  const [empresasUnicas, setEmpresasUnicas] = useState<string[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    generarReporte();
  }, [filtroRango, filtroEmpresa, filtroProyecto]); // Auto-refresh report when filters change

  const fetchInitialData = async () => {
    // 1. Fetch Proyectos
    const { data: pData } = await supabase.from('proyectos').select('*').eq('estado', 'Activo');
    if (pData) setProyectos(pData);

    // 2. Fetch Vigencias
    const { data: configData } = await supabase.from('configuracion_vigencias').select('*');
    const vConfig: Record<string, number> = { ss: 1, examen: 12, alturas: 12, confinados: 12, soldadura: 6 };
    if (configData) {
      configData.forEach((row: any) => { vConfig[row.tipo_documento] = row.periodo_meses; });
    }
    setVigenciasConfig(vConfig);

    // 3. Fetch latest logs
    fetchRegistrosRecientes();

    // 4. Fetch Empresas for Filter
    const { data: cData } = await supabase.from('contratistas').select('nombre');
    if (cData) setEmpresasUnicas(cData.map(c => c.nombre));
  };

  const fetchRegistrosRecientes = async () => {
    const { data } = await supabase
      .from('registros_acceso')
      .select('*, trabajadores(nombre, empresa, documento), proyectos(nombre)')
      .order('fecha_hora', { ascending: false })
      .limit(100);
    if (data) setRegistrosRecientes(data);
  };

  const calculateEstado = (dateStr: string) => {
    if (!dateStr) return "Faltante";
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const expiryDate = new Date(dateStr + 'T00:00:00');
    const diffDays = Math.ceil((expiryDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Vencido";
    if (diffDays <= 30) return "Por Vencer";
    return "Vigente";
  };

  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentoBusqueda.trim()) return;

    setEstadoAcceso(null);
    setTrabajadorActual(null);

    // 1. Buscar trabajador
    const { data: tData, error: tError } = await supabase.from('trabajadores').select('*').eq('documento', documentoBusqueda.trim()).single();
    
    if (tError || !tData) {
      // 1.5. Si no es trabajador, buscar en visitantes
      const { data: vData, error: vError } = await supabase.from('visitantes').select('*').eq('documento', documentoBusqueda.trim()).order('fecha_fin', { ascending: false }).limit(1).single();

      if (vError || !vData) {
        setEstadoAcceso({ 
          tipo: "NO_ENCONTRADO", 
          mensaje: "Persona No Registrada", 
          detalles: ["La cédula no pertenece a un trabajador ni a un visitante autorizado.", "Por favor, diríjase a RRHH o solicite un pase de visitante."] 
        });
        return;
      }

      // Lógica de Visitante
      setTrabajadorActual({ id: vData.id, nombre: vData.nombre, empresa: vData.empresa_origen || 'Visitante', cargo: 'VISITANTE', es_visitante: true });

      // Revisar si ya está adentro
      const { data: lastAccessV } = await supabase.from('registros_acceso').select('*').eq('visitante_id', vData.id).order('fecha_hora', { ascending: false }).limit(1).single();
      const isInsideV = lastAccessV && lastAccessV.tipo === 'ENTRADA';

      if (isInsideV) {
        setEstadoAcceso({ tipo: "SALIDA_LIBRE", mensaje: "Visitante en Planta", detalles: ["Salida de visitante autorizada."] });
        return;
      }

      // Validar ventana de tiempo
      const now = new Date();
      const dInicio = new Date(vData.fecha_inicio);
      const dFin = new Date(vData.fecha_fin);

      if (now < dInicio) {
        setEstadoAcceso({ tipo: "BLOQUEADO", mensaje: "ACCESO AÚN NO VÁLIDO", detalles: [`El pase de visita inicia el: ${dInicio.toLocaleString()}`] });
      } else if (now > dFin) {
        setEstadoAcceso({ tipo: "BLOQUEADO", mensaje: "PASE VENCIDO", detalles: [`El pase expiró el: ${dFin.toLocaleString()}`] });
      } else {
        setEstadoAcceso({ tipo: "PERMITIDO", mensaje: "VISITANTE AUTORIZADO", detalles: ["Pase activo en el rango permitido."] });
      }
      return;
    }

    setTrabajadorActual(tData);

    // 2. Determinar si está ADENTRO o AFUERA consultando su último movimiento (Trabajadores)
    const { data: lastAccess } = await supabase
      .from('registros_acceso')
      .select('*')
      .eq('trabajador_id', tData.id)
      .order('fecha_hora', { ascending: false })
      .limit(1)
      .single();

    const isInside = lastAccess && lastAccess.tipo === 'ENTRADA';

    // 3. Lógica según estado
    if (isInside) {
      // Si está adentro, habilitamos SALIDA LIBRE sin validar documentos
      setEstadoAcceso({ 
        tipo: "SALIDA_LIBRE", 
        mensaje: "Trabajador en Planta", 
        detalles: ["Salida libre autorizada.", "No se requieren verificaciones HSE para la salida."] 
      });
      return;
    }

    // 4. Si está AFUERA, procedemos a validar los documentos HSE para ENTRAR
    const { data: docsData } = await supabase.from('documentos_hse').select('*').eq('trabajador_id', tData.id);
    
    const requiredKeys = requiredDocsByCargo[tData.cargo] || ["ss", "examen"];
    const detallesVencidos: string[] = [];
    
    requiredKeys.forEach(key => {
      const doc = docsData?.find(d => d.tipo_documento === key);
      const estado = doc ? calculateEstado(doc.fecha_vencimiento) : "Faltante";
      const aprobacion = doc ? doc.estado_aprobacion : "Pendiente";
      
      if (estado === "Faltante" || estado === "Vencido" || aprobacion !== 'Aprobado') {
        let motivo = "Falta o está vencido";
        if (aprobacion === 'Rechazado') motivo = "Documento Rechazado";
        else if (aprobacion === 'Pendiente') motivo = "Aprobación Pendiente";
        detallesVencidos.push(`${motivo}: ${key.toUpperCase()}`);
      }
    });

    if (detallesVencidos.length > 0) {
      setEstadoAcceso({ tipo: "BLOQUEADO", mensaje: "ACCESO DENEGADO", detalles: detallesVencidos });
    } else {
      setEstadoAcceso({ tipo: "PERMITIDO", mensaje: "ACCESO AUTORIZADO", detalles: ["Todos los documentos HSE están al día y aprobados."] });
    }
  };

  const registrarAcceso = async (tipo: 'ENTRADA' | 'SALIDA') => {
    if (!trabajadorActual) return;
    
    const { error } = await supabase.from('registros_acceso').insert([{
      trabajador_id: trabajadorActual.id,
      tipo: tipo,
      proyecto_id: proyectoSeleccionado && proyectoSeleccionado !== "none" ? proyectoSeleccionado : null
    }]);

    if (!error) {
      setDocumentoBusqueda("");
      setTrabajadorActual(null);
      setEstadoAcceso(null);
      fetchRegistrosRecientes();
      generarReporte(); // Update report silently
    } else {
      alert("Error al guardar el registro.");
    }
  };

  // ----- REPORT LOGIC -----
  const generarReporte = async () => {
    let query = supabase
      .from('registros_acceso')
      .select('*, trabajadores!inner(nombre, empresa, documento), proyectos(nombre)')
      .order('fecha_hora', { ascending: false });

    // Rango
    const now = new Date();
    if (filtroRango === 'hoy') {
      const today = new Date(now.setHours(0,0,0,0)).toISOString();
      query = query.gte('fecha_hora', today);
    } else if (filtroRango === 'semana') {
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('fecha_hora', lastWeek);
    } else if (filtroRango === 'mes') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      query = query.gte('fecha_hora', startOfMonth);
    }

    // Empresa (using standard Supabase syntax for related table filtering)
    if (filtroEmpresa !== 'todas') {
      query = query.eq('trabajadores.empresa', filtroEmpresa);
    }

    // Proyecto
    if (filtroProyecto !== 'todos') {
      if (filtroProyecto === 'general') {
        query = query.is('proyecto_id', null);
      } else {
        query = query.eq('proyecto_id', filtroProyecto);
      }
    }

    const { data, error } = await query;
    if (data) {
      setReportData(data);
    }
  };

  const exportarCsv = () => {
    if (reportData.length === 0) return alert("No hay datos para exportar");
    
    const exportFormat = reportData.map(r => ({
      Fecha: new Date(r.fecha_hora).toLocaleDateString(),
      Hora: new Date(r.fecha_hora).toLocaleTimeString(),
      Documento: r.trabajadores?.documento,
      Trabajador: r.trabajadores?.nombre,
      Empresa: r.trabajadores?.empresa,
      Tipo: r.tipo,
      Proyecto: r.proyectos?.nombre || 'General'
    }));

    const csv = Papa.unparse(exportFormat, { delimiter: ";" });
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_accesos_${filtroRango}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const registrosFiltrados = registrosRecientes.filter(r => {
    if (transitosFiltroTipo !== "TODOS" && r.tipo !== transitosFiltroTipo) return false;
    if (transitosSearch) {
      const search = transitosSearch.toLowerCase();
      const nombre = (r.trabajadores?.nombre || "").toLowerCase();
      const empresa = (r.trabajadores?.empresa || "").toLowerCase();
      if (!nombre.includes(search) && !empresa.includes(search)) return false;
    }
    return true;
  });

  const registrosPaginados = registrosFiltrados.slice(0, visibleLimit);

  const registrosAgrupados = registrosPaginados.reduce((acc, curr) => {
    const fecha = new Date(curr.fecha_hora);
    const dateKey = fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const dateKeyCap = dateKey.charAt(0).toUpperCase() + dateKey.slice(1);
    if (!acc[dateKeyCap]) acc[dateKeyCap] = [];
    acc[dateKeyCap].push(curr);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Control de Acceso (Torniquete)</h1>
          <p className="text-slate-500 text-sm mt-1">Gestión de ingresos a planta y validación automática de HSE.</p>
        </div>
      </div>

      <Tabs defaultValue="registro" className="space-y-6">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="registro" className="font-semibold"><DoorOpen className="w-4 h-4 mr-2" /> Registro en Vivo</TabsTrigger>
          <TabsTrigger value="reportes" className="font-semibold"><FileCheck className="w-4 h-4 mr-2" /> Reportes de Tránsito</TabsTrigger>
        </TabsList>

        <TabsContent value="registro" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-slate-200 shadow-sm border-t-4 border-t-blue-600">
              <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                <CardTitle className="text-lg flex items-center gap-2"><Search className="w-5 h-5 text-blue-600"/> Identificación</CardTitle>
                <CardDescription>Escanee o digite la cédula del trabajador.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleBuscar} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="doc" className="text-sm font-bold text-slate-700">N° Documento (Cédula)</Label>
                    <Input 
                      id="doc"
                      placeholder="Ej. 1045223112" 
                      value={documentoBusqueda}
                      onChange={(e) => setDocumentoBusqueda(e.target.value)}
                      className="h-12 text-lg font-bold text-center tracking-wider"
                      autoFocus
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 text-md font-bold bg-slate-900 text-white hover:bg-slate-800">
                    Verificar Estado
                  </Button>
                </form>

                {estadoAcceso && (
                  <div className={`mt-6 p-4 rounded-lg border-2 ${
                    estadoAcceso.tipo === 'PERMITIDO' ? 'bg-green-50 border-green-200' : 
                    estadoAcceso.tipo === 'SALIDA_LIBRE' ? 'bg-blue-50 border-blue-200' :
                    estadoAcceso.tipo === 'NO_ENCONTRADO' ? 'bg-slate-100 border-slate-300' :
                    'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-3 mb-2">
                      {estadoAcceso.tipo === 'PERMITIDO' ? <CheckCircle2 className="w-8 h-8 text-green-600"/> : 
                       estadoAcceso.tipo === 'SALIDA_LIBRE' ? <LogOut className="w-8 h-8 text-blue-600"/> :
                       estadoAcceso.tipo === 'NO_ENCONTRADO' ? <UserCircle className="w-8 h-8 text-slate-500"/> :
                       <XCircle className="w-8 h-8 text-red-600"/>}
                      <h3 className={`text-xl font-black ${
                        estadoAcceso.tipo === 'PERMITIDO' ? 'text-green-700' : 
                        estadoAcceso.tipo === 'SALIDA_LIBRE' ? 'text-blue-700' :
                        estadoAcceso.tipo === 'NO_ENCONTRADO' ? 'text-slate-700' :
                        'text-red-700'
                      }`}>{estadoAcceso.mensaje}</h3>
                    </div>
                    {trabajadorActual && estadoAcceso.tipo !== 'NO_ENCONTRADO' && (
                      <div className="mb-3 text-sm font-medium text-slate-700">
                        <p>{trabajadorActual.nombre} • <span className="font-bold">{trabajadorActual.empresa}</span></p>
                        <p className="text-xs text-slate-500">{trabajadorActual.cargo}</p>
                      </div>
                    )}
                    <ul className={`text-sm space-y-1 mb-4 ${estadoAcceso.tipo === 'NO_ENCONTRADO' ? 'text-slate-600 font-medium' : 'text-slate-600'}`}>
                      {estadoAcceso.detalles.map((d, i) => <li key={i} className="flex items-center gap-2">• {d}</li>)}
                    </ul>

                    {estadoAcceso.tipo === 'PERMITIDO' && (
                      <div className="space-y-4 pt-4 border-t border-green-200">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-green-800 uppercase tracking-wider">Proyecto Destino (Opcional)</Label>
                          <Select value={proyectoSeleccionado} onValueChange={(val) => setProyectoSeleccionado(val || '')}>
                            <SelectTrigger className="bg-white border-green-200 focus:ring-green-500">
                              <SelectValue placeholder="Ninguno en particular" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Ninguno / General</SelectItem>
                              {proyectos.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={() => registrarAcceso('ENTRADA')} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12">
                          <DoorOpen className="w-5 h-5 mr-2" /> REGISTRAR ENTRADA
                        </Button>
                      </div>
                    )}

                    {estadoAcceso.tipo === 'SALIDA_LIBRE' && (
                      <div className="pt-4 border-t border-blue-200">
                        <Button onClick={() => registrarAcceso('SALIDA')} className="w-full bg-[#0a1e36] hover:bg-[#163354] text-white font-bold h-12">
                          <LogOut className="w-5 h-5 mr-2" /> MARCAR SALIDA AHORA
                        </Button>
                      </div>
                    )}

                    {estadoAcceso.tipo === 'NO_ENCONTRADO' && (
                      <div className="pt-4 border-t border-slate-300">
                         <Button onClick={() => { setDocumentoBusqueda(""); setEstadoAcceso(null); }} variant="outline" className="w-full text-slate-700 font-bold h-12 border-slate-300">
                           INTENTAR CON OTRA CÉDULA
                         </Button>
                      </div>
                    )}

                    {estadoAcceso.tipo === 'BLOQUEADO' && (
                      <div className="pt-4 border-t border-red-200">
                         <Button onClick={() => { setDocumentoBusqueda(""); setEstadoAcceso(null); }} variant="outline" className="w-full text-red-700 font-bold h-12 border-red-200 bg-white hover:bg-red-50">
                           CANCELAR INGRESO
                         </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
              <CardHeader className="bg-[#0a1e36] text-white pb-6 rounded-b-xl">
                <CardTitle className="text-lg">Tránsitos Recientes</CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Buscar por Nombre o Empresa" 
                      className="pl-9 h-9" 
                      value={transitosSearch}
                      onChange={e => setTransitosSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-md text-sm font-medium">
                    <button onClick={() => setTransitosFiltroTipo('TODOS')} className={`px-3 py-1 rounded-md transition-colors ${transitosFiltroTipo === 'TODOS' ? 'bg-[#0a1e36] text-white' : 'text-slate-600 hover:bg-slate-200'}`}>Todos</button>
                    <button onClick={() => setTransitosFiltroTipo('ENTRADA')} className={`px-3 py-1 rounded-md transition-colors ${transitosFiltroTipo === 'ENTRADA' ? 'bg-green-100 text-green-800' : 'text-slate-600 hover:bg-slate-200'}`}>Ver Entradas</button>
                    <button onClick={() => setTransitosFiltroTipo('SALIDA')} className={`px-3 py-1 rounded-md transition-colors ${transitosFiltroTipo === 'SALIDA' ? 'bg-red-100 text-red-800' : 'text-slate-600 hover:bg-slate-200'}`}>Ver Salidas</button>
                  </div>
                </div>

                <div className="overflow-auto border border-slate-100 rounded-lg flex-1">
                  <Table>
                    <TableHeader className="bg-white sticky top-0 z-10 shadow-sm">
                      <TableRow className="border-b-2">
                        <TableHead className="w-[80px] font-bold text-slate-800 text-xs uppercase">Hora</TableHead>
                        <TableHead className="font-bold text-slate-800 text-xs uppercase">Personal</TableHead>
                        <TableHead className="w-[120px] text-center font-bold text-slate-800 text-xs uppercase">Registro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.keys(registrosAgrupados).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-slate-500 py-10">
                            No hay registros que coincidan con la búsqueda.
                          </TableCell>
                        </TableRow>
                      ) : (
                        Object.keys(registrosAgrupados).map(dateKey => (
                          <React.Fragment key={dateKey}>
                            <TableRow className="bg-slate-50 hover:bg-slate-50">
                              <TableCell colSpan={3} className="font-bold text-slate-700 py-2 border-b">
                                {dateKey}
                              </TableCell>
                            </TableRow>
                            {registrosAgrupados[dateKey].map(r => (
                              <TableRow key={r.id} className="hover:bg-slate-50/80 transition-colors group">
                                <TableCell className="align-middle py-3">
                                  <span className="font-bold text-slate-700">
                                    {new Date(r.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute:'2-digit' })}
                                  </span>
                                </TableCell>
                                <TableCell className="py-3">
                                  <div className="font-black text-slate-900 group-hover:text-blue-700 transition-colors">{r.trabajadores?.nombre}</div>
                                  <div className="text-[11px] text-slate-500 font-medium">{r.trabajadores?.empresa}</div>
                                </TableCell>
                                <TableCell className="text-center align-middle py-3">
                                  <div className="flex justify-center">
                                    <Badge className={`w-20 justify-center h-6 rounded-full flex items-center ${r.tipo === 'ENTRADA' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-red-100 text-red-700 hover:bg-red-100'}`}>
                                      {r.tipo}
                                    </Badge>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </React.Fragment>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                {registrosFiltrados.length > visibleLimit && (
                  <div className="pt-4 flex justify-center">
                    <Button variant="ghost" onClick={() => setVisibleLimit(prev => prev + 10)} className="text-slate-500 text-sm">
                      Show more
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reportes">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle>Reportes de Tránsito</CardTitle>
              <CardDescription>Filtra y exporta las entradas y salidas de la planta.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Select value={filtroRango} onValueChange={(val) => setFiltroRango(val || '')}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Rango de Fechas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hoy">Hoy</SelectItem>
                    <SelectItem value="semana">Últimos 7 días</SelectItem>
                    <SelectItem value="mes">Este Mes</SelectItem>
                    <SelectItem value="todo">Histórico Completo</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filtroEmpresa} onValueChange={(val) => setFiltroEmpresa(val || '')}>
                  <SelectTrigger className="w-full sm:w-[220px]">
                    <SelectValue placeholder="Filtrar por Empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las Empresas</SelectItem>
                    {empresasUnicas.map(e => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filtroProyecto} onValueChange={(val) => setFiltroProyecto(val || '')}>
                  <SelectTrigger className="w-full sm:w-[220px]">
                    <SelectValue placeholder="Filtrar por Proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los Destinos</SelectItem>
                    <SelectItem value="general">Planta General (Sin Proyecto)</SelectItem>
                    {proyectos.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" className="ml-auto bg-slate-900 text-white hover:bg-slate-800" onClick={exportarCsv}>
                  <Download className="w-4 h-4 mr-2"/> Exportar CSV
                </Button>
              </div>

              <div className="border border-slate-200 rounded-md">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Fecha y Hora</TableHead>
                      <TableHead>Trabajador</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Proyecto/Destino</TableHead>
                      <TableHead className="text-center">Movimiento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-sm">
                          <div className="font-semibold">{new Date(r.fecha_hora).toLocaleDateString()}</div>
                          <div className="text-xs text-slate-500">{new Date(r.fecha_hora).toLocaleTimeString()}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-slate-800 text-sm">{r.trabajadores?.nombre}</div>
                          <div className="text-xs text-slate-500">C.C. {r.trabajadores?.documento}</div>
                        </TableCell>
                        <TableCell className="text-sm font-medium">{r.trabajadores?.empresa}</TableCell>
                        <TableCell className="text-sm text-slate-600">{r.proyectos?.nombre || 'Planta General'}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={r.tipo === 'ENTRADA' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}>
                            {r.tipo}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {reportData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                          No hay registros que coincidan con los filtros seleccionados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
