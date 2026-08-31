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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialForm = {
    proyecto_id: '',
    tipo: '',
    solicitante_nombre: '',
    fecha_inicio: '',
    fecha_fin: '',
    estado: 'SOLICITADO'
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

    setLoading(false);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(initialForm);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (pt: any) => {
    setEditingId(pt.id);
    setFormData({
      proyecto_id: pt.proyecto_id || '',
      tipo: pt.tipo,
      solicitante_nombre: pt.solicitante_nombre,
      fecha_inicio: pt.fecha_inicio ? new Date(pt.fecha_inicio).toISOString().slice(0, 16) : '',
      fecha_fin: pt.fecha_fin ? new Date(pt.fecha_fin).toISOString().slice(0, 16) : '',
      estado: pt.estado
    });
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload = {
      ...formData,
      fecha_inicio: formData.fecha_inicio ? new Date(formData.fecha_inicio).toISOString() : null,
      fecha_fin: formData.fecha_fin ? new Date(formData.fecha_fin).toISOString() : null,
    };

    let error;
    if (editingId) {
      const { error: updateError } = await supabase.from('permisos_trabajo').update(payload).eq('id', editingId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('permisos_trabajo').insert([payload]);
      error = insertError;
    }

    setIsSubmitting(false);

    if (!error) {
      setIsDialogOpen(false);
      fetchData();
    } else {
      alert("Error al guardar: " + error.message);
    }
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

  const filteredPermisos = permisos.filter(pt => 
    pt.solicitante_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    pt.tipo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                <Select required value={formData.proyecto_id} onValueChange={(v) => setFormData({...formData, proyecto_id: v})}>
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
                  <Select required value={formData.tipo} onValueChange={(v) => setFormData({...formData, tipo: v})}>
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
                  <Input required placeholder="Nombre del solicitante" value={formData.solicitante_nombre} onChange={e => setFormData({...formData, solicitante_nombre: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha Inicio</Label>
                  <Input type="datetime-local" required value={formData.fecha_inicio} onChange={e => setFormData({...formData, fecha_inicio: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Fecha Fin</Label>
                  <Input type="datetime-local" value={formData.fecha_fin} onChange={e => setFormData({...formData, fecha_fin: e.target.value})} />
                </div>
              </div>
              
              {/* Solo mostrar Estado si se esta editando */}
              {editingId && (
                <div className="space-y-2 border-t pt-4 mt-2">
                  <Label>Estado de Aprobación</Label>
                  <Select required value={formData.estado} onValueChange={(v) => setFormData({...formData, estado: v})}>
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
              <TableHead>Proyecto</TableHead>
              <TableHead>Solicitante</TableHead>
              <TableHead>Inicio Programado</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-500">Cargando...</TableCell></TableRow>
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
                  <TableCell>{pt.proyectos?.nombre || 'N/A'}</TableCell>
                  <TableCell>{pt.solicitante_nombre}</TableCell>
                  <TableCell>{pt.fecha_inicio ? new Date(pt.fecha_inicio).toLocaleString() : 'N/A'}</TableCell>
                  <TableCell>{getStatusBadge(pt.estado)}</TableCell>
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
  );
}
