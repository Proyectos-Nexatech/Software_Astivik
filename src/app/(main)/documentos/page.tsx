"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, ShieldAlert, ShieldCheck, FileText, Calendar as CalendarIcon, UploadCloud, XCircle, CheckCircle2, FileCheck, Loader2, CheckSquare, XSquare, Eye } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { notificarHseDocumentoSubido, notificarContratistaDocumentoAprobado } from "@/app/actions/emailActions";

// Required docs per cargo (simulating the configuration matrix)
const requiredDocsByCargo: Record<string, string[]> = {
  "Soldador 1A": ["ss", "examen", "alturas", "confinados", "soldadura"],
  "Sandblaster": ["ss", "examen", "alturas", "confinados"],
  "Electricista": ["ss", "examen", "alturas"]
};

export default function DocumentosHSEPage() {
  const supabase = createClient();
  const [trabajadores, setTrabajadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedTrabajador, setSelectedTrabajador] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null);
  const [vigenciasConfig, setVigenciasConfig] = useState<Record<string, number>>({});
  
  // Auth Profile State
  const [userProfile, setUserProfile] = useState<any>(null);

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

  const fetchData = async () => {
    setLoading(true);
    
    // 0. Autenticación y Perfil
    const { data: { user } } = await supabase.auth.getUser();
    let profile = null;
    let empresaFiltro = null;
    
    if (user) {
      const { data: pData } = await supabase.from('perfiles_usuario').select('*, contratistas(nombre)').eq('id', user.id).single();
      profile = pData;
      setUserProfile(pData);
      if (pData?.rol === 'lider_contratista' && pData?.contratistas?.nombre) {
        empresaFiltro = pData.contratistas.nombre;
      }
    }

    // 1. Fetch Vigencias Config
    const { data: configData } = await supabase.from('configuracion_vigencias').select('*');
    const vConfig: Record<string, number> = {
      ss: 1, examen: 12, alturas: 12, confinados: 12, soldadura: 6 // Defaults
    };
    if (configData) {
      configData.forEach((row: any) => {
        vConfig[row.tipo_documento] = row.periodo_meses;
      });
    }
    setVigenciasConfig(vConfig);

    // 2. Fetch Workers (Filtrados si es Contratista)
    let workersQuery = supabase.from('trabajadores').select('*').order('created_at', { ascending: true });
    
    if (empresaFiltro) {
      const palabraClave = empresaFiltro.split(' ')[0]; // Ej. "Metalprest S.A.S" -> "Metalprest"
      workersQuery = workersQuery.ilike('empresa', `%${palabraClave}%`);
    }
    
    const { data: workersData } = await workersQuery;

    if (!workersData || workersData.length === 0) {
      setTrabajadores([]);
      setLoading(false);
      return;
    }

    // 3. Fetch Documents
    const { data: docsData } = await supabase.from('documentos_hse').select('*');

    // 4. Merge data
    const merged = workersData.map(worker => {
      // Default structure
      const docsMap: any = {
        ss: null, examen: null, alturas: null, confinados: null, soldadura: null
      };

      const requiredKeys = requiredDocsByCargo[worker.cargo] || ["ss", "examen"];

      requiredKeys.forEach(key => {
        // Initialize as missing
        docsMap[key] = { expedicion: "", vigencia: "", estado: "Faltante", archivo_url: "", estado_aprobacion: "Pendiente" };
      });

      // Override with DB data if exists
      docsData?.filter(d => d.trabajador_id === worker.id).forEach(d => {
        if (d.tipo_documento) {
          let expedicionInvertida = "";
          if (d.fecha_vencimiento) {
            const vigenciaMeses = vConfig[d.tipo_documento] || 12;
            const dateObj = new Date(d.fecha_vencimiento + 'T00:00:00');
            dateObj.setMonth(dateObj.getMonth() - vigenciaMeses);
            expedicionInvertida = dateObj.toISOString().split('T')[0];
          }

          docsMap[d.tipo_documento] = {
            expedicion: expedicionInvertida,
            vigencia: d.fecha_vencimiento,
            estado: calculateEstado(d.fecha_vencimiento), // Dinámico
            archivo_url: d.archivo_url,
            estado_aprobacion: d.estado_aprobacion || "Pendiente",
            id: d.id // DB id for the document row
          };
        }
      });

      return {
        ...worker,
        contratista: worker.empresa,
        docs: docsMap
      };
    });

    setTrabajadores(merged);
    
    // If modal is open, refresh selectedTrabajador
    if (selectedTrabajador) {
      const updated = merged.find(t => t.id === selectedTrabajador.id);
      if (updated) setSelectedTrabajador(updated);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);



  const calculateVencimiento = (docKey: string, expedicionDate: string) => {
    if (!expedicionDate) return "";
    const meses = vigenciasConfig[docKey] || 12;
    const date = new Date(expedicionDate + 'T00:00:00');
    date.setMonth(date.getMonth() + meses);
    return date.toISOString().split('T')[0];
  };

  const updateDocDate = async (docKey: string, newExpedicionDate: string) => {
    if (!selectedTrabajador) return;
    
    // Auto calculate vencimiento
    const autoVencimiento = calculateVencimiento(docKey, newExpedicionDate);
    const newEstado = calculateEstado(autoVencimiento);

    // Upsert to DB (Sets to Pendiente automatically because dates changed)
    const currentDoc = selectedTrabajador.docs[docKey];
    await supabase.from('documentos_hse').upsert({
      trabajador_id: selectedTrabajador.id,
      tipo_documento: docKey,
      fecha_vencimiento: autoVencimiento,
      estado: newEstado,
      estado_aprobacion: 'Pendiente', // Re-review needed
      archivo_url: currentDoc?.archivo_url || ""
    }, { onConflict: 'trabajador_id,tipo_documento' });
    
    fetchData();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docKey: string) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTrabajador) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Error: El archivo excede el límite permitido de 5 MB.");
      return;
    }

    setUploadingDocKey(docKey);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedTrabajador.documento}_${docKey}_${Date.now()}.${fileExt}`;
      const filePath = `certificados/${fileName}`;

      const { error } = await supabase.storage.from('hse_docs').upload(filePath, file);
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from('hse_docs').getPublicUrl(filePath);

      // Save to DB
      const currentDoc = selectedTrabajador.docs[docKey];
      const vigencia = currentDoc?.vigencia || new Date().toISOString().split('T')[0];
      const estado = calculateEstado(vigencia);

      await supabase.from('documentos_hse').upsert({
        trabajador_id: selectedTrabajador.id,
        tipo_documento: docKey,
        fecha_vencimiento: vigencia,
        estado: estado,
        estado_aprobacion: 'Pendiente',
        archivo_url: publicUrl
      }, { onConflict: 'trabajador_id,tipo_documento' });

      // Trigger Email to HSE Leader
      if (userProfile?.rol === 'lider_contratista') {
        await notificarHseDocumentoSubido(selectedTrabajador.contratista, selectedTrabajador.nombre, docKey);
      }

      await fetchData();
      alert("Archivo PDF subido exitosamente. En proceso de revisión por HSE.");

    } catch (err: any) {
      console.error(err);
      alert("Ocurrió un error al subir el archivo: " + err.message);
    } finally {
      setUploadingDocKey(null);
    }
  };

  const handleAprobarDocumento = async (docKey: string, aprobado: boolean) => {
    const currentDoc = selectedTrabajador.docs[docKey];
    if (!currentDoc.id) return;
    
    const nuevoEstadoAprobacion = aprobado ? 'Aprobado' : 'Rechazado';

    const { error } = await supabase
      .from('documentos_hse')
      .update({ estado_aprobacion: nuevoEstadoAprobacion })
      .eq('id', currentDoc.id);

    if (!error) {
      if (aprobado) {
        // Enviar correo al contratista
        await notificarContratistaDocumentoAprobado("proyectos@nexatech.com.co", selectedTrabajador.nombre, docKey);
      }
      fetchData();
    }
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

  const getStatusColor = (status: string) => {
    switch(status) {
      case "Vigente": return "text-green-600 bg-green-50";
      case "Por Vencer": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "Vencido": return "text-red-600 bg-red-50 border-red-200";
      case "Faltante": return "text-slate-400 bg-slate-100 border-slate-200";
      default: return "text-slate-400 bg-slate-50";
    }
  };

  const openAuditModal = (trabajador: any) => {
    setSelectedTrabajador(trabajador);
    setIsModalOpen(true);
  };

  const docLabels: Record<string, string> = {
    ss: "Seguridad Social (ARL/EPS)",
    examen: "Examen Médico Ocupacional",
    alturas: "Curso Alturas",
    confinados: "Espacios Confinados",
    soldadura: "Certificación Soldadura"
  };

  if (loading && trabajadores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <span className="text-slate-600 font-medium animate-pulse">Cargando base de datos y permisos...</span>
      </div>
    );
  }

  const esLiderHSE = userProfile?.rol === 'lider_hse';

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Control Documental HSE</h1>
          <p className="text-slate-500 text-sm mt-1">Matriz de certificados y aprobaciones.</p>
        </div>
        <div className="flex gap-2">
          {userProfile && (
            <Badge variant="outline" className="mr-4 px-3 py-1 bg-slate-100">
              Perfil: <span className="font-bold ml-1">{esLiderHSE ? 'Líder HSE' : 'Líder Contratista'}</span>
            </Badge>
          )}
          <Button variant="outline" className="bg-white text-slate-600" onClick={() => fetchData()}>
            <FileText className="w-4 h-4 mr-2" /> Refrescar DB
          </Button>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
          <div className="flex gap-4">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Buscar por cédula, nombre..." className="pl-9 h-9 bg-white" />
            </div>
          </div>
          <div className="flex gap-4 text-sm font-medium">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span> Habilitado</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> Alerta</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span> Inhabilitado</div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-slate-700 min-w-[250px] sticky left-0 bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Personal / Empresa</TableHead>
                <TableHead className="font-bold text-slate-700 text-center min-w-[120px]">Estado Global</TableHead>
                {/* Dynamically generated columns for the most common docs */}
                <TableHead className="text-center text-slate-600">SS (ARL/EPS)</TableHead>
                <TableHead className="text-center text-slate-600">Examen Médico</TableHead>
                <TableHead className="text-center text-slate-600">Curso Alturas</TableHead>
                <TableHead className="text-center text-slate-600">Esp. Confinados</TableHead>
                <TableHead className="text-center text-slate-600 min-w-[150px]">Cert. Soldadura</TableHead>
                <TableHead className="text-center font-bold text-slate-700 sticky right-0 bg-slate-50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trabajadores.map((t) => {
                const globalStatus = getGlobalStatus(t.docs);
                const globalColor = globalStatus === "HABILITADO" ? "text-green-700 bg-green-50 border-green-200" :
                                   globalStatus === "ALERTA PREVENTIVA" ? "text-yellow-700 bg-yellow-50 border-yellow-200" :
                                   "text-red-700 bg-red-50 border-red-200";
                
                const docsOrder = ['ss', 'examen', 'alturas', 'confinados', 'soldadura'];

                return (
                  <TableRow key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      <div className="font-bold text-slate-900">{t.nombre}</div>
                      <div className="text-xs text-slate-500 font-medium">{t.cargo} • {t.contratista}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`${globalColor} whitespace-nowrap`}>
                        {globalStatus === "HABILITADO" && <ShieldCheck className="w-3 h-3 mr-1" />}
                        {globalStatus === "ALERTA PREVENTIVA" && <ShieldAlert className="w-3 h-3 mr-1" />}
                        {globalStatus === "INHABILITADO" && <XCircle className="w-3 h-3 mr-1" />}
                        {globalStatus}
                      </Badge>
                    </TableCell>
                    
                    {docsOrder.map(docKey => {
                      const doc = t.docs[docKey];
                      if (!doc) return <TableCell key={docKey} className="text-center"><span className="text-slate-300">-</span></TableCell>;
                      
                      const isAprobado = doc.estado_aprobacion === 'Aprobado';
                      const isRechazado = doc.estado_aprobacion === 'Rechazado';
                      
                      return (
                        <TableCell key={docKey} className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <Badge variant="outline" className={`${getStatusColor(doc.estado)} text-[10px]`}>
                              {doc.estado}
                            </Badge>
                            {doc.estado !== 'Faltante' && (
                              <span className={`text-[10px] font-bold ${isAprobado ? 'text-green-600' : isRechazado ? 'text-red-600' : 'text-blue-500'}`}>
                                {isAprobado ? '✓ Aprobado' : isRechazado ? '✕ Rechazado' : '⏳ Pendiente'}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      );
                    })}

                    <TableCell className="text-center sticky right-0 bg-white shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      <Button variant="secondary" size="sm" onClick={() => openAuditModal(t)} className="font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100">
                        Gestionar
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {trabajadores.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-slate-500">
                    No hay trabajadores registrados o visibles para tu perfil. 
                    {userProfile?.rol === 'lider_contratista' && (
                      <span className="block mt-2 text-xs text-blue-500">
                        (Tu empresa asignada es: <strong>{userProfile?.contratistas?.nombre || "Ninguna"}</strong>. Verifica que el personal en la base de datos tenga exactamente este mismo nombre en el campo "empresa").
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Gestión / Auditoría (RBAC Aplicado) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-blue-600" /> 
              {esLiderHSE ? "Revisión HSE (Aprobaciones)" : "Gestión de Expediente"}
            </DialogTitle>
            <DialogDescription>
              {selectedTrabajador?.nombre} • {selectedTrabajador?.cargo} • {selectedTrabajador?.contratista}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTrabajador && (
            <div className="space-y-4 py-4">
              {Object.keys(selectedTrabajador.docs).map(docKey => {
                const doc = selectedTrabajador.docs[docKey];
                if (!doc) return null;
                const isUploading = uploadingDocKey === docKey;
                const isAprobado = doc.estado_aprobacion === 'Aprobado';
                const isRechazado = doc.estado_aprobacion === 'Rechazado';

                return (
                  <div key={docKey} className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg border ${isAprobado ? 'border-green-200 bg-green-50/30' : isRechazado ? 'border-red-200 bg-red-50/30' : 'border-slate-200 bg-white'}`}>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Label className="font-bold text-slate-800 text-sm uppercase tracking-wide">{docLabels[docKey]}</Label>
                        <Badge variant="outline" className={`${getStatusColor(doc.estado)} text-[10px]`}>{doc.estado}</Badge>
                        {doc.estado !== 'Faltante' && (
                          <Badge variant="outline" className={`text-[10px] ${isAprobado ? 'bg-green-100 text-green-800' : isRechazado ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                            {isAprobado ? 'Aprobado por HSE' : isRechazado ? 'Rechazado por HSE' : 'Revisión Pendiente'}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        Vence: {doc.vigencia || "Sin registrar"}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Fechas: Bloquear si ya está aprobado y es contratista */}
                      <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-md border border-slate-200">
                        <CalendarIcon className="w-4 h-4 text-slate-400" />
                        <Input 
                          type="date" 
                          className="h-8 w-[130px] text-xs" 
                          value={doc.expedicion}
                          onChange={(e) => updateDocDate(docKey, e.target.value)}
                          disabled={!esLiderHSE && isAprobado}
                          title="Fecha de Expedición"
                        />
                      </div>
                      
                      {/* Subir PDF: Ocultar para HSE si lo prefiere, o bloquear si está aprobado para Contratista */}
                      <div className="relative">
                        <Button 
                          variant={doc.archivo_url ? "outline" : "default"} 
                          size="sm" 
                          disabled={isUploading || (!esLiderHSE && isAprobado)}
                          className={!doc.archivo_url ? "bg-slate-900 text-white" : "border-slate-300 text-slate-700"}
                          onClick={() => document.getElementById(`upload-${docKey}`)?.click()}
                        >
                          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                          {!doc.archivo_url && <span className="ml-2 hidden sm:inline">Subir PDF</span>}
                        </Button>
                        <input 
                          id={`upload-${docKey}`}
                          type="file" 
                          accept="application/pdf"
                          className="hidden" 
                          onChange={(e) => handleFileUpload(e, docKey)}
                          disabled={!esLiderHSE && isAprobado}
                        />
                      </div>

                      {doc.archivo_url && (
                        <a href={doc.archivo_url} target="_blank" rel="noreferrer">
                          <Button variant="ghost" size="sm" className="text-blue-600 bg-blue-50 hover:bg-blue-100">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </a>
                      )}

                      {/* Botones de Aprobación (SÓLO LÍDER HSE) */}
                      {esLiderHSE && doc.estado !== 'Faltante' && (
                        <div className="flex items-center gap-1 border-l border-slate-200 pl-2 ml-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`p-2 ${isAprobado ? 'bg-green-100 text-green-700' : 'text-slate-400 hover:text-green-600 hover:bg-green-50'}`}
                            title="Aprobar Documento"
                            onClick={() => handleAprobarDocumento(docKey, true)}
                          >
                            <CheckSquare className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`p-2 ${isRechazado ? 'bg-red-100 text-red-700' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
                            title="Rechazar Documento"
                            onClick={() => handleAprobarDocumento(docKey, false)}
                          >
                            <XSquare className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          <DialogFooter className="bg-slate-50 -mx-6 -mb-6 p-4 border-t border-slate-100 mt-2">
            <Button onClick={() => setIsModalOpen(false)} variant="outline">Cerrar Expediente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
