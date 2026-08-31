"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, HardHat, FileText, Edit2, Trash2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function PermisosTrabajoPage() {
  const [permisos, setPermisos] = useState<any[]>([]);
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [trabajadores, setTrabajadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>("Todos los Registros");
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>("Todos los Registros");

  const initialForm = {
    proyecto_id: '',
    tipo: '',
    solicitante_nombre: '',
    fecha_inicio: '',
    fecha_fin: '',
    estado: 'SOLICITADO',
    hora_firma: '',
    documento_url: '',
    personal_involucrado: [] as string[],
    numero_permiso: '',
    orden_compra: '',
    empresa: '',
    supervisor_hse: ''
  };

  const [formData, setFormData] = useState(initialForm);
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: pData } = await supabase.from('permisos_trabajo').select('*, proyectos(nombre)').order('created_at', { ascending: false });
    if (pData) setPermisos(pData);

    const { data: projData } = await supabase.from('proyectos').select('id, nombre');
    if (projData) setProyectos(projData);

    const { data: trabData } = await supabase.from('trabajadores').select('id, nombre, empresa').order('nombre');
    if (trabData) setTrabajadores(trabData);

    setLoading(false);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFileToUpload(null);
    setFormData(initialForm);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (pt: any) => {
    setEditingId(pt.id);
    setFileToUpload(null);
    setFormData({
      proyecto_id: pt.proyecto_id || '',
      tipo: pt.tipo,
      solicitante_nombre: pt.solicitante_nombre,
      fecha_inicio: pt.fecha_inicio ? new Date(pt.fecha_inicio).toISOString().slice(0, 16) : '',
      fecha_fin: pt.fecha_fin ? new Date(pt.fecha_fin).toISOString().slice(0, 16) : '',
      estado: pt.estado || 'SOLICITADO',
      hora_firma: pt.hora_firma || '',
      documento_url: pt.documento_url || '',
      personal_involucrado: Array.isArray(pt.personal_involucrado) ? pt.personal_involucrado : [],
      numero_permiso: pt.numero_permiso || '',
      orden_compra: pt.orden_compra || '',
      empresa: pt.empresa || '',
      supervisor_hse: pt.supervisor_hse || ''
    });
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    let docUrl = formData.documento_url;

    if (fileToUpload) {
      const ext = fileToUpload.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random()}.${ext}`;
      const { data, error } = await supabase.storage.from('documentos_hse').upload(fileName, fileToUpload);
      if (!error && data) {
        docUrl = supabase.storage.from('documentos_hse').getPublicUrl(fileName).data.publicUrl;
      }
    }

    const payload = {
      proyecto_id: formData.proyecto_id,
      tipo: formData.tipo,
      solicitante_nombre: formData.solicitante_nombre,
      fecha_inicio: formData.fecha_inicio ? new Date(formData.fecha_inicio).toISOString() : null,
      fecha_fin: formData.fecha_fin ? new Date(formData.fecha_fin).toISOString() : null,
      estado: formData.estado,
      hora_firma: formData.hora_firma || null,
      documento_url: docUrl,
      personal_involucrado: formData.personal_involucrado,
      numero_permiso: formData.numero_permiso || null,
      orden_compra: formData.orden_compra || null,
      empresa: formData.empresa || null,
      supervisor_hse: formData.supervisor_hse || null
    };

    if (editingId) {
      await supabase.from('permisos_trabajo').update(payload).eq('id', editingId);
    } else {
      await supabase.from('permisos_trabajo').insert([payload]);
    }

    setIsDialogOpen(false);
    fetchData();
    setIsSubmitting(false);
  };

  const toggleTrabajador = (id: string) => {
    setFormData(prev => {
      const isSelected = prev.personal_involucrado.includes(id);
      if (isSelected) {
        return { ...prev, personal_involucrado: prev.personal_involucrado.filter(tId => tId !== id) };
      } else {
        return { ...prev, personal_involucrado: [...prev.personal_involucrado, id] };
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este permiso?")) return;
    const { error } = await supabase.from('permisos_trabajo').delete().eq('id', id);
    if (!error) fetchData();
  };

  const getStatusBadge = (estado: string) => {
    switch(estado) {
      case 'APROBADO': return <Badge className="bg-green-600">Aprobado</Badge>;
      case 'SOLICITADO': return <Badge className="bg-yellow-500">Pendiente</Badge>;
      case 'CERRADO': return <Badge className="bg-slate-500">Cerrado</Badge>;
      default: return <Badge className="bg-slate-300 text-slate-800">Borrador</Badge>;
    }
  };

  const filteredPermisos = permisos.filter(pt => {
    const matchesSearch = pt.solicitante_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || pt.tipo?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmpresa = selectedEmpresa === "Todos los Registros" || pt.empresa === selectedEmpresa;
    const matchesSupervisor = selectedSupervisor === "Todos los Registros" || pt.supervisor_hse === selectedSupervisor;
    return matchesSearch && matchesEmpresa && matchesSupervisor;
  });

  const uniqueEmpresas = Array.from(new Set(permisos.map(p => p.empresa).filter(Boolean)));
  const uniqueSupervisores = Array.from(new Set(permisos.map(p => p.supervisor_hse).filter(Boolean)));


  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-800">
            <HardHat className="w-8 h-8 text-blue-600" /> Permisos de Trabajo
          </h1>
          <p className="text-slate-500">Gestiona y aprueba los permisos para actividades de alto riesgo.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" /> Nuevo Permiso
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Permiso" : "Solicitar Permiso de Trabajo"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Proyecto</Label>
                <Select required value={formData.proyecto_id || ''} onValueChange={(v) => setFormData({...formData, proyecto_id: v || ''})}>
                  <SelectTrigger><SelectValue placeholder="Seleccione un proyecto..." /></SelectTrigger>
                  <SelectContent>
                    {proyectos.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Permiso</Label>
                  <Select required value={formData.tipo || ''} onValueChange={(v) => setFormData({...formData, tipo: v || ''})}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALTURAS">Trabajo en Alturas</SelectItem>
                      <SelectItem value="CONFINADO">Espacios Confinados</SelectItem>
                      <SelectItem value="CALIENTE">Trabajo en Caliente</SelectItem>
                      <SelectItem value="IZAJE">Izaje de Cargas</SelectItem>
                      <SelectItem value="ELECTRICO">Riesgo Eléctrico</SelectItem>
                      <SelectItem value="OTRO">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Solicitante</Label>
                  <Input required placeholder="Nombre del solicitante" value={formData.solicitante_nombre || ''} onChange={e => setFormData({...formData, solicitante_nombre: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Empresa</Label>
                  <Input placeholder="Nombre de la empresa" value={formData.empresa || ''} onChange={e => setFormData({...formData, empresa: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Supervisor HSE</Label>
                  <Input placeholder="Nombre del supervisor" value={formData.supervisor_hse || ''} onChange={e => setFormData({...formData, supervisor_hse: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha Inicio</Label>
                  <Input type="datetime-local" required value={formData.fecha_inicio || ''} onChange={e => setFormData({...formData, fecha_inicio: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Fecha Fin</Label>
                  <Input type="datetime-local" value={formData.fecha_fin || ''} onChange={e => setFormData({...formData, fecha_fin: e.target.value})} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Número de Permiso</Label>
                  <Input placeholder="Ej. PT-001" value={formData.numero_permiso || ''} onChange={e => setFormData({...formData, numero_permiso: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Orden de Compra</Label>
                  <Input placeholder="Opcional" value={formData.orden_compra || ''} onChange={e => setFormData({...formData, orden_compra: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hora de Firma</Label>
                  <Input type="time" value={formData.hora_firma || ''} onChange={e => setFormData({...formData, hora_firma: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Subir Documento (PDF)</Label>
                  <Input type="file" accept=".pdf" onChange={e => setFileToUpload(e.target.files?.[0] || null)} />
                  {formData.documento_url && !fileToUpload && (
                    <a href={formData.documento_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline mt-1 block">Ver documento actual</a>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                 <Label>Personal Involucrado</Label>
                 <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1 bg-white">
                   {trabajadores.map(t => (
                      <label key={t.id} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded">
                         <input type="checkbox" checked={formData.personal_involucrado.includes(t.id)} onChange={() => toggleTrabajador(t.id)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                         <span>{t.nombre} <span className="text-slate-400">({t.empresa})</span></span>
                      </label>
                   ))}
                   {trabajadores.length === 0 && <p className="text-xs text-slate-400 italic">No hay trabajadores registrados.</p>}
                 </div>
              </div>
              
              {/* Solo mostrar Estado si se esta editando */}
              {editingId && (
                <div className="space-y-2 border-t pt-4 mt-2">
                  <Label>Estado de Aprobación</Label>
                  <Select required value={formData.estado || ''} onValueChange={(v) => setFormData({...formData, estado: v || ''})}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BORRADOR">Borrador</SelectItem>
                      <SelectItem value="SOLICITADO">Solicitado</SelectItem>
                      <SelectItem value="APROBADO">Aprobado</SelectItem>
                      <SelectItem value="CERRADO">Cerrado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <DialogFooter>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando..." : "Guardar Permiso"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Filters */}
        <div className="w-full md:w-64 shrink-0 space-y-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Empresa</h3>
            </div>
            <div className="space-y-2">
              <button onClick={() => setSelectedEmpresa('Todos los Registros')} className={`w-full text-left px-3 py-2 rounded-md text-sm ${selectedEmpresa === 'Todos los Registros' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>Todos los Registros</button>
              {uniqueEmpresas.map(emp => (
                <button key={emp as string} onClick={() => setSelectedEmpresa(emp as string)} className={`w-full text-left px-3 py-2 rounded-md text-sm flex justify-between items-center ${selectedEmpresa === emp ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <span>{emp as string}</span><span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs">{permisos.filter(p => p.empresa === emp).length}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Supervisores HSE</h3>
            </div>
            <div className="space-y-2">
              <button onClick={() => setSelectedSupervisor('Todos los Registros')} className={`w-full text-left px-3 py-2 rounded-md text-sm ${selectedSupervisor === 'Todos los Registros' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>Todos los Registros</button>
              {uniqueSupervisores.map(sup => (
                <button key={sup as string} onClick={() => setSelectedSupervisor(sup as string)} className={`w-full text-left px-3 py-2 rounded-md text-sm flex justify-between items-center ${selectedSupervisor === sup ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <span>{sup as string}</span><span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs">{permisos.filter(p => p.supervisor_hse === sup).length}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6 overflow-hidden">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input placeholder="Buscar por solicitante o tipo..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>ID / Tipo</TableHead>
              <TableHead>Nº Permiso</TableHead>
              <TableHead>Proyecto</TableHead>
              <TableHead>Solicitante</TableHead>
              <TableHead>Fechas</TableHead>
              <TableHead>Hora Firma</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Docs</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-10 text-slate-500">Cargando...</TableCell></TableRow>
            ) : filteredPermisos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <FileText className="w-12 h-12 mb-3 text-slate-300 mx-auto" />
                  <p className="text-lg font-medium text-slate-500">No hay permisos registrados</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredPermisos.map((pt) => (
                <TableRow key={pt.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{pt.tipo}</span>
                      <span className="text-xs text-slate-400 font-mono">{pt.id.split('-')[0]}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {pt.numero_permiso ? <span className="font-semibold">{pt.numero_permiso}</span> : <span className="text-slate-400 italic">N/A</span>}
                  </TableCell>
                  <TableCell>{pt.proyectos?.nombre}</TableCell>
                  <TableCell>{pt.solicitante_nombre}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(pt.fecha_inicio).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {pt.hora_firma || '-'}
                  </TableCell>
                  <TableCell>{getStatusBadge(pt.estado)}</TableCell>
                  <TableCell>
                    {pt.documento_url ? (
                      <a href={pt.documento_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">PDF</a>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(pt)} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(pt.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      </div>
      </div>
    </div>
  );
}
