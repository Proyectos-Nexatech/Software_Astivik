"use client";

import { useState, useRef, useEffect } from "react";
import Papa from "papaparse";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Plus, UserCircle, Building2, HardHat, FileX, FileCheck, Upload, Download, Loader2, X, Edit2, Trash2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { AlertCircle } from "lucide-react";

const requiredDocsByCargo: Record<string, string[]> = {
  "Soldador 1A": ["ss", "examen", "alturas", "confinados", "soldadura"],
  "Sandblaster": ["ss", "examen", "alturas", "confinados"],
  "Electricista": ["ss", "examen", "alturas"]
};

export default function PersonalOperativoPage() {
  const supabase = createClient();
  const [personal, setPersonal] = useState<any[]>([]);
  const [contratistas, setContratistas] = useState<any[]>([]);
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ documento: "", nombre: "", cargo: "", empresa: "", estado_arl: "Al Día", proyecto_asignado: "" });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);

    // 0. Autenticación y Perfil
    const { data: { user } } = await supabase.auth.getUser();
    let empresaFiltro = null;
    
    if (user) {
      const { data: pData } = await supabase.from('perfiles_usuario').select('*, contratistas(nombre)').eq('id', user.id).single();
      if (pData) setUserProfile(pData);
      if (pData?.rol === 'lider_contratista' && pData?.contratistas?.nombre) {
        empresaFiltro = pData.contratistas.nombre;
      }
    }

    // 1. Fetch Trabajadores
    let workersQuery = supabase.from('trabajadores').select('*').order('created_at', { ascending: false });
    
    if (empresaFiltro) {
      const palabraClave = empresaFiltro.split(' ')[0];
      workersQuery = workersQuery.ilike('empresa', `%${palabraClave}%`);
    }

    const { data: tData } = await workersQuery;
    
    // 2. Fetch Documentos HSE
    const { data: dData } = await supabase.from('documentos_hse').select('*');

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

    if (tData) {
      const personalWithStatus = tData.map(worker => {
        const reqDocs = requiredDocsByCargo[worker.cargo] || ["ss", "examen"];
        const wDocs = dData ? dData.filter(d => d.trabajador_id === worker.id) : [];
        
        let hasVencida = false;
        let hasFaltante = false;
        let hasProxima = false;

        reqDocs.forEach(req => {
          const doc = wDocs.find(d => d.tipo_documento === req);
          const estadoDin = doc ? calculateEstado(doc.fecha_vencimiento) : "Faltante";
          
          if (!doc) {
            hasFaltante = true;
          } else if (doc.estado_aprobacion === 'Rechazado' || estadoDin === 'Vencido') {
            hasVencida = true;
          } else if (estadoDin === 'Por Vencer') {
            hasProxima = true;
          } else if (doc.estado_aprobacion !== 'Aprobado') {
            hasFaltante = true;
          }
        });

        let docStatus = "Completa";
        if (hasVencida) docStatus = "Vencida";
        else if (hasFaltante) docStatus = "Faltante";
        else if (hasProxima) docStatus = "Próxima";

        return { ...worker, calculated_doc_status: docStatus };
      });
      setPersonal(personalWithStatus);
    }

    // 2. Fetch Contratistas y Proyectos
    const { data: cData } = await supabase.from('contratistas').select('nombre').order('nombre', { ascending: true });
    if (cData) setContratistas(cData);
    
    const { data: pData } = await supabase.from('proyectos').select('nombre').order('nombre', { ascending: true });
    if (pData) setProyectos(pData);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCrearTrabajador = async () => {
    if (form.nombre && form.documento && form.empresa) {
      if (editingId) {
        const { data, error } = await supabase.from('trabajadores').update({
          documento: form.documento,
          nombre: form.nombre,
          cargo: form.cargo,
          empresa: form.empresa,
          estado_arl: form.estado_arl,
          proyecto_asignado: form.proyecto_asignado || null
        }).eq('id', editingId).select();

        if (!error && data) {
          setPersonal(personal.map(p => p.id === editingId ? data[0] : p));
          setForm({ documento: "", nombre: "", cargo: "", empresa: "", estado_arl: "Al Día", proyecto_asignado: "" });
          setIsModalOpen(false);
          setEditingId(null);
        } else {
          console.error(error);
          alert("Error al actualizar trabajador: " + (error?.message || "Desconocido"));
        }
      } else {
        const { data, error } = await supabase.from('trabajadores').insert([{
          documento: form.documento,
          nombre: form.nombre,
          cargo: form.cargo,
          empresa: form.empresa,
          estado_arl: form.estado_arl,
          proyecto_asignado: form.proyecto_asignado || null
        }]).select();

        if (!error && data) {
          setPersonal([data[0], ...personal]);
          setForm({ documento: "", nombre: "", cargo: "", empresa: "", estado_arl: "Al Día", proyecto_asignado: "" });
          setIsModalOpen(false);
        } else {
          alert("Error al guardar trabajador. Verifica que la cédula no esté duplicada.");
        }
      }
    }
  };

  const handleDeleteTrabajador = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este trabajador?")) {
      const { error } = await supabase.from('trabajadores').delete().eq('id', id);
      if (!error) {
        setPersonal(personal.filter(p => p.id !== id));
      } else {
        alert("Error al eliminar. Es posible que el trabajador tenga registros de acceso asociados.");
      }
    }
  };

  const handleEditClick = (trabajador: any) => {
    setForm({
      documento: trabajador.documento,
      nombre: trabajador.nombre,
      cargo: trabajador.cargo,
      empresa: trabajador.empresa,
      estado_arl: trabajador.estado_arl,
      proyecto_asignado: trabajador.proyecto_asignado || ""
    });
    setEditingId(trabajador.id);
    setIsModalOpen(true);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const nuevos = results.data.map((row: any) => ({
            documento: row.Documento || row.documento || "N/A",
            nombre: row.Nombre || row.nombre || "Sin Nombre",
            cargo: row.Cargo || row.cargo || "General",
            empresa: row.Contratista || row.contratista || "Astillero Interno",
            estado_arl: row['Estado ARL'] || row.estadoARL || "Al Día"
          }));
          
          const { data, error } = await supabase.from('trabajadores').insert(nuevos).select();
          if (!error && data) {
            setPersonal([...data, ...personal]);
            setIsCsvModalOpen(false);
          } else {
            alert("Error en la carga masiva. Es posible que existan cédulas duplicadas.");
          }
        }
      });
    }
  };

  const renderDocBadge = (status: string) => {
    switch (status) {
      case "Completa": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><FileCheck className="w-3 h-3 mr-1" /> Completa</Badge>;
      case "Faltante": return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100"><FileX className="w-3 h-3 mr-1" /> Faltante</Badge>;
      case "Vencida": return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><FileX className="w-3 h-3 mr-1" /> Vencida</Badge>;
      case "Próxima": return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><AlertCircle className="w-3 h-3 mr-1" /> Próxima</Badge>;
      default: return <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100">{status}</Badge>;
    }
  };

  const csvTemplate = "data:text/csv;charset=utf-8,%EF%BB%BFDocumento;Nombre;Cargo;Contratista%0A1045223112;Carlos Mendoza;Soldador 1A;Metalprest S.A.S";
  
  const puedeEditar = userProfile?.rol === 'lider_hse' || userProfile?.rol === 'admin' || userProfile?.rol === 'lider_contratista' || userProfile?.rol === 'ADMINISTRADOR';

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Directorio de Personal Operativo</h1>
          <p className="text-slate-500 text-sm mt-1">Gestión de trabajadores en campo y asignación a contratistas.</p>
        </div>
        
        <div className="flex gap-2">
          {/* Modal CSV */}
          <Dialog open={isCsvModalOpen} onOpenChange={setIsCsvModalOpen}>
            <DialogTrigger render={<Button variant="outline" className="bg-white" />}>
              <Upload className="w-4 h-4 mr-2" />
              CARGA MASIVA CSV
            </DialogTrigger>
            <DialogContent className="p-0 overflow-hidden" showCloseButton={false}>
              <div className="px-6 py-4 bg-slate-900 text-white border-b border-slate-800 relative flex items-start justify-between">
                <div>
                  <DialogTitle className="text-xl">Carga Masiva de Personal</DialogTitle>
                  <DialogDescription className="text-slate-400 mt-1">
                    Sube un archivo .csv para agregar múltiples trabajadores al mismo tiempo.
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
                  <p className="text-xs text-slate-500 mt-2 text-center">Columnas esperadas (con punto y coma):<br/>Documento;Nombre;Cargo;Contratista;Estado ARL</p>
                </div>
              </div>
              <DialogFooter className="px-6 pb-6 pt-2 bg-transparent border-t-0">
                <a href={csvTemplate} download="plantilla_personal.csv">
                  <Button variant="link" size="sm" className="text-blue-600">
                    <Download className="w-4 h-4 mr-1" /> Descargar Plantilla
                  </Button>
                </a>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modal Individual */}
          <Dialog open={isModalOpen} onOpenChange={(open) => {
            if (!open) {
              setEditingId(null);
              setForm({ documento: "", nombre: "", cargo: "", empresa: "", estado_arl: "Al Día", proyecto_asignado: "" });
            }
            setIsModalOpen(open);
          }}>
            <DialogTrigger render={<Button className="bg-slate-900 hover:bg-slate-800 text-white font-medium" />}>
              <Plus className="w-4 h-4 mr-2" />
              NUEVO TRABAJADOR
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden" showCloseButton={false}>
              <div className="px-6 py-4 bg-slate-900 text-white border-b border-slate-800 relative flex items-start justify-between">
                <div>
                  <DialogTitle className="text-xl">{editingId ? 'Editar' : 'Registrar'} Personal</DialogTitle>
                  <DialogDescription className="text-slate-400 mt-1">
                    {editingId ? 'Modifica los datos del trabajador.' : 'Agrega un nuevo trabajador y vincúlalo a una empresa.'}
                  </DialogDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white hover:bg-slate-800 -mr-2 -mt-1"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="px-6 py-4 grid gap-4">
                <div className="grid gap-2">
                  <Label>Nombre Completo</Label>
                  <Input value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} placeholder="Ej. Carlos Pérez" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>N° Documento</Label>
                    <Input value={form.documento} onChange={(e) => setForm({...form, documento: e.target.value})} placeholder="C.C." />
                  </div>
                  <div className="grid gap-2">
                    <Label>Cargo / Especialidad</Label>
                    <Input value={form.cargo} onChange={(e) => setForm({...form, cargo: e.target.value})} placeholder="Soldador" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Empresa Contratista</Label>
                    <Select value={form.empresa} onValueChange={(val) => setForm({...form, empresa: val || ''})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {contratistas.map(c => (
                          <SelectItem key={c.nombre} value={c.nombre}>{c.nombre}</SelectItem>
                        ))}
                        <SelectItem value="Astillero Interno">Astillero Interno</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Proyecto Asignado</Label>
                    <Select value={form.proyecto_asignado} onValueChange={(val) => setForm({...form, proyecto_asignado: val === 'Ninguno' ? '' : val})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Ninguno" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ninguno">Ninguno</SelectItem>
                        {proyectos.map(p => (
                          <SelectItem key={p.nombre} value={p.nombre}>{p.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter className="px-6 pb-6 pt-2 bg-transparent border-t-0">
                <Button onClick={handleCrearTrabajador} className="bg-slate-900 text-white w-full">Guardar Trabajador</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold">Listado de Trabajadores</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Buscar por cédula o nombre..." className="pl-9 h-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center items-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-semibold px-6">Documento</TableHead>
                  <TableHead className="font-semibold">Nombre</TableHead>
                  <TableHead className="font-semibold">Cargo</TableHead>
                  <TableHead className="font-semibold">Contratista / Proyecto</TableHead>
                  <TableHead className="font-semibold text-center">Estado ARL / Docs</TableHead>
                  {puedeEditar && <TableHead className="font-semibold text-right px-6">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {personal.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-slate-600 px-6 py-4">{p.documento || "---"}</TableCell>
                    <TableCell className="font-bold text-slate-900 flex items-center gap-2">
                      <UserCircle className="w-4 h-4 text-slate-400" />
                      {p.nombre}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-slate-600 text-sm">
                        <HardHat className="w-4 h-4 text-slate-400" />
                        {p.cargo || "---"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1.5 text-slate-600 text-sm font-semibold">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          {p.empresa}
                        </span>
                        {p.proyecto_asignado && (
                          <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full w-fit">
                            {p.proyecto_asignado}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {renderDocBadge(p.calculated_doc_status)}
                    </TableCell>
                    {puedeEditar && (
                      <TableCell className="text-right px-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50" onClick={() => handleEditClick(p)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50" onClick={() => handleDeleteTrabajador(p.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {personal.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      No hay trabajadores registrados en la base de datos. Agrega uno nuevo.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
