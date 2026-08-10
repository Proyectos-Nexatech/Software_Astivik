"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, ShieldCheck, Mail, UserPlus, MoreVertical, HardHat, CheckSquare, Clock, Save, Loader2, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { crearUsuario, actualizarUsuario, eliminarUsuario, getUsuarios } from "@/app/actions/userActions";
import { createClient } from "@/utils/supabase/client";

const usuariosData: any[] = [];

const requisitosData: any[] = [];

const docLabels: Record<string, string> = {
  ss: "Seguridad Social (ARL/EPS)",
  examen: "Examen Médico Ocupacional",
  alturas: "Curso Alturas",
  confinados: "Espacios Confinados",
  soldadura: "Certificación Soldadura"
};

export default function ConfiguracionPage() {
  const supabase = createClient();
  const [usuarios, setUsuarios] = useState(usuariosData);
  const [requisitos, setRequisitos] = useState(requisitosData);
  const [activeTab, setActiveTab] = useState("usuarios");
  
  // Vigencias State
  const [vigencias, setVigencias] = useState<Record<string, number>>({
    ss: 1, examen: 12, alturas: 12, confinados: 12, soldadura: 6
  });
  const [savingVigencias, setSavingVigencias] = useState(false);
  const [loading, setLoading] = useState(true);
  // Modals state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({ nombre: "", email: "", rol: "CONTRATISTA", password: "", estado: "Activo" });
  const [savingUser, setSavingUser] = useState(false);
  
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const [reqForm, setReqForm] = useState({ cargo: "", ss: true, examen: true, alturas: false, confinados: false, soldadura: false });
  const [savingReq, setSavingReq] = useState(false);


  
  const fetchData = async () => {
    setLoading(true);
    // 1. Vigencias
    const { data: vData } = await supabase.from('configuracion_vigencias').select('*');
    if (vData) {
      const dbVigencias: Record<string, number> = {};
      vData.forEach((row: any) => { dbVigencias[row.tipo_documento] = row.periodo_meses; });
      setVigencias(prev => ({ ...prev, ...dbVigencias }));
    }
    
    // 2. Usuarios
    const uData = await getUsuarios();
    // @ts-ignore
    setUsuarios(uData || []);

    // 3. Requisitos
    const { data: rData } = await supabase.from('configuracion_requisitos').select('*').order('cargo');
    // @ts-ignore
    if (rData && rData.length > 0) setRequisitos(rData);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);


  const handleVigenciaChange = async (tipo_documento: string, meses: number) => {
    // Optimistic UI Update
    setVigencias(prev => ({ ...prev, [tipo_documento]: meses }));
    setSavingVigencias(true);

    try {
      await supabase.from('configuracion_vigencias').upsert({
        tipo_documento,
        periodo_meses: meses
      }, { onConflict: 'tipo_documento' });
    } catch (e) {
      console.error(e);
    } finally {
      setSavingVigencias(false);
    }
  };

  
  const toggleRequisito = async (idx: number, field: string) => {
    const newReqs = [...requisitos];
    const req = newReqs[idx];
    req[field] = !req[field];
    setRequisitos(newReqs);

    await supabase.from('configuracion_requisitos').update({ [field]: req[field] }).eq('cargo', req.cargo);
  };


  
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingUser(true);
    if (editingUser) {
      const res = await actualizarUsuario(editingUser.id, userForm.rol, userForm.estado);
      if (!res.success) alert(res.error);
    } else {
      const fd = new FormData();
      fd.append("nombre", userForm.nombre);
      fd.append("email", userForm.email);
      fd.append("rol", userForm.rol);
      fd.append("password", userForm.password);
      const res = await crearUsuario(fd);
      if (!res.success) alert(res.error);
    }
    setSavingUser(false);
    setIsUserModalOpen(false);
    fetchData();
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este usuario?")) {
      const res = await eliminarUsuario(id);
      if (!res.success) alert(res.error);
      fetchData();
    }
  };

  const openNewUser = () => {
    setEditingUser(null);
    setUserForm({ nombre: "", email: "", rol: "CONTRATISTA", password: "", estado: "Activo" });
    setIsUserModalOpen(true);
  };

  const openEditUser = (user: any) => {
    setEditingUser(user);
    setUserForm({ nombre: user.nombre, email: user.email, rol: user.rol, password: "", estado: user.estado });
    setIsUserModalOpen(true);
  };

  const handleSaveReq = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingReq(true);
    await supabase.from('configuracion_requisitos').insert(reqForm);
    setSavingReq(false);
    setIsReqModalOpen(false);
    fetchData();
  };

  const getRoleBadgeColor = (rol: string) => {
    switch(rol) {
      case "ADMINISTRADOR": return "bg-purple-100 text-purple-800 border-purple-200";
      case "INGENIERO": return "bg-blue-100 text-blue-800 border-blue-200";
      case "SUPERVISOR": return "bg-orange-100 text-orange-800 border-orange-200";
      case "GUARDIA": return "bg-slate-100 text-slate-800 border-slate-200";
      case "CONTRATISTA": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Configuración del Sistema</h1>
          <p className="text-slate-500 text-sm mt-1">Administra accesos, roles y parámetros generales de operación.</p>
        </div>
      </div>

      <div className="flex gap-6 border-b border-slate-200 mb-6 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('usuarios')} 
          className={`pb-3 px-2 border-b-2 font-semibold text-sm whitespace-nowrap transition-colors ${activeTab === 'usuarios' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Usuarios y Accesos (RBAC)
        </button>
        <button 
          onClick={() => setActiveTab('requisitos')} 
          className={`pb-3 px-2 border-b-2 font-semibold text-sm whitespace-nowrap transition-colors ${activeTab === 'requisitos' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Requisitos HSE
        </button>
        <button 
          onClick={() => setActiveTab('vigencias')} 
          className={`pb-3 px-2 border-b-2 font-semibold text-sm whitespace-nowrap transition-colors ${activeTab === 'vigencias' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Periodos de Vigencia
        </button>
      </div>

      {activeTab === 'usuarios' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
          <Card className="border-slate-200 shadow-sm col-span-1 md:col-span-2">
            <CardHeader className="pb-4 border-b border-slate-100">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-bold">Cuentas de Acceso</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="bg-white"><Mail className="w-3 h-3 mr-2" /> Invitar</Button>
                  <Button size="sm" onClick={openNewUser} className="bg-slate-900 text-white"><UserPlus className="w-3 h-3 mr-2" /> NUEVO USUARIO</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-semibold px-6">Nombre</TableHead>
                    <TableHead className="font-semibold">Correo / Usuario</TableHead>
                    <TableHead className="font-semibold">Rol Asignado</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead><TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell className="font-medium text-slate-900 px-6 py-3">{usuario.nombre}</TableCell>
                      <TableCell className="text-slate-500 text-sm">{usuario.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] font-bold tracking-wider ${getRoleBadgeColor(usuario.rol)}`}>
                          {usuario.rol}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${usuario.estado === 'Activo' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                          <span className={`text-sm ${usuario.estado === 'Activo' ? 'text-slate-700' : 'text-slate-400'}`}>{usuario.estado}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm bg-slate-900 text-white">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-400" /> Control RBAC
                </CardTitle>
                <CardDescription className="text-slate-300">Resumen de licencias activas.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                    <span className="text-sm font-medium text-slate-300">Administradores</span><span className="font-bold">1</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                    <span className="text-sm font-medium text-slate-300">Ingenieros Encargados</span><span className="font-bold">1</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-300">Contratistas (Visores)</span><span className="font-bold">1</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'requisitos' && (
        <div className="grid grid-cols-1 gap-6 animate-in fade-in duration-300">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <HardHat className="w-5 h-5 text-slate-500" /> Matriz de Requisitos por Cargo
                </CardTitle>
                <CardDescription>
                  Define qué documentos son obligatorios según la especialidad del trabajador.
                </CardDescription>
              </div>
              <Button onClick={() => setIsReqModalOpen(true)} className="bg-slate-900 text-white"><Plus className="w-4 h-4 mr-2" /> NUEVO CARGO</Button>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-semibold px-6 py-4">Cargo / Especialidad</TableHead>
                    <TableHead className="font-semibold text-center">Seguridad Social</TableHead>
                    <TableHead className="font-semibold text-center">Examen Médico</TableHead>
                    <TableHead className="font-semibold text-center">Curso Alturas</TableHead>
                    <TableHead className="font-semibold text-center">Espacios Confinados</TableHead>
                    <TableHead className="font-semibold text-center">Certificación Soldadura</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requisitos.map((req, idx) => (
                    <TableRow key={req.cargo} className="hover:bg-slate-50">
                      <TableCell className="font-bold text-slate-800 px-6">{req.cargo}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" onClick={() => toggleRequisito(idx, 'ss')} className={req.ss ? 'text-green-600' : 'text-slate-300'}>
                          <CheckSquare className="w-5 h-5" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" onClick={() => toggleRequisito(idx, 'examen')} className={req.examen ? 'text-green-600' : 'text-slate-300'}>
                          <CheckSquare className="w-5 h-5" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" onClick={() => toggleRequisito(idx, 'alturas')} className={req.alturas ? 'text-green-600' : 'text-slate-300'}>
                          <CheckSquare className="w-5 h-5" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" onClick={() => toggleRequisito(idx, 'confinados')} className={req.confinados ? 'text-green-600' : 'text-slate-300'}>
                          <CheckSquare className="w-5 h-5" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" onClick={() => toggleRequisito(idx, 'soldadura')} className={req.soldadura ? 'text-green-600' : 'text-slate-300'}>
                          <CheckSquare className="w-5 h-5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'vigencias' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-slate-500" /> Tiempos de Vigencia Estándar
                </CardTitle>
                <CardDescription>
                  Configura cuánto dura cada tipo de documento antes de expirar.
                </CardDescription>
              </div>
              {savingVigencias && (
                <div className="flex items-center text-sm text-slate-500">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-semibold px-6 py-4">Tipo de Documento</TableHead>
                    <TableHead className="font-semibold text-right px-6">Periodo de Validez</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(docLabels).map(([key, label]) => (
                    <TableRow key={key} className="hover:bg-slate-50">
                      <TableCell className="font-medium text-slate-800 px-6 py-3">{label}</TableCell>
                      <TableCell className="text-right px-6">
                        <Select 
                          value={vigencias[key]?.toString() || "12"} 
                          onValueChange={(val) => handleVigenciaChange(key, parseInt(val || '12'))}
                        >
                          <SelectTrigger className="w-[180px] bg-white ml-auto">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 Mes (Mensual)</SelectItem>
                            <SelectItem value="3">3 Meses (Trimestral)</SelectItem>
                            <SelectItem value="6">6 Meses (Semestral)</SelectItem>
                            <SelectItem value="12">1 Año (Anual)</SelectItem>
                            <SelectItem value="24">2 Años (Bienal)</SelectItem>
                            <SelectItem value="60">5 Años</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <div className="space-y-6">
            <Card className="bg-blue-50 border-blue-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-blue-900 text-lg flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" /> Auto-cálculo Habilitado
                </CardTitle>
              </CardHeader>
              <CardContent className="text-blue-800 text-sm leading-relaxed">
                Al configurar estos periodos, el sistema sabe exactamente cuándo vencerá un documento. 
                <br/><br/>
                En futuras actualizaciones, si un contratista sube un curso de Alturas y pones como fecha de expedición "01/01/2026", el sistema le sumará automáticamente 1 Año (según tu configuración) y fijará su fecha de vencimiento sin intervención manual.
                <br/><br/>
                <span className="font-bold">Nota:</span> Estos cambios se guardan automáticamente en tiempo real en la base de datos central.
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Modals */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveUser} className="space-y-4">
            {!editingUser && (
              <>
                <div><Label>Nombre</Label><Input required value={userForm.nombre} onChange={e => setUserForm({...userForm, nombre: e.target.value})} /></div>
                <div><Label>Email</Label><Input type="email" required value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} /></div>
                <div><Label>Contraseña</Label><Input type="password" required value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} /></div>
              </>
            )}
            <div>
              <Label>Rol</Label>
              <Select value={userForm.rol || ""} onValueChange={v => setUserForm({...userForm, rol: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMINISTRADOR">Administrador</SelectItem>
                  <SelectItem value="INGENIERO">Ingeniero</SelectItem>
                  <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                  <SelectItem value="GUARDIA">Guardia</SelectItem>
                  <SelectItem value="CONTRATISTA">Contratista</SelectItem>
                  <SelectItem value="lider_hse">Líder HSE</SelectItem>
                  <SelectItem value="lider_contratista">Líder Contratista</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editingUser && (
              <div>
                <Label>Estado</Label>
                <Select value={userForm.estado || ""} onValueChange={v => setUserForm({...userForm, estado: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="Inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsUserModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={savingUser}>{savingUser ? "Guardando..." : "Guardar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isReqModalOpen} onOpenChange={setIsReqModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Cargo / Especialidad</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveReq} className="space-y-4">
            <div><Label>Nombre del Cargo</Label><Input required value={reqForm.cargo} onChange={e => setReqForm({...reqForm, cargo: e.target.value})} /></div>
            <div className="flex gap-4 items-center">
              <input type="checkbox" checked={reqForm.ss} onChange={e => setReqForm({...reqForm, ss: e.target.checked})} /> <Label>Seguridad Social</Label>
            </div>
            <div className="flex gap-4 items-center">
              <input type="checkbox" checked={reqForm.examen} onChange={e => setReqForm({...reqForm, examen: e.target.checked})} /> <Label>Examen Médico</Label>
            </div>
            <div className="flex gap-4 items-center">
              <input type="checkbox" checked={reqForm.alturas} onChange={e => setReqForm({...reqForm, alturas: e.target.checked})} /> <Label>Curso Alturas</Label>
            </div>
            <div className="flex gap-4 items-center">
              <input type="checkbox" checked={reqForm.confinados} onChange={e => setReqForm({...reqForm, confinados: e.target.checked})} /> <Label>Confinados</Label>
            </div>
            <div className="flex gap-4 items-center">
              <input type="checkbox" checked={reqForm.soldadura} onChange={e => setReqForm({...reqForm, soldadura: e.target.checked})} /> <Label>Soldadura</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsReqModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={savingReq}>{savingReq ? "Guardando..." : "Guardar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
