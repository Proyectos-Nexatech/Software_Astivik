"use client";

import { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ship, Plus, Search, Building2, Users, AlertCircle, FileCheck, Anchor, Filter, Loader2, CheckCircle2, Upload, Download, X, LayoutGrid, List } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

// Mock Data Contratistas (Estadísticas globales para el footer)
const mockContratistasStats = [
  { id: 1, empresa: "Metalprest", especialidad: "Soldadura", asignados: 25, habilitacion: 96, docPendientes: 1 },
  { id: 2, empresa: "Pinturas Marinas SAS", especialidad: "Sandblasting", asignados: 12, habilitacion: 85, docPendientes: 3 },
  { id: 3, empresa: "ElecNaval", especialidad: "Electricidad", asignados: 8, habilitacion: 100, docPendientes: 0 },
];

export default function ProyectosPage() {
  const supabase = createClient();
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [contratistasDirectorio, setContratistasDirectorio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Modals
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  // New Project Form
  const [nuevoNombre, setNuevoNombre] = useState("");
  
  // Details Modal State
  const [selectedProyecto, setSelectedProyecto] = useState<any>(null);
  const [actividades, setActividades] = useState<any[]>([]);
  const [nuevaActividad, setNuevaActividad] = useState("");
  const [asignandoContratista, setAsignandoContratista] = useState<Record<string, string>>({}); // {actividadId: contratistaId}

  // CSV Upload State
  const fileInputActividadesRef = useRef<HTMLInputElement>(null);
  const [isCsvActividadesModalOpen, setIsCsvActividadesModalOpen] = useState(false);
  const csvActividadesTemplate = "data:text/csv;charset=utf-8,%EF%BB%BFNombre%0APintura de Casco%0ALimpieza de Tanques%0ASoldadura en Cubierta";
  
  // PDF Upload State
  const fileInputPdfRef = useRef<HTMLInputElement>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    // 1. Fetch Proyectos
    const { data: pData } = await supabase.from('proyectos').select('*').order('created_at', { ascending: false });
    
    // 2. Fetch Trabajadores for Aforo
    const { data: tData } = await supabase.from('trabajadores').select('id, proyecto_asignado');

    // 2.5 Fetch Registros de Acceso de Hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Para asegurarnos del timezone local, construimos la fecha en ISO (YYYY-MM-DD)
    const tzOffset = today.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().split('T')[0] + 'T00:00:00.000Z';
    
    const { data: rData } = await supabase.from('registros_acceso')
      .select('trabajador_id, tipo')
      .gte('fecha_hora', localISOTime)
      .order('fecha_hora', { ascending: true });

    const insideWorkers = new Set();
    if (rData) {
      const stateByWorker: Record<string, string> = {};
      rData.forEach((r: any) => {
        if (r.trabajador_id) stateByWorker[r.trabajador_id] = r.tipo;
      });
      Object.entries(stateByWorker).forEach(([id, tipo]) => {
         if (tipo === 'ENTRADA') insideWorkers.add(id);
      });
    }

    if (pData) {
      const proyectosWithAforo = pData.map(p => {
        const aforo = tData ? tData.filter(t => t.proyecto_asignado === p.nombre && insideWorkers.has(t.id)).length : 0;
        return { ...p, aforo };
      });
      setProyectos(proyectosWithAforo);
    }
    
    // 3. Fetch Directorio Contratistas
    const { data: cData } = await supabase.from('contratistas').select('*').order('nombre', { ascending: true });
    if (cData) setContratistasDirectorio(cData);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCrearProyecto = async () => {
    if (nuevoNombre.trim()) {
      const { data, error } = await supabase.from('proyectos').insert([{
        nombre: nuevoNombre,
        tipo: "Nuevo Proyecto",
        estado: "Activo",
        empresa_principal: "Múltiples",
        salud: "Optimo",
        aforo: 0
      }]).select();

      if (!error && data) {
        setProyectos([data[0], ...proyectos]);
      } else {
        console.error(error);
        alert("Error al guardar el proyecto. Verifica permisos.");
      }
      setNuevoNombre("");
      setIsNewProjectModalOpen(false);
    }
  };

  const [projectStats, setProjectStats] = useState<any[]>([]);

  // ----- LOGIC FOR DETAILS MODAL & ACTIVITIES -----
  
  const openDetailsModal = async (proyecto: any) => {
    setSelectedProyecto(proyecto);
    setIsDetailsModalOpen(true);
    await fetchActividades(proyecto.id);
  };
  
  const computeStatsForContratistas = async (contratistasList: any[]) => {
    if (contratistasList.length === 0) return [];
    
    const { data: workersData } = await supabase.from('trabajadores').select('*');
    const { data: docsData } = await supabase.from('documentos_hse').select('*');
    
    const requiredDocsByCargo: Record<string, string[]> = {
      "Soldador 1A": ["ss", "examen", "alturas", "confinados", "soldadura"],
      "Sandblaster": ["ss", "examen", "alturas", "confinados"],
      "Electricista": ["ss", "examen", "alturas"]
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

    const getGlobalStatus = (docs: any) => {
      let hasVencido = false;
      let hasWarning = false;
      let hasFaltante = false;
      let hasNoAprobado = false;
      Object.values(docs).forEach((doc: any) => {
        if (doc) {
          if (doc.estado === "Vencido") hasVencido = true;
          if (doc.estado === "Faltante") hasFaltante = true;
          if (doc.estado === "Por Vencer") hasWarning = true;
          if (doc.estado_aprobacion !== "Aprobado" && doc.estado !== "Faltante") hasNoAprobado = true;
        }
      });
      if (hasVencido || hasFaltante || hasNoAprobado) return "INHABILITADO";
      if (hasWarning) return "ALERTA PREVENTIVA";
      return "HABILITADO";
    };

    return contratistasList.map((c: any) => {
      const cWorkers = (workersData || []).filter(w => 
        w.empresa?.toLowerCase() === c.nombre?.toLowerCase() || 
        w.empresa?.toLowerCase().includes(c.nombre?.toLowerCase())
      );
      
      let habilitados = 0;
      cWorkers.forEach(worker => {
        const docsMap: any = {};
        const requiredKeys = requiredDocsByCargo[worker.cargo] || ["ss", "examen"];
        requiredKeys.forEach(key => { docsMap[key] = { estado: "Faltante", estado_aprobacion: "Pendiente" }; });
        
        docsData?.filter(d => d.trabajador_id === worker.id).forEach(d => {
          if (d.tipo_documento && requiredKeys.includes(d.tipo_documento)) {
            docsMap[d.tipo_documento] = {
              estado: calculateEstado(d.fecha_vencimiento),
              estado_aprobacion: d.estado_aprobacion || "Pendiente"
            };
          }
        });

        const globalStatus = getGlobalStatus(docsMap);
        if (globalStatus === "HABILITADO" || globalStatus === "ALERTA PREVENTIVA") habilitados++;
      });

      const totalWorkers = cWorkers.length;
      const aptoPorcentaje = totalWorkers > 0 ? Math.round((habilitados / totalWorkers) * 100) : 0;

      return {
        id: c.nombre, // use nombre as unique key
        empresa: c.nombre,
        asignados: totalWorkers,
        habilitacion: aptoPorcentaje
      };
    });
  };

  const fetchActividades = async (proyectoId: string) => {
    // Fetch actividades y sus asignaciones
    const { data, error } = await supabase
      .from('proyecto_actividades')
      .select(`
        *,
        actividad_contratistas(
          contratista_id,
          contratistas(nombre, especialidad)
        )
      `)
      .eq('proyecto_id', proyectoId)
      .order('created_at', { ascending: true });
      
    if (data) {
      setActividades(data);
      
      const uniqueContratistas = new Map();
      data.forEach(act => {
        act.actividad_contratistas?.forEach((ac: any) => {
           if (ac.contratistas && !uniqueContratistas.has(ac.contratista_id)) {
              uniqueContratistas.set(ac.contratista_id, ac.contratistas);
           }
        });
      });

      const stats = await computeStatsForContratistas(Array.from(uniqueContratistas.values()));
      setProjectStats(stats);
    }
  };

  const handleAddActividad = async () => {
    if (!nuevaActividad.trim() || !selectedProyecto) return;
    
    const { data, error } = await supabase.from('proyecto_actividades').insert([{
      proyecto_id: selectedProyecto.id,
      nombre: nuevaActividad,
      estado: "ACTIVO"
    }]).select(`*, actividad_contratistas(contratista_id, contratistas(nombre, especialidad))`);
    
    if (data && !error) {
      setActividades([...actividades, data[0]]);
      setNuevaActividad("");
    }
  };

  const handleCsvUploadActividades = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedProyecto) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const nuevasActividades = results.data
            .filter((row: any) => row.Nombre || row.nombre)
            .map((row: any) => ({
              proyecto_id: selectedProyecto.id,
              nombre: row.Nombre || row.nombre,
              estado: "ACTIVO"
            }));
            
          if (nuevasActividades.length > 0) {
            const { error } = await supabase.from('proyecto_actividades').insert(nuevasActividades);
            if (!error) {
              await fetchActividades(selectedProyecto.id);
            } else {
              alert("Error al cargar actividades desde CSV.");
            }
          }
          setIsCsvActividadesModalOpen(false);
        }
      });
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedProyecto) {
      if (file.type !== "application/pdf") {
        alert("Por favor, sube un archivo PDF.");
        return;
      }
      setUploadingPdf(true);
      const fileName = `cronograma_${selectedProyecto.id}_${Date.now()}.pdf`;
      
      const { data, error } = await supabase.storage
        .from('hse_docs')
        .upload(fileName, file);
        
      if (error) {
        alert("Error al subir el archivo: " + error.message);
        setUploadingPdf(false);
        return;
      }
      
      const { data: urlData } = supabase.storage.from('hse_docs').getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;
      
      // Update DB
      const { error: dbError } = await supabase
        .from('proyectos')
        .update({ cronograma_pdf: publicUrl })
        .eq('id', selectedProyecto.id);
        
      if (!dbError) {
        setSelectedProyecto({ ...selectedProyecto, cronograma_pdf: publicUrl });
        fetchData(); // refresh the main list
      } else {
        alert("Error al guardar la URL en el proyecto.");
      }
      setUploadingPdf(false);
    }
  };

  const handleAssignContratista = async (actividadId: string) => {
    const contratistaId = asignandoContratista[actividadId];
    if (!contratistaId) return;

    const { error } = await supabase.from('actividad_contratistas').insert([{
      actividad_id: actividadId,
      contratista_id: contratistaId
    }]);

    if (!error) {
      // Refresh actividades
      await fetchActividades(selectedProyecto.id);
      // Reset select
      setAsignandoContratista({...asignandoContratista, [actividadId]: ""});
    } else {
      alert("Error al asignar: El contratista podría ya estar asignado a esta actividad.");
    }
  };

  const getSaludColor = (salud: string) => {
    if (salud === "Optimo") return "bg-green-500";
    if (salud === "Riesgo Medio") return "bg-yellow-500";
    if (salud === "Riesgo Crítico") return "bg-red-500";
    return "bg-slate-500";
  };

  if (loading && proyectos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <span className="text-slate-600 font-medium animate-pulse">Sincronizando Base de Datos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Directorio de Proyectos y Barcos</h1>
          <p className="text-slate-500 text-sm mt-1">Gestión de personal asignado, actividades y estado documental HSE por proyecto.</p>
        </div>
        <Dialog open={isNewProjectModalOpen} onOpenChange={setIsNewProjectModalOpen}>
          <Button onClick={() => setIsNewProjectModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white font-medium">
            <Plus className="w-4 h-4 mr-2" />
            NUEVO PROYECTO
          </Button>
          <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden" showCloseButton={false}>
            <div className="px-6 py-4 bg-slate-900 text-white border-b border-slate-800 relative flex items-start justify-between">
              <div>
                <DialogTitle className="text-xl">Agregar Nuevo Proyecto</DialogTitle>
                <DialogDescription className="text-slate-400 mt-1">
                  Crea un nuevo proyecto o registra un barco para asignar contratistas.
                </DialogDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsNewProjectModalOpen(false)}
                className="text-slate-400 hover:text-white hover:bg-slate-800 -mr-2 -mt-1"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="px-6 py-4 grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre del Proyecto / Barco</Label>
                <Input 
                  id="name" 
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej. Buque Esmeralda" 
                />
              </div>
            </div>
            <DialogFooter className="px-6 pb-6 pt-2 bg-transparent border-t-0">
              <Button onClick={handleCrearProyecto} className="bg-slate-900 text-white w-full">Guardar Proyecto</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Buscar por nombre o contratista..." className="pl-9 bg-slate-50 border-none" />
        </div>
        <div className="flex gap-2 border-r border-slate-200 pr-4">
          <Button variant={viewMode === "grid" ? "default" : "outline"} size="icon" onClick={() => setViewMode("grid")} className={viewMode === "grid" ? "bg-slate-900 text-white" : "bg-white"}>
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button variant={viewMode === "list" ? "default" : "outline"} size="icon" onClick={() => setViewMode("list")} className={viewMode === "list" ? "bg-slate-900 text-white" : "bg-white"}>
            <List className="w-4 h-4" />
          </Button>
        </div>
        <Button variant="outline" className="shrink-0 bg-white"><Filter className="w-4 h-4 mr-2" /> Filtros</Button>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {proyectos.map((proyecto) => (
            <Card key={proyecto.id} className="overflow-hidden hover:shadow-md transition-shadow border-slate-200 flex flex-col">
              <div className="h-2 w-full bg-slate-100 flex shrink-0">
                <div className={`h-full ${getSaludColor(proyecto.salud)} w-full`}></div>
              </div>
              <CardHeader className="pb-3 flex-1">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 font-semibold mb-2">
                    {proyecto.tipo}
                  </Badge>
                  <Badge className={proyecto.estado === 'Activo' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}>
                    {proyecto.estado}
                  </Badge>
                </div>
                <CardTitle className="text-lg font-bold text-slate-900 leading-tight">
                  {proyecto.nombre}
                </CardTitle>
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                  <Building2 className="w-3 h-3" /> {proyecto.empresa_principal}
                </p>
              </CardHeader>
              <CardContent className="shrink-0">
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="bg-slate-50 rounded p-3 border border-slate-100">
                     <div className="text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1"><Users className="w-3 h-3"/> AFORO ACTUAL</div>
                     <div className="text-xl font-bold text-slate-900">{proyecto.aforo} <span className="text-xs font-normal text-slate-500">trabajadores</span></div>
                  </div>
                  <div className="bg-slate-50 rounded p-3 border border-slate-100">
                     <div className="text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1"><FileCheck className="w-3 h-3"/> SALUD HSE</div>
                     <div className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 mt-1">
                       <div className={`w-2 h-2 rounded-full ${getSaludColor(proyecto.salud)}`}></div>
                       {proyecto.salud}
                     </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 border-t border-slate-100 px-6 py-3 shrink-0 mt-auto">
                <Button variant="link" onClick={() => openDetailsModal(proyecto)} className="px-0 text-slate-600 hover:text-slate-900 font-semibold text-sm w-full justify-between">
                  Ver Contratistas y Detalles <Anchor className="w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-bold text-slate-700 px-6">Proyecto / Barco</TableHead>
                <TableHead className="font-bold text-slate-700">Empresa Principal</TableHead>
                <TableHead className="font-bold text-slate-700 text-center">Tipo</TableHead>
                <TableHead className="font-bold text-slate-700 text-center">Aforo</TableHead>
                <TableHead className="font-bold text-slate-700 text-center">Salud HSE</TableHead>
                <TableHead className="font-bold text-slate-700 text-right px-6">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proyectos.map((proyecto) => (
                <TableRow key={proyecto.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-semibold text-slate-900 px-6 py-4">{proyecto.nombre}</TableCell>
                  <TableCell className="text-slate-500"><div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-slate-400" /> {proyecto.empresa_principal}</div></TableCell>
                  <TableCell className="text-center"><Badge variant="outline" className="bg-slate-50 text-slate-600">{proyecto.tipo}</Badge></TableCell>
                  <TableCell className="text-center font-medium text-slate-700">{proyecto.aforo}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={`${proyecto.salud === 'Optimo' ? 'bg-green-50 text-green-700 border-green-200' : proyecto.salud === 'Riesgo Medio' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      {proyecto.salud}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <Button variant="ghost" size="sm" onClick={() => openDetailsModal(proyecto)} className="text-blue-600 font-semibold hover:bg-blue-50">
                      Gestionar <Anchor className="w-4 h-4 ml-2" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {proyectos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500 py-6">No hay proyectos encontrados.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Details & Activities Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-[750px] p-0 overflow-hidden" showCloseButton={false}>
          {selectedProyecto && (
            <>
              <div className="px-6 py-4 bg-slate-900 text-white border-b border-slate-800 relative flex items-start justify-between">
                <div>
                  <DialogTitle className="text-xl flex items-center gap-4">
                    {selectedProyecto.nombre}
                    <Badge className="bg-blue-600 text-white border-blue-500">{selectedProyecto.estado}</Badge>
                  </DialogTitle>
                  <DialogDescription className="text-slate-400 mt-1">
                    Configuración de HSE y asignación de contratistas por actividad.
                  </DialogDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="text-slate-400 hover:text-white hover:bg-slate-800 -mr-2 -mt-1"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="p-6">
                <Tabs defaultValue="actividades">
                  <TabsList className="w-full grid grid-cols-2 bg-slate-100 mb-6">
                    <TabsTrigger value="actividades">Cronograma / Actividades</TabsTrigger>
                    <TabsTrigger value="resumen">Resumen HSE Global</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="actividades" className="space-y-6">
                    <Dialog open={isCsvActividadesModalOpen} onOpenChange={setIsCsvActividadesModalOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Carga Masiva de Actividades</DialogTitle>
                          <DialogDescription>
                            Sube un archivo .csv para agregar múltiples actividades al mismo tiempo. Sigue estos pasos:<br/>
                            1. Descarga la plantilla base.<br/>
                            2. Llena la columna "Nombre" con tus actividades.<br/>
                            3. Sube el archivo modificado aquí.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-6 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
                          <input 
                            type="file" 
                            accept=".csv" 
                            className="hidden" 
                            ref={fileInputActividadesRef}
                            onChange={handleCsvUploadActividades}
                          />
                          <Button variant="secondary" onClick={() => fileInputActividadesRef.current?.click()}>
                            Seleccionar Archivo CSV
                          </Button>
                          <p className="text-xs text-slate-500 mt-2">Columna esperada: Nombre</p>
                        </div>
                        <DialogFooter>
                          <a href={csvActividadesTemplate} download="plantilla_actividades.csv">
                            <Button variant="link" size="sm" className="text-blue-600">
                              <Download className="w-4 h-4 mr-1" /> Descargar Plantilla
                            </Button>
                          </a>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <Label className="text-slate-700 font-bold block">Crear Nueva Actividad</Label>
                        <div className="flex gap-2">
                          {selectedProyecto.cronograma_pdf && (
                            <a href={selectedProyecto.cronograma_pdf} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm" className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50">
                                Ver PDF
                              </Button>
                            </a>
                          )}
                          <input 
                            type="file" 
                            accept=".pdf" 
                            className="hidden" 
                            ref={fileInputPdfRef}
                            onChange={handlePdfUpload}
                          />
                          <Button variant="outline" size="sm" onClick={() => fileInputPdfRef.current?.click()} className="h-8" disabled={uploadingPdf}>
                            {uploadingPdf ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <FileCheck className="w-3 h-3 mr-1" />} 
                            {uploadingPdf ? "Subiendo..." : "Subir PDF"}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setIsCsvActividadesModalOpen(true)} className="h-8">
                            <Upload className="w-3 h-3 mr-1" /> Carga CSV
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Ej. Pintura de Casco, Inspección Tanques..." 
                          value={nuevaActividad}
                          onChange={(e) => setNuevaActividad(e.target.value)}
                          className="bg-white"
                        />
                        <Button onClick={handleAddActividad} className="bg-blue-600 hover:bg-blue-700 text-white">
                          <Plus className="w-4 h-4 mr-2"/> Actividad
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                      {actividades.length === 0 ? (
                        <p className="text-center text-slate-500 py-8 italic text-sm">No hay actividades creadas en este proyecto aún.</p>
                      ) : (
                        actividades.map(act => (
                          <Card key={act.id} className="border-slate-200 shadow-sm overflow-hidden">
                            <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                              <h3 className="font-bold text-slate-800">{act.nombre}</h3>
                              <Badge variant="outline" className="text-[10px] tracking-wider font-bold text-slate-500">{act.estado}</Badge>
                            </div>
                            <div className="p-4 bg-white">
                              <Label className="text-xs text-slate-500 font-bold mb-2 block uppercase tracking-wider">Contratistas Asignados</Label>
                              {act.actividad_contratistas?.length > 0 ? (
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {act.actividad_contratistas.map((ac: any) => (
                                    <Badge key={ac.contratista_id} variant="secondary" className="bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100">
                                      <Building2 className="w-3 h-3 mr-1" />
                                      {ac.contratistas.nombre}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400 italic mb-4">No hay contratistas asignados a esta actividad.</p>
                              )}
                              
                              <div className="flex gap-2 items-end mt-2 pt-2 border-t border-slate-100">
                                <div className="flex-1">
                                  <Select 
                                    value={asignandoContratista[act.id] || ""} 
                                    onValueChange={(val) => setAsignandoContratista({...asignandoContratista, [act.id]: val})}
                                  >
                                    <SelectTrigger className="h-8 text-xs bg-slate-50">
                                      <SelectValue placeholder="Seleccionar contratista..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {contratistasDirectorio.map(c => (
                                        <SelectItem key={c.id} value={c.id} className="text-xs">{c.nombre} ({c.especialidad})</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-8 text-xs font-semibold"
                                  onClick={() => handleAssignContratista(act.id)}
                                  disabled={!asignandoContratista[act.id]}
                                >
                                  Asignar
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="resumen" className="space-y-4">
                    <div className="flex gap-4 mb-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                       <div className="flex-1 text-center border-r border-slate-200">
                         <p className="text-xs font-bold text-slate-500 mb-1">SALUD GLOBAL</p>
                         <p className="font-bold flex justify-center items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${getSaludColor(selectedProyecto.salud)}`}></div>{selectedProyecto.salud}</p>
                       </div>
                       <div className="flex-1 text-center">
                         <p className="text-xs font-bold text-slate-500 mb-1">AFORO TOTAL</p>
                         <p className="font-bold text-slate-900">{selectedProyecto.aforo} trabajadores</p>
                       </div>
                    </div>
                    
                    <h3 className="text-sm font-semibold text-slate-900 mt-4 mb-2">Desempeño General Contratistas</h3>
                    <div className="border border-slate-200 rounded-md">
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead className="font-bold">Empresa</TableHead>
                            <TableHead className="text-center font-bold">Personal</TableHead>
                            <TableHead className="text-right font-bold">% Apto</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {projectStats.length > 0 ? projectStats.map((c) => (
                            <TableRow key={c.id}>
                              <TableCell className="font-medium text-xs">{c.empresa}</TableCell>
                              <TableCell className="text-center text-xs">{c.asignados}</TableCell>
                              <TableCell className="text-right text-xs">
                                <span className={`font-bold ${c.habilitacion >= 95 ? 'text-green-600' : c.habilitacion >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {c.habilitacion}%
                                </span>
                              </TableCell>
                            </TableRow>
                          )) : (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center py-4 text-xs text-slate-500 italic">No hay contratistas asignados a las actividades de este proyecto.</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>


    </div>
  );
}
