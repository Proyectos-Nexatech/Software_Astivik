"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Notebook, FileClock, Edit2, Trash2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function NovedadesPage() {
  const [novedades, setNovedades] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialForm = {
    fecha: new Date().toISOString().split('T')[0],
    empresa: '',
    tipo_novedad: '',
    descripcion: '',
    reportado_por: '',
    horas_perdidas: 0,
    personas_afectadas: 0,
  };

  const [formData, setFormData] = useState(initialForm);
  const supabase = createClient();

  useEffect(() => {
    fetchNovedades();
  }, []);

  const fetchNovedades = async () => {
    setLoading(true);
    const { data } = await supabase.from('novedades_diarias').select('*').order('fecha', { ascending: false });
    if (data) setNovedades(data);

    // Fetch empresas unicas desde trabajadores
    const { data: tData } = await supabase.from('trabajadores').select('empresa');
    if (tData) {
      const unique = Array.from(new Set(tData.map(t => t.empresa).filter(Boolean))).sort() as string[];
      setEmpresas(unique);
    }
    setLoading(false);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(initialForm);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (novedad: any) => {
    setEditingId(novedad.id);
    setFormData({
      fecha: novedad.fecha,
      empresa: novedad.empresa,
      tipo_novedad: novedad.tipo_novedad,
      descripcion: novedad.descripcion,
      reportado_por: novedad.reportado_por,
      horas_perdidas: novedad.horas_perdidas || 0,
      personas_afectadas: novedad.personas_afectadas || 0
    });
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const hh_perdidas = (Number(formData.horas_perdidas) || 0) * (Number(formData.personas_afectadas) || 0);
    const payload = {
      ...formData,
      horas_perdidas: Number(formData.horas_perdidas) || 0,
      personas_afectadas: Number(formData.personas_afectadas) || 0,
      hh_perdidas
    };

    let error;
    if (editingId) {
      const { error: updateError } = await supabase.from('novedades_diarias').update(payload).eq('id', editingId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('novedades_diarias').insert([payload]);
      error = insertError;
    }

    setIsSubmitting(false);

    if (!error) {
      setIsDialogOpen(false);
      fetchNovedades();
    } else {
      alert("Error al guardar: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta novedad?")) return;
    const { error } = await supabase.from('novedades_diarias').delete().eq('id', id);
    if (!error) fetchNovedades();
  };

  const filteredNovedades = novedades.filter(n => 
    n.empresa.toLowerCase().includes(searchTerm.toLowerCase()) || 
    n.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-800">
            <Notebook className="w-8 h-8 text-teal-600" /> Novedades Diarias
          </h1>
          <p className="text-slate-500">Bitácora de eventos relevantes clasificados por contratista.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" /> Añadir Novedad
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Novedad" : "Registrar Nueva Novedad"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input type="date" required value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Empresa / Contratista</Label>
                  <Select required value={formData.empresa} onValueChange={(v) => setFormData({...formData, empresa: v})}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar empresa..." /></SelectTrigger>
                    <SelectContent>
                      {empresas.map((emp, idx) => (
                        <SelectItem key={idx} value={emp}>{emp}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Novedad</Label>
                <Select required value={formData.tipo_novedad} onValueChange={(v) => setFormData({...formData, tipo_novedad: v})}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar tipo..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLIMA">Clima / Lluvia</SelectItem>
                    <SelectItem value="EQUIPO">Falla de Equipo</SelectItem>
                    <SelectItem value="INSPECCION">Inspección</SelectItem>
                    <SelectItem value="OTRO">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input required placeholder="Describe lo ocurrido..." value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Horas Perdidas</Label>
                  <Input type="number" step="0.5" min="0" placeholder="Ej. 2.5" value={formData.horas_perdidas} onChange={e => setFormData({...formData, horas_perdidas: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="space-y-2">
                  <Label>Personas Afectadas</Label>
                  <Input type="number" min="0" placeholder="Ej. 5" value={formData.personas_afectadas} onChange={e => setFormData({...formData, personas_afectadas: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              
              {/* Resumen Automático HH */}
              {(formData.horas_perdidas > 0 || formData.personas_afectadas > 0) && (
                <div className="bg-slate-50 border border-slate-200 rounded p-3 flex justify-between items-center text-sm">
                  <span className="text-slate-600">Horas Hombre (HH) Perdidas:</span>
                  <span className="font-bold text-slate-800">
                    {(formData.horas_perdidas * formData.personas_afectadas).toFixed(2)} HH
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <Label>Reportado Por</Label>
                <Input required placeholder="Nombre de quien reporta" value={formData.reportado_por} onChange={e => setFormData({...formData, reportado_por: e.target.value})} />
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando..." : "Guardar Novedad"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input placeholder="Buscar por contratista, descripción..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Contratista / Empresa</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="w-1/3">Descripción</TableHead>
              <TableHead>Impacto (HH)</TableHead>
              <TableHead>Reportado por</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-500">Cargando...</TableCell></TableRow>
            ) : filteredNovedades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <FileClock className="w-12 h-12 mb-3 text-slate-300 mx-auto" />
                  <p className="text-lg font-medium text-slate-500">No hay novedades registradas</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredNovedades.map((nov) => (
                <TableRow key={nov.id}>
                  <TableCell className="whitespace-nowrap">{nov.fecha}</TableCell>
                  <TableCell className="font-semibold">{nov.empresa}</TableCell>
                  <TableCell><Badge variant="outline" className="bg-slate-50">{nov.tipo_novedad}</Badge></TableCell>
                  <TableCell className="truncate max-w-sm" title={nov.descripcion}>{nov.descripcion}</TableCell>
                  <TableCell>
                    {nov.hh_perdidas > 0 ? (
                      <span className="font-semibold text-rose-600">{nov.hh_perdidas} HH</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>{nov.reportado_por}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(nov)} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(nov.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
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
