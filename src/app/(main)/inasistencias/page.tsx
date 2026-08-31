"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, UserX, Clock, Edit2, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function InasistenciasPage() {
  const [inasistencias, setInasistencias] = useState<any[]>([]);
  const [trabajadores, setTrabajadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialForm = {
    trabajador_id: '',
    fecha: new Date().toISOString().split('T')[0],
    motivo: '',
    es_justificada: 'false'
  };

  const [formData, setFormData] = useState(initialForm);
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [limiteHora, setLimiteHora] = useState("08:00");

  const fetchData = async () => {
    setLoading(true);
    const { data: iData } = await supabase.from('inasistencias').select('*, trabajadores(nombre, empresa)').order('fecha', { ascending: false });
    if (iData) setInasistencias(iData);

    const { data: tData } = await supabase.from('trabajadores').select('id, nombre, empresa').order('nombre');
    if (tData) setTrabajadores(tData);

    // Fetch config
    const { data: cData } = await supabase.from('configuracion_sistema').select('valor').eq('clave', 'HORA_LIMITE_INASISTENCIA').single();
    if (cData) setLimiteHora(cData.valor);

    setLoading(false);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(initialForm);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (ina: any) => {
    setEditingId(ina.id);
    setFormData({
      trabajador_id: ina.trabajador_id || '',
      fecha: ina.fecha,
      motivo: ina.motivo || '',
      es_justificada: ina.es_justificada ? 'true' : 'false'
    });
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload = {
      ...formData,
      es_justificada: formData.es_justificada === 'true'
    };

    let error;
    if (editingId) {
      const { error: updateError } = await supabase.from('inasistencias').update(payload).eq('id', editingId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('inasistencias').insert([payload]);
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

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await supabase
      .from('configuracion_sistema')
      .update({ valor: limiteHora })
      .eq('clave', 'HORA_LIMITE_INASISTENCIA');
    
    setIsSubmitting(false);
    if (!error) {
      setIsConfigOpen(false);
    } else {
      alert("Error al guardar la configuración: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta inasistencia?")) return;
    const { error } = await supabase.from('inasistencias').delete().eq('id', id);
    if (!error) fetchData();
  };

  const filteredInasistencias = inasistencias.filter(ina => 
    ina.trabajadores?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    ina.trabajadores?.empresa?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-800">
            <UserX className="w-8 h-8 text-rose-600" /> Control de Inasistencias
          </h1>
          <p className="text-slate-500">Gestión de ausentismo del personal y contratistas.</p>
        </div>
        
        <div className="flex gap-3">
          <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
            <DialogTrigger render={<Button variant="outline" className="text-slate-600" />}>
              <Clock className="w-4 h-4 mr-2" /> Configurar Límite
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configuración de Ausentismo</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSaveConfig} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Hora límite de ingreso</Label>
                  <p className="text-xs text-slate-500">Si un trabajador no registra entrada en el torniquete antes de esta hora, se marcará automáticamente como inasistencia.</p>
                  <Input type="time" required value={limiteHora} onChange={e => setLimiteHora(e.target.value)} />
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-rose-600 hover:bg-rose-700" disabled={isSubmitting}>
                    {isSubmitting ? "Guardando..." : "Guardar Configuración"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={<Button className="bg-rose-600 hover:bg-rose-700" onClick={handleOpenCreate} />}>
              <Plus className="w-4 h-4 mr-2" /> Registrar Ausencia
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Inasistencia" : "Registrar Inasistencia Manual"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4 py-4">
                
                <div className="space-y-2">
                  <Label>Trabajador</Label>
                  <Select required value={formData.trabajador_id || ''} onValueChange={(v) => setFormData({...formData, trabajador_id: v || ''})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar trabajador...">
                        {formData.trabajador_id 
                          ? trabajadores.find(t => t.id === formData.trabajador_id)?.nombre 
                          : "Seleccionar trabajador..."}
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
                    value={formData.trabajador_id ? (trabajadores.find(t => t.id === formData.trabajador_id)?.empresa || 'Sin empresa asignada') : ''} 
                    placeholder="Se llena automáticamente al elegir trabajador..." 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha</Label>
                    <Input type="date" required value={formData.fecha || ''} onChange={e => setFormData({...formData, fecha: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>¿Es justificada?</Label>
                    <Select required value={formData.es_justificada || ''} onValueChange={(v) => setFormData({...formData, es_justificada: v || ''})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar...">
                           {formData.es_justificada === 'true' ? 'Sí (Con excusa médica, etc)' : 'No (Falta injustificada)'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Sí (Con excusa médica, etc)</SelectItem>
                        <SelectItem value="false">No (Falta injustificada)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Motivo / Observación</Label>
                  <Input placeholder="Opcional. Ej. Reposo médico por 3 días." value={formData.motivo || ''} onChange={e => setFormData({...formData, motivo: e.target.value})} />
                </div>

                <DialogFooter>
                  <Button type="submit" className="bg-rose-600 hover:bg-rose-700" disabled={isSubmitting}>
                    {isSubmitting ? "Guardando..." : "Guardar Inasistencia"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input placeholder="Buscar por nombre o empresa..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Trabajador</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Justificada</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-500">Cargando registros...</TableCell></TableRow>
            ) : filteredInasistencias.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <UserX className="w-12 h-12 mb-3 text-slate-300 mx-auto" />
                  <p className="text-lg font-medium text-slate-500">No hay inasistencias registradas</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredInasistencias.map((ina) => (
                <TableRow key={ina.id}>
                  <TableCell className="whitespace-nowrap">{ina.fecha}</TableCell>
                  <TableCell className="font-semibold">{ina.trabajadores?.nombre || 'Desconocido'}</TableCell>
                  <TableCell>{ina.trabajadores?.empresa || 'N/A'}</TableCell>
                  <TableCell>{ina.motivo || <span className="text-slate-400 italic">Sin motivo registrado</span>}</TableCell>
                  <TableCell>
                    {ina.es_justificada ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Sí</Badge>
                    ) : (
                      <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50"><XCircle className="w-3 h-3 mr-1" /> No</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(ina)} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(ina.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
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
