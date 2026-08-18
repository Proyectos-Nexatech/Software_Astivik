"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserCircle, Calendar, Plus, Clock, Search, Trash2, Pencil, LayoutList, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function VisitantesPage() {
  const supabase = createClient();
  const [visitantes, setVisitantes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Form State
  const [documento, setDocumento] = useState("");
  const [nombre, setNombre] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [motivo, setMotivo] = useState("");
  
  // Date time defaults (Today to Tomorrow)
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const [fechaInicio, setFechaInicio] = useState(today.toISOString().slice(0, 16));
  const [fechaFin, setFechaFin] = useState(tomorrow.toISOString().slice(0, 16));

  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    fetchVisitantes();
  }, []);

  const fetchVisitantes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('visitantes')
      .select('*')
      .order('fecha_fin', { ascending: false });
    
    if (data) setVisitantes(data);
    setLoading(false);
  };

  const handleCrearVisitante = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documento || !nombre || !fechaInicio || !fechaFin) {
      alert("Por favor complete los campos obligatorios.");
      return;
    }

    if (new Date(fechaInicio) >= new Date(fechaFin)) {
      alert("La fecha de fin debe ser mayor a la de inicio.");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();

    const payload = {
      documento,
      nombre,
      empresa_origen: empresa || null,
      motivo_visita: motivo || null,
      fecha_inicio: new Date(fechaInicio).toISOString(),
      fecha_fin: new Date(fechaFin).toISOString(),
      creado_por: userData?.user?.id
    };

    let error;
    if (editingId) {
      const { error: updateError } = await supabase.from('visitantes').update(payload).eq('id', editingId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('visitantes').insert([payload]);
      error = insertError;
    }

    if (!error) {
      // Clear form
      setDocumento("");
      setNombre("");
      setEmpresa("");
      setMotivo("");
      setEditingId(null);
      fetchVisitantes();
    } else {
      alert("Error al guardar visitante.");
      console.error(error);
    }
  };

  const handleEdit = (v: any) => {
    setEditingId(v.id);
    setDocumento(v.documento);
    setNombre(v.nombre);
    setEmpresa(v.empresa_origen || "");
    setMotivo(v.motivo_visita || "");
    
    // Format to datetime-local (YYYY-MM-DDThh:mm)
    const localInicio = new Date(new Date(v.fecha_inicio).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    const localFin = new Date(new Date(v.fecha_fin).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    
    setFechaInicio(localInicio);
    setFechaFin(localFin);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Está seguro que desea eliminar este pase de visitante?")) {
      await supabase.from('visitantes').delete().eq('id', id);
      fetchVisitantes();
    }
  };

  const getEstadoVisitante = (inicio: string, fin: string) => {
    const now = new Date();
    const dInicio = new Date(inicio);
    const dFin = new Date(fin);

    if (now < dInicio) return { lbl: "PROGRAMADO", cls: "bg-blue-100 text-blue-800" };
    if (now > dFin) return { lbl: "VENCIDO", cls: "bg-red-100 text-red-800" };
    return { lbl: "ACTIVO", cls: "bg-green-100 text-green-800" };
  };

  const filteredVisitantes = visitantes.filter(v => 
    v.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    v.documento.includes(busqueda)
  );

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
    return days;
  };

  const getCalendarEvents = (day: Date | null) => {
    if (!day) return [];
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    
    return filteredVisitantes.filter(v => {
      const vStart = new Date(v.fecha_inicio);
      const vEnd = new Date(v.fecha_fin);
      return vStart <= dayEnd && vEnd >= dayStart;
    });
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-10">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-[#0a1e36] text-white rounded-lg flex items-center justify-center shadow-md">
          <UserCircle className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gestión de Visitantes</h1>
          <p className="text-slate-500 text-sm mt-1">Autorización y pases temporales para acceso a la planta.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" /> {editingId ? "Editar Visitante" : "Nuevo Visitante"}
            </CardTitle>
            <CardDescription>{editingId ? "Modificar los datos del pase." : "Generar un pase de acceso temporal."}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleCrearVisitante} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="doc" className="font-bold text-slate-700">Documento</Label>
                <Input id="doc" value={documento} onChange={e => setDocumento(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom" className="font-bold text-slate-700">Nombre Completo</Label>
                <Input id="nom" value={nombre} onChange={e => setNombre(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emp" className="text-slate-700">Empresa (Opcional)</Label>
                <Input id="emp" value={empresa} onChange={e => setEmpresa(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mot" className="text-slate-700">Motivo (Opcional)</Label>
                <Input id="mot" value={motivo} onChange={e => setMotivo(e.target.value)} />
              </div>
              
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-blue-600"/> Ventana de Autorización
                </h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500">DESDE</Label>
                    <Input type="datetime-local" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500">HASTA</Label>
                    <Input type="datetime-local" value={fechaFin} onChange={e => setFechaFin(e.target.value)} required />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button type="submit" className="w-full bg-[#0a1e36] text-white hover:bg-[#163354] h-11 font-bold">
                  {editingId ? "Guardar Cambios" : "Autorizar Pase"}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" className="w-full h-11" onClick={() => {
                    setEditingId(null);
                    setDocumento("");
                    setNombre("");
                    setEmpresa("");
                    setMotivo("");
                    setFechaInicio(new Date().toISOString().slice(0, 16));
                    const tom = new Date();
                    tom.setDate(tom.getDate() + 1);
                    setFechaFin(tom.toISOString().slice(0, 16));
                  }}>
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Registro Histórico</CardTitle>
              <CardDescription>Pases generados recientemente.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
              <div className="flex bg-slate-100 p-1 rounded-md text-sm font-medium border border-slate-200 w-full sm:w-auto justify-center">
                <button 
                  onClick={() => setViewMode('table')} 
                  className={`px-3 py-1.5 rounded-sm transition-colors flex items-center gap-1 ${viewMode === 'table' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                  title="Vista de Tabla"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('calendar')} 
                  className={`px-3 py-1.5 rounded-sm transition-colors flex items-center gap-1 ${viewMode === 'calendar' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                  title="Vista de Calendario"
                >
                  <Calendar className="w-4 h-4" />
                </button>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por cédula o nombre..."
                  className="pl-9 h-9"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Visitante</TableHead>
                      <TableHead>Rango Autorizado</TableHead>
                      <TableHead>Motivo / Origen</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-10">Cargando...</TableCell></TableRow>
                    ) : filteredVisitantes.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-500">No hay visitantes registrados.</TableCell></TableRow>
                    ) : (
                      filteredVisitantes.map(v => {
                        const st = getEstadoVisitante(v.fecha_inicio, v.fecha_fin);
                        return (
                          <TableRow key={v.id}>
                            <TableCell>
                              <div className="font-bold text-slate-800 text-sm">{v.nombre}</div>
                              <div className="text-xs text-slate-500">CC. {v.documento}</div>
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="flex items-center gap-1 text-slate-700">
                                <span className="font-semibold text-green-700">Inicia:</span> {new Date(v.fecha_inicio).toLocaleString()}
                              </div>
                              <div className="flex items-center gap-1 text-slate-700">
                                <span className="font-semibold text-red-700">Vence:</span> {new Date(v.fecha_fin).toLocaleString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{v.empresa_origen || '-'}</div>
                              <div className="text-xs text-slate-500">{v.motivo_visita || '-'}</div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={st.cls}>{st.lbl}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => handleEdit(v)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Editar">
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(v.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Eliminar">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-4 bg-slate-50/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800 text-lg capitalize">
                    {currentMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                  </h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                    <div key={day} className="text-center font-bold text-xs text-slate-500 py-2">{day}</div>
                  ))}
                  {getDaysInMonth(currentMonth).map((date, i) => (
                    <div key={i} className={`min-h-[100px] border border-slate-200 rounded-md p-1 ${!date ? 'bg-slate-100 opacity-50' : 'bg-white shadow-sm'}`}>
                      {date && (
                        <>
                          <div className={`text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${date.toDateString() === new Date().toDateString() ? 'bg-[#0a1e36] text-white' : 'text-slate-700'}`}>
                            {date.getDate()}
                          </div>
                          <div className="space-y-1 overflow-y-auto max-h-[70px] custom-scrollbar">
                            {getCalendarEvents(date).map((v, vi) => (
                              <div key={vi} className="text-[10px] leading-tight p-1 bg-blue-50 text-blue-800 rounded border border-blue-100 truncate cursor-pointer hover:bg-blue-100 transition-colors" title={`${v.nombre} (${getEstadoVisitante(v.fecha_inicio, v.fecha_fin).lbl})`} onClick={() => handleEdit(v)}>
                                {v.nombre}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
