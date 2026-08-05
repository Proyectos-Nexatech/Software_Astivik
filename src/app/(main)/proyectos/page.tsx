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
import { Ship, Plus, Search, Building2, Users, AlertCircle, FileCheck, Anchor, Filter, Loader2, CheckCircle2, Upload, Download } from "lucide-react";
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

  const fetchData = async () => {
    setLoading(true);
    // 1. Fetch Proyectos
    const { data: pData } = await supabase.from('proyectos').select('*').order('created_at', { ascending: false });
    if (pData) setProyectos(pData);
    
    // 2. Fetch Directorio Contratistas
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

  // ----- LOGIC FOR DETAILS MODAL & ACTIVITIES -----
  
  const openDetailsModal = async (proyecto: any) => {
    setSelectedProyecto(proyecto);
    setIsDetailsModalOpen(true);
    await fetchActividades(proyecto.id);
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
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Proyecto</DialogTitle>
              <DialogDescription>
                Crea un nuevo proyecto o registra un barco para asignar contratistas.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
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
            <DialogFooter>
              <Button onClick={handleCrearProyecto} className="bg-slate-900 text-white">Guardar Proyecto</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Buscar por nombre o contratista..." className="pl-9 bg-slate-50 border-none" />
        </div>
        <Button variant="outline" className="shrink-0"><Filter className="w-4 h-4 mr-2" /> Filtros</Button>
      </div>

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

      {/* Details & Activities Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-[750px] p-0 overflow-hidden">
          {selectedProyecto && (
            <>
              <div className="px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
                <DialogTitle className="text-xl flex items-center justify-between">
                  {selectedProyecto.nombre}
                  <Badge className="bg-blue-600 text-white border-blue-500">{selectedProyecto.estado}</Badge>
                </DialogTitle>
                <DialogDescription className="text-slate-400 mt-1">
                  Configuración de HSE y asignación de contratistas por actividad.
                </DialogDescription>
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
                        <Button variant="outline" size="sm" onClick={() => setIsCsvActividadesModalOpen(true)} className="h-8">
                          <Upload className="w-3 h-3 mr-1" /> Carga CSV
                        </Button>
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
                          {mockContratistasStats.map((c) => (
                            <TableRow key={c.id}>
                              <TableCell className="font-medium text-xs">{c.empresa}</TableCell>
                              <TableCell className="text-center text-xs">{c.asignados}</TableCell>
                              <TableCell className="text-right text-xs">
                                <span className={`font-bold ${c.habilitacion >= 95 ? 'text-green-600' : c.habilitacion >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {c.habilitacion}%
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
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

      <div className="mt-12">
        <div className="flex items-center gap-2 mb-6">
          <Building2 className="w-5 h-5 text-slate-700" />
          <h2 className="text-xl font-bold text-slate-900">Estado de Contratistas (Directorio)</h2>
        </div>
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-slate-700">Empresa Contratista</TableHead>
                <TableHead className="font-bold text-slate-700">Especialidad</TableHead>
                <TableHead className="font-bold text-slate-700 text-center">Personal Asignado</TableHead>
                <TableHead className="font-bold text-slate-700">Docs Pendientes/Vencidos</TableHead>
                <TableHead className="font-bold text-slate-700 text-right">Habilitación (% Apto)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockContratistasStats.map((contratista) => (
                <TableRow key={contratista.id}>
                  <TableCell className="font-semibold text-slate-900">{contratista.empresa}</TableCell>
                  <TableCell className="text-slate-500">{contratista.especialidad}</TableCell>
                  <TableCell className="text-center font-medium text-slate-700">{contratista.asignados}</TableCell>
                  <TableCell>
                    {contratista.docPendientes > 0 ? (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        <AlertCircle className="w-3 h-3 mr-1" /> {contratista.docPendientes} Alertas
                      </Badge>
                    ) : (
                      <span className="text-sm text-slate-500 flex items-center"><CheckCircle2 className="w-4 h-4 text-green-500 mr-1"/> Todo al día</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-3">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${contratista.habilitacion >= 95 ? 'bg-green-500' : contratista.habilitacion >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                          style={{ width: `${contratista.habilitacion}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-slate-900 w-8">{contratista.habilitacion}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
