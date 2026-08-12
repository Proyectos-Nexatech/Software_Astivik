"use client";

import { useState, useRef, useEffect } from "react";
import Papa from "papaparse";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building2, Search, Plus, Upload, Download, CheckCircle2, AlertCircle, Edit2, Trash2, Loader2, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

// Required docs per cargo (simulating the configuration matrix)
const requiredDocsByCargo: Record<string, string[]> = {
  "Soldador 1A": ["ss", "examen", "alturas", "confinados", "soldadura"],
  "Sandblaster": ["ss", "examen", "alturas", "confinados"],
  "Electricista": ["ss", "examen", "alturas"]
};

export default function ContratistasPage() {
  const supabase = createClient();
  const [contratistas, setContratistas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isIndividualModalOpen, setIsIndividualModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [form, setForm] = useState({ nit: "", empresa: "", especialidad: "", contacto: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const fetchContratistas = async () => {
    setLoading(true);
    
    // Fetch tables
    const { data: contratistasData, error } = await supabase.from('contratistas').select('*').order('created_at', { ascending: false });
    const { data: configData } = await supabase.from('configuracion_vigencias').select('*');
    const { data: workersData } = await supabase.from('trabajadores').select('*');
    const { data: docsData } = await supabase.from('documentos_hse').select('*');

    const vConfig: Record<string, number> = {
      ss: 1, examen: 12, alturas: 12, confinados: 12, soldadura: 6 // Defaults
    };
    if (configData) {
      configData.forEach((row: any) => {
        vConfig[row.tipo_documento] = row.periodo_meses;
      });
    }

    if (!error && contratistasData) {
      // Aggregate data per contractor
      const mergedContratistas = contratistasData.map(c => {
        // Find workers for this contractor
        const cWorkers = (workersData || []).filter(w => 
          w.empresa?.toLowerCase() === c.nombre?.toLowerCase() || 
          w.empresa?.toLowerCase().includes(c.nombre?.toLowerCase())
        );
        
        let habilitados = 0;
        let alertas = 0;

        cWorkers.forEach(worker => {
          const docsMap: any = {};
          const requiredKeys = requiredDocsByCargo[worker.cargo] || ["ss", "examen"];
          
          requiredKeys.forEach(key => {
            docsMap[key] = { estado: "Faltante", estado_aprobacion: "Pendiente" };
          });

          // Override with existing docs
          docsData?.filter(d => d.trabajador_id === worker.id).forEach(d => {
            if (d.tipo_documento && requiredKeys.includes(d.tipo_documento)) {
              docsMap[d.tipo_documento] = {
                estado: calculateEstado(d.fecha_vencimiento),
                estado_aprobacion: d.estado_aprobacion || "Pendiente"
              };
            }
          });

          const globalStatus = getGlobalStatus(docsMap);
          if (globalStatus === "HABILITADO") habilitados++;
          if (globalStatus !== "HABILITADO") alertas++;
        });

        const totalWorkers = cWorkers.length;
        const aptoPorcentaje = totalWorkers > 0 ? Math.round((habilitados / totalWorkers) * 100) : 0;

        return {
          ...c,
          totalWorkers,
          alertas,
          aptoPorcentaje
        };
      });

      setContratistas(mergedContratistas);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContratistas();
  }, []);

  const handleSaveIndividual = async () => {
    if (form.empresa && form.nit) {
      if (editingId) {
        const { data, error } = await supabase
          .from('contratistas')
          .update({
            nit: form.nit,
            nombre: form.empresa,
            especialidad: form.especialidad,
            contacto: form.contacto
          })
          .eq('id', editingId)
          .select();
          
        if (!error && data) {
          fetchContratistas();
        }
      } else {
        const { data, error } = await supabase
          .from('contratistas')
          .insert([{
            nit: form.nit,
            nombre: form.empresa,
            especialidad: form.especialidad,
            contacto: form.contacto,
            estado: "Activo"
          }])
          .select();
          
        if (!error && data) {
          fetchContratistas();
        }
      }
      setForm({ nit: "", empresa: "", especialidad: "", contacto: "" });
      setEditingId(null);
      setIsIndividualModalOpen(false);
    }
  };

  const handleEditClick = (contratista: any) => {
    setForm({
      nit: contratista.nit || "",
      empresa: contratista.nombre || "",
      especialidad: contratista.especialidad || "",
      contacto: contratista.contacto || ""
    });
    setEditingId(contratista.id);
    setIsIndividualModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este contratista?")) {
      const { error } = await supabase.from('contratistas').delete().eq('id', id);
      if (!error) {
        setContratistas(contratistas.filter(c => c.id !== id));
      }
    }
  };

  const handleOpenNewModal = () => {
    setForm({ nit: "", empresa: "", especialidad: "", contacto: "" });
    setEditingId(null);
    setIsIndividualModalOpen(true);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const nuevos = results.data.map((row: any) => ({
            nit: row.NIT || row.nit || "N/A",
            nombre: row.Nombre || row.nombre || row.Empresa || "Sin Nombre",
            especialidad: row.Especialidad || row.especialidad || "General",
            contacto: row.Contacto || row.contacto || "N/A",
            estado: "Activo"
          }));
          
          const { data, error } = await supabase.from('contratistas').insert(nuevos).select();
          if (!error && data) {
            fetchContratistas();
          } else {
            alert("Error al cargar el CSV: Es posible que algunos NIT o nombres ya existan.");
          }
          setIsCsvModalOpen(false);
        }
      });
    }
  };

  const csvTemplate = "data:text/csv;charset=utf-8,%EF%BB%BFNIT;Nombre;Especialidad;Contacto%0A900123456;Ejemplo Contratista;Soldadura;correo@ejemplo.com";

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gestión de Contratistas</h1>
          <p className="text-slate-500 text-sm mt-1">Master Data de empresas prestadoras de servicio.</p>
        </div>
        <div className="flex gap-2">
          {/* Modal CSV */}
          <Dialog open={isCsvModalOpen} onOpenChange={setIsCsvModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-white">
                <Upload className="w-4 h-4 mr-2" />
                CARGA MASIVA CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="p-0 overflow-hidden" showCloseButton={false}>
              <div className="px-6 py-4 bg-slate-900 text-white border-b border-slate-800 relative flex items-start justify-between">
                <div>
                  <DialogTitle className="text-xl">Carga Masiva de Contratistas</DialogTitle>
                  <DialogDescription className="text-slate-400 mt-1">
                    Sube un archivo .csv para agregar múltiples empresas al mismo tiempo.
                  </DialogDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsCsvModalOpen(false)}
                  className="text-slate-400 hover:text-white hover:bg-slate-800 -mr-2 -mt-1"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="p-6">
                <div className="py-6 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
                  <input 
                    type="file" 
                    accept=".csv" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleCsvUpload}
                  />
                  <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                    Seleccionar Archivo CSV
                  </Button>
                  <p className="text-xs text-slate-500 mt-2">Columnas esperadas: NIT, Nombre, Especialidad, Contacto</p>
                </div>
              </div>
              <DialogFooter className="px-6 pb-6 pt-2 bg-transparent border-t-0">
                <a href={csvTemplate} download="plantilla_contratistas.csv">
                  <Button variant="link" size="sm" className="text-blue-600">
                    <Download className="w-4 h-4 mr-1" /> Descargar Plantilla
                  </Button>
                </a>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modal Individual */}
          <Dialog open={isIndividualModalOpen} onOpenChange={setIsIndividualModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenNewModal} className="bg-slate-900 hover:bg-slate-800 text-white font-medium">
                <Plus className="w-4 h-4 mr-2" />
                NUEVO CONTRATISTA
              </Button>
            </DialogTrigger>
            <DialogContent className="p-0 overflow-hidden" showCloseButton={false}>
              <div className="px-6 py-4 bg-slate-900 text-white border-b border-slate-800 relative flex items-start justify-between">
                <div>
                  <DialogTitle className="text-xl">{editingId ? "Editar Contratista" : "Agregar Contratista"}</DialogTitle>
                  <DialogDescription className="text-slate-400 mt-1">
                    {editingId ? "Modifica los datos de la empresa." : "Registra una nueva empresa en el sistema."}
                  </DialogDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsIndividualModalOpen(false)}
                  className="text-slate-400 hover:text-white hover:bg-slate-800 -mr-2 -mt-1"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="px-6 py-4 grid gap-4">
                <div className="grid gap-2">
                  <Label>Razón Social / Nombre</Label>
                  <Input value={form.empresa} onChange={(e) => setForm({...form, empresa: e.target.value})} placeholder="Ej. Metalprest S.A.S" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>NIT</Label>
                    <Input value={form.nit} onChange={(e) => setForm({...form, nit: e.target.value})} placeholder="900.123.456-1" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Especialidad</Label>
                    <Input value={form.especialidad} onChange={(e) => setForm({...form, especialidad: e.target.value})} placeholder="Ej. Soldadura" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Correo de Contacto</Label>
                  <Input type="email" value={form.contacto} onChange={(e) => setForm({...form, contacto: e.target.value})} placeholder="correo@empresa.com" />
                </div>
              </div>
              <DialogFooter className="px-6 pb-6 pt-2 bg-transparent border-t-0">
                <Button onClick={handleSaveIndividual} className="bg-slate-900 text-white w-full">Guardar Registro</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">Directorio y Estado HSE</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Buscar por NIT o Empresa..." className="pl-9 h-9" />
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="p-12 flex justify-center items-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-semibold px-6">NIT</TableHead>
                    <TableHead className="font-semibold">Razón Social</TableHead>
                    <TableHead className="font-semibold">Especialidad</TableHead>
                    <TableHead className="font-semibold text-center">Personal Asignado</TableHead>
                    <TableHead className="font-semibold text-center">Docs Pendientes</TableHead>
                    <TableHead className="font-semibold text-center">% Apto</TableHead>
                    <TableHead className="font-semibold text-right px-6">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contratistas.map((contratista) => (
                    <TableRow key={contratista.id}>
                      <TableCell className="font-medium text-slate-600 px-6 py-4">{contratista.nit || "N/A"}</TableCell>
                      <TableCell className="font-bold text-slate-900 flex items-center gap-2 mt-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        {contratista.nombre}
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">{contratista.especialidad}</TableCell>
                      <TableCell className="text-center font-medium text-slate-700">{contratista.totalWorkers || 0}</TableCell>
                      <TableCell className="text-center">
                        {contratista.alertas > 0 ? (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <AlertCircle className="w-3 h-3 mr-1" /> {contratista.alertas} Alertas
                          </Badge>
                        ) : (
                          <span className="text-sm text-slate-500 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-green-500 mr-1"/> Todo al día</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${(contratista.aptoPorcentaje || 0) >= 95 ? 'bg-green-500' : (contratista.aptoPorcentaje || 0) >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                              style={{ width: `${contratista.aptoPorcentaje || 0}%` }}
                            ></div>
                          </div>
                          <span className="font-bold text-slate-900 w-8">{contratista.aptoPorcentaje || 0}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            onClick={() => handleEditClick(contratista)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                            onClick={() => handleDelete(contratista.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {!loading && contratistas.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                No hay contratistas registrados. Usa los botones superiores para agregar datos.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
