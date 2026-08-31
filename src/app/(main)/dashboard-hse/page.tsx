"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  ShieldCheck,
  Users,
  FileText,
  AlertCircle,
  Calendar,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function DashboardHsePage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    permisosActivos: 0,
    ausentismo: 0,
    novedades: 0,
    incidentes: 0,
  });
  const [pyramidData, setPyramidData] = useState({
    mti: 0,
    fai: 0,
    nearMiss: 0,
    aci: 0,
  });
  const [permisosDistribucion, setPermisosDistribucion] = useState<any[]>([]);
  const [permisosCategorias, setPermisosCategorias] = useState<any[]>([]);
  const [operacionesPorMes, setOperacionesPorMes] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    const { data: permisos } = await supabase
      .from("permisos_trabajo")
      .select("*");
    const activos = permisos?.filter((p: any) => p.estado !== "CERRADO") || [];
    const { data: inasistencias } = await supabase
      .from("hse_inasistencias")
      .select("id");
    const { data: novedades } = await supabase
      .from("novedades_diarias")
      .select("id");
    const { data: eventos } = await supabase.from("hse_eventos").select("*");
    const currentMonth = new Date().getMonth();
    const incidentesMes =
      eventos?.filter(
        (e: any) =>
          new Date(e.fecha_evento || e.created_at).getMonth() === currentMonth,
      ) || [];
    setMetrics({
      permisosActivos: activos.length,
      ausentismo: inasistencias?.length || 0,
      novedades: novedades?.length || 0,
      incidentes: incidentesMes.length,
    });
    const mti =
      eventos?.filter(
        (e: any) =>
          e.tipo_evento === "ACCIDENTE" &&
          (e.severidad === "ALTA" || e.severidad === "FATALIDAD"),
      ).length || 0;
    const fai =
      eventos?.filter(
        (e: any) =>
          e.tipo_evento === "ACCIDENTE" &&
          (e.severidad === "BAJA" || e.severidad === "MEDIA"),
      ).length || 0;
    const nearMiss =
      eventos?.filter((e: any) => e.tipo_evento === "INCIDENTE").length || 0;
    const aci = novedades?.length || 0;
    setPyramidData({ mti, fai, nearMiss, aci });
    if (permisos) {
      let confinados = 0;
      let generales = 0;
      let unificados = 0;
      permisos.forEach((p: any) => {
        if (p.tipo === "CONFINADO") confinados++;
        else if (p.tipo === "OTRO") unificados++;
        else generales++;
      });
      setPermisosDistribucion(
        [
          { name: "Espacios Confinados", value: confinados, color: "#f97316" },
          { name: "Permisos Generales", value: generales, color: "#10b981" },
          { name: "Permiso Unificado", value: unificados, color: "#94a3b8" },
        ].filter((d) => d.value > 0),
      );
      setPermisosCategorias([
        { name: "Espacios Confinados", Cantidad: confinados, fill: "#f97316" },
        { name: "Permisos Generales", Cantidad: generales, fill: "#10b981" },
        { name: "Permiso Unificado", Cantidad: unificados, fill: "#94a3b8" },
      ]);
      const meses = [
        "Ene",
        "Feb",
        "Mar",
        "Abr",
        "May",
        "Jun",
        "Jul",
        "Ago",
        "Sep",
        "Oct",
        "Nov",
        "Dic",
      ];
      const opMes = meses.map((m) => ({ name: m, Total: 0 }));
      permisos.forEach((p: any) => {
        const date = new Date(p.created_at);
        if (date.getFullYear() === new Date().getFullYear()) {
          opMes[date.getMonth()].Total++;
        }
      });
      setOperacionesPorMes(opMes);
    }
    setLoading(false);
  };

  if (loading)
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        Cargando métricas...
      </div>
    );

  return (
    <div className="flex-1 overflow-auto p-4 md:p-8 bg-slate-50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Resumen de Rendimiento
          </h1>
          <p className="text-slate-500">
            Revisa las analíticas y métricas de Operaciones HSE.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-md shadow-sm font-medium hover:bg-slate-50">
          <Calendar className="w-4 h-4" /> Filtrar Fecha
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Permisos Activos
          </p>
          <p className="text-4xl font-bold text-slate-900">
            {metrics.permisosActivos}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Indicador Ausentismo
          </p>
          <p className="text-4xl font-bold text-slate-900">
            {metrics.ausentismo}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Novedades
          </p>
          <p className="text-4xl font-bold text-slate-900">
            {metrics.novedades}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Incidentes (Mes)
          </p>
          <p className="text-4xl font-bold text-slate-900">
            {metrics.incidentes}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
          <div className="w-full text-left mb-6">
            <h2 className="text-lg font-bold text-blue-600">Indicadores HSE</h2>
            <p className="text-xs font-bold text-slate-400 uppercase">
              Pirámide de Seguridad
            </p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-end w-full max-w-[200px] gap-[2px]">
            <div
              className="w-1/4 bg-red-600 text-white text-center py-2 relative"
              style={{ clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }}
            >
              <div className="font-bold text-xl leading-none mt-2">
                {pyramidData.mti}
              </div>
              <div className="text-[10px]">MTI</div>
            </div>
            <div
              className="w-1/2 bg-orange-500 text-white text-center py-2 relative"
              style={{
                clipPath: "polygon(25% 0%, 75% 0%, 100% 100%, 0% 100%)",
              }}
            >
              <div className="font-bold text-xl leading-none">
                {pyramidData.fai}
              </div>
              <div className="text-[10px]">FAI</div>
            </div>
            <div
              className="w-3/4 bg-yellow-400 text-white text-center py-2 relative"
              style={{
                clipPath: "polygon(16.6% 0%, 83.3% 0%, 100% 100%, 0% 100%)",
              }}
            >
              <div className="font-bold text-xl leading-none">
                {pyramidData.nearMiss}
              </div>
              <div className="text-[10px]">NEAR MISS</div>
            </div>
            <div
              className="w-full bg-[#fcd34d] text-slate-800 text-center py-3 relative"
              style={{
                clipPath: "polygon(12.5% 0%, 87.5% 0%, 100% 100%, 0% 100%)",
              }}
            >
              <div className="font-bold text-xl leading-none">
                {pyramidData.aci}
              </div>
              <div className="text-[10px]">ACI</div>
            </div>
          </div>
          <div className="w-full text-[9px] text-slate-400 mt-6 leading-tight">
            <p>
              <strong className="text-slate-600">ACI:</strong> Actos o
              Condiciones Inseguras
            </p>
            <p>
              <strong className="text-slate-600">NEAR MISS:</strong> Incidentes
              de Trabajo
            </p>
            <p>
              <strong className="text-slate-600">FAI:</strong> AT Casos de
              Primeros Auxilios
            </p>
            <p>
              <strong className="text-slate-600">MTI:</strong> AT Casos de
              Tratamiento Médico
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="w-full text-left mb-2">
            <h2 className="text-lg font-bold text-slate-900 italic">
              Permisos de Trabajo
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Distribución por peligrosidad
            </p>
          </div>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={permisosDistribucion}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {permisosDistribucion.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: "12px", fontWeight: "500" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="w-full text-left mb-4">
            <h2 className="text-lg font-bold text-slate-900 italic">
              Permisos Revalidados
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Consolidado por categoría
            </p>
          </div>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={permisosCategorias}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 10 }}
                  width={100}
                />
                <Tooltip />
                <Bar dataKey="Cantidad" barSize={15} radius={[0, 4, 4, 0]}>
                  {permisosCategorias.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Operaciones Totales
            </h2>
            <p className="text-sm text-slate-500">
              Validaciones de permisos por mes por Personal HSE
            </p>
          </div>
          <select className="border border-slate-200 rounded px-3 py-1 text-sm bg-slate-50 font-medium">
            <option>Este Año</option>
          </select>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={operacionesPorMes}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip cursor={{ fill: "#f1f5f9" }} />
              <Bar
                dataKey="Total"
                fill="#2563eb"
                radius={[4, 4, 0, 0]}
                maxBarSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
