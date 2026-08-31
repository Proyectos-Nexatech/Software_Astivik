"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, AlertTriangle, Activity, Edit2, Trash2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function EventosHsePage() {
  const [eventos, setEventos] = useState<any[]>([]);
  const [trabajadores, setTrabajadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialForm = {
    tipo_evento: '',
    severidad: '',
    fecha_evento: '',
    lugar_exacto: '',
    descripcion: '',
    estado_investigacion: 'ABIERTA',
    trabajador_id: '',
    empresa: ''
  };

  const [formData, setFormData] = useState(initialForm);
  const supabase = createClient();

  useEffect(() => {
    fetchEventos();
  }, []);

  const fetchEventos = async () => {
    setLoading(true);
    const { data: eData } = await supabase.from('hse_eventos').select('*, trabajadores(nombre, empresa)').order('fecha_evento', { ascending: false });
    if (eData) setEventos(eData);

    const { data: tData } = await supabase.from('trabajadores').select('id, nombre, empresa').order('nombre');
    if (tData) setTrabajadores(tData);

    setLoading(false);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(initialForm);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (ev: any) => {
    setEditingId(ev.id);
    setFormData({
      tipo_evento: ev.tipo_evento,
      severidad: ev.severidad,
      fecha_evento: ev.fecha_evento ? new Date(ev.fecha_evento).toISOString().slice(0, 16) : '',
      lugar_exacto: ev.lugar_exacto || '',
      descripcion: ev.descripcion || '',
      estado_investigacion: ev.estado_investigacion || 'ABIERTA',
      trabajador_id: ev.trabajador_id || '',
      empresa: ev.empresa || ''
    });
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const selectedWorker = trabajadores.find(t => t.id === formData.trabajador_id);
    
    const payload = {
      ...formData,
      empresa: selectedWorker ? selectedWorker.empresa : formData.empresa,
      fecha_evento: formData.fecha_evento ? new Date(formData.fecha_evento).toISOString() : null,
    };

    let error;
    if (editingId) {
      const { error: updateError } = await supabase.from('hse_eventos').update(payload).eq('id', editingId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('hse_eventos').insert([payload]);
      error = insertError;
    }

    setIsSubmitting(false);

    if (!error) {
      setIsDialogOpen(false);
      fetchEventos();
    } else {
      alert("Error al guardar: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este evento?")) return;
    const { error } = await supabase.from('hse_eventos').delete().eq('id', id);
    if (!error) fetchEventos();
  };

  const getSeveridadBadge = (severidad: string) => {
    switch(severidad) {
      case 'BAJA': return <Badge variant="outline" className="text-green-600 border-green-600">Baja</Badge>;
      case 'MEDIA': return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Media</Badge>;
      case 'ALTA': return <Badge variant="outline" className="text-orange-600 border-orange-600 bg-orange-50">Alta</Badge>;
      case 'FATALIDAD': return <Badge variant="destructive" className="bg-red-600">Fatalidad</Badge>;
      default: return <Badge variant="secondary">Desconocida</Badge>;
    }
  };

  const filteredEventos = eventos.filter(ev => 
    ev.lugar_exacto?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    ev.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-800">
            <AlertTriangle className="w-8 h-8 text-orange-600" /> Incidentes y Accidentes
          </h1>
          <p className="text-slate-500">Registro, investigación y seguimiento de eventos HSE.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" /> Reportar Evento
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Evento" : "Reportar Nuevo Evento"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Evento</Label>
                  <Select required value={formData.tipo_evento || ''} onValueChange={(v) => setFormData({...formData, tipo_evento: v || ''})}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INCIDENTE">Incidente</SelectItem>
                      <SelectItem value="ACCIDENTE">Accidente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Severidad</Label>
                  <Select required value={formData.severidad || ''} onValueChange={(v) => setFormData({...formData, severidad: v || ''})}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BAJA">Baja</SelectItem>
                      <SelectItem value="MEDIA">Media</SelectItem>
                      <SelectItem value="ALTA">Alta</SelectItem>
                      <SelectItem value="FATALIDAD">Fatalidad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Fecha y Hora del Evento</Label>
                <Input type="datetime-local" required value={formData.fecha_evento || ''} onChange={e => setFormData({...formData, fecha_evento: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Trabajador Afectado</Label>
                  <Select required value={formData.trabajador_id || ''} onValueChange={(v) => setFormData({...formData, trabajador_id: v || ''})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar trabajador...">
                        {formData.trabajador_id 
                          ? trabajadores.find(t => t.id === formData.trabajador_id)?.nombre 
                          : "Seleccionar..."}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {trabajadores.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.nombre} ({t.empresa})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Empresa / Contratista</Label>
                  <Input 
                    readOnly 
                    className="bg-slate-100 text-slate-900 font-medium border-slate-200 cursor-not-allowed" 
                    value={formData.trabajador_id ? (trabajadores.find(t => t.id === formData.trabajador_id)?.empresa || 'Sin empresa') : (formData.empresa || '')} 
                    placeholder="Se llena automáticamente..." 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Lugar Exacto</Label>
                <Input required placeholder="Ej. Taller 1, Dique Seco..." value={formData.lugar_exacto || ''} onChange={e => setFormData({...formData, lugar_exacto: e.target.value})} />
              </div>

              <div className="space-y-2">
                <Label>Descripción del Evento</Label>
                <Input required placeholder="Detalla lo sucedido..." value={formData.descripcion || ''} onChange={e => setFormData({...formData, descripcion: e.target.value})} />
              </div>

              {editingId && (
                <div className="space-y-2 border-t pt-4 mt-2">
                  <Label>Estado de la Investigación</Label>
                  <Select required value={formData.estado_investigacion || ''} onValueChange={(v) => setFormData({...formData, estado_investigacion: v || ''})}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ABIERTA">Abierta</SelectItem>
                      <SelectItem value="EN_PROGRESO">En Progreso</SelectItem>
                      <SelectItem value="CERRADA">Cerrada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <DialogFooter>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando..." : "Guardar Evento"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input placeholder="Buscar por lugar, descripción..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Clasificación</TableHead>
              <TableHead>Trabajador Afectado</TableHead>
              <TableHead>Lugar Exacto</TableHead>
              <TableHead>Severidad</TableHead>
              <TableHead>Investigación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-500">Cargando eventos...</TableCell></TableRow>
            ) : filteredEventos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <Activity className="w-12 h-12 mb-3 text-slate-300 mx-auto" />
                  <p className="text-lg font-medium text-slate-500">Cero eventos reportados</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredEventos.map((ev) => (
                <TableRow key={ev.id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {ev.fecha_evento ? new Date(ev.fecha_evento).toLocaleString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <span className={`font-semibold ${ev.tipo_evento === 'ACCIDENTE' ? 'text-red-600' : 'text-orange-500'}`}>
                      {ev.tipo_evento}
                    </span>
                  </TableCell>
                  <TableCell>
                    {ev.trabajadores?.nombre ? (
                      <div>
                        <p className="font-semibold">{ev.trabajadores.nombre}</p>
                        <p className="text-xs text-slate-500">{ev.empresa}</p>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">No asignado</span>
                    )}
                  </TableCell>
                  <TableCell>{ev.lugar_exacto}</TableCell>
                  <TableCell>{getSeveridadBadge(ev.severidad)}</TableCell>
                  <TableCell>
                    <Badge variant={ev.estado_investigacion === 'CERRADA' ? 'default' : 'secondary'}>
                      {ev.estado_investigacion}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(ev)} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(ev.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
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
