import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSpreadsheet, FileText, FileDown, Clock, Calendar as CalendarIcon, Filter, Users, AlertCircle } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-[1100px] mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard de Inteligencia Operativa</h1>
          <p className="text-slate-500 text-sm mt-1">Datos en tiempo real de seguridad y aforo en planta.</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/api/v1/reports/export" download>
            <Button variant="outline" size="sm" className="bg-white text-slate-600 font-medium h-9"><FileSpreadsheet className="w-4 h-4 mr-2" /> EXCEL</Button>
          </a>
          <Button variant="outline" size="sm" className="bg-white text-slate-600 font-medium h-9"><FileText className="w-4 h-4 mr-2" /> PDF</Button>
          <Button variant="outline" size="sm" className="bg-white text-slate-600 font-medium h-9"><FileDown className="w-4 h-4 mr-2" /> CSV</Button>
          <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white font-medium h-9"><Clock className="w-4 h-4 mr-2" /> PROGRAMAR ENVÍO</Button>
        </div>
      </div>

      <Card className="bg-white shadow-sm border-slate-200">
        <CardContent className="p-4 flex flex-wrap md:flex-nowrap gap-4 items-end">
          <div className="space-y-2 flex-1 min-w-[200px]">
            <label className="text-[11px] font-bold text-slate-500 tracking-wider">PROYECTO / BARCO</label>
            <Select defaultValue="all">
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Todos los proyectos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los proyectos</SelectItem>
                <SelectItem value="p1">Barco Alpha</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 flex-1 min-w-[200px]">
            <label className="text-[11px] font-bold text-slate-500 tracking-wider">CONTRATISTA</label>
            <Select defaultValue="all">
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Todas las empresas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las empresas</SelectItem>
                <SelectItem value="c1">Metalprest</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 flex-1 min-w-[220px]">
            <label className="text-[11px] font-bold text-slate-500 tracking-wider">RANGO DE FECHAS</label>
            <div className="flex items-center border border-slate-200 rounded-md px-3 h-10 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
              <CalendarIcon className="w-4 h-4 text-slate-500 mr-2" />
              <span className="text-sm text-slate-600 font-medium">01/10/2023 - 31/10/2023</span>
            </div>
          </div>
          <Button className="bg-slate-600 hover:bg-slate-700 text-white font-semibold h-10 px-6">
            <Filter className="w-4 h-4 mr-2" /> APLICAR FILTROS
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] font-bold text-slate-500 tracking-wider flex justify-between items-center">
              CUMPLIMIENTO GLOBAL
              <div className="w-5 h-5 rounded-full border border-green-500 flex items-center justify-center">
                 <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-[2.5rem] leading-none font-bold text-slate-900 tracking-tight">94.2%</span>
              <span className="text-xs font-bold text-green-600">+2.1% vs mes ant.</span>
            </div>
            <div className="mt-5 h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div className="bg-green-500 w-[94.2%] rounded-full"></div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] font-bold text-slate-500 tracking-wider flex justify-between items-center">
              AFORO ACTUAL EN PLANTA
              <Users className="w-4 h-4 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-[2.5rem] leading-none font-bold text-slate-900 tracking-tight">1,284</span>
              <span className="text-xs font-medium text-slate-500">de 1,500 máx.</span>
            </div>
            <div className="mt-5 flex items-center text-xs font-medium text-slate-600">
              <div className="w-2 h-2 rounded-full bg-blue-500 mr-2 shadow-[0_0_0_2px_rgba(59,130,246,0.2)]"></div>
              Nivel de ocupación: Óptimo
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] font-bold text-slate-500 tracking-wider flex justify-between items-center">
              TASA DE AUSENTISMO
              <AlertCircle className="w-4 h-4 text-red-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-[2.5rem] leading-none font-bold text-slate-900 tracking-tight">3.8%</span>
              <span className="text-xs font-bold text-red-600">-0.5% vs prom. anual</span>
            </div>
            <div className="mt-5 flex items-center text-xs font-medium text-slate-600">
              <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
              42 Bloqueos HSE hoy
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-0 flex gap-6 overflow-x-auto bg-slate-50/50">
          <button className="px-1 py-4 text-xs font-bold tracking-wider border-b-2 border-black whitespace-nowrap text-slate-900">
            AUSENTISMO Y MARCACIONES
          </button>
          <button className="px-1 py-4 text-xs font-bold tracking-wider text-slate-500 hover:text-slate-800 whitespace-nowrap transition-colors">
            ESTADO POR CONTRATISTA
          </button>
          <button className="px-1 py-4 text-xs font-bold tracking-wider text-slate-500 hover:text-slate-800 whitespace-nowrap transition-colors">
            AFORO Y HORAS
          </button>
        </div>
        <CardContent className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-semibold text-lg text-slate-900 tracking-tight">Nómina Esperada vs. Real</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-900 rounded-sm"></div><span className="text-[10px] font-bold tracking-wider text-slate-500">ESPERADA</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-500 rounded-sm"></div><span className="text-[10px] font-bold tracking-wider text-slate-500">REAL</span></div>
            </div>
          </div>
          
          <div className="h-[280px] w-full relative flex items-end justify-between px-10">
             <div className="absolute inset-0 flex flex-col justify-between pt-2 pb-6 z-0">
                <div className="border-t border-slate-100 w-full"></div>
                <div className="border-t border-slate-100 w-full"></div>
                <div className="border-t border-slate-100 w-full"></div>
                <div className="border-t border-slate-100 w-full"></div>
                <div className="border-t-2 border-slate-200 w-full"></div>
             </div>
             
             {[
               { day: 'LUN', exp: 65, real: 55 },
               { day: 'MAR', exp: 75, real: 70 },
               { day: 'MIE', exp: 80, real: 0 },
               { day: 'JUE', exp: 70, real: 0 },
               { day: 'VIE', exp: 65, real: 60 }
             ].map((d) => (
               <div key={d.day} className="flex flex-col items-center gap-3 z-10 w-20 h-full justify-end">
                 <div className="flex items-end gap-1 w-full h-[220px]">
                   <div className="bg-slate-900 w-1/2 rounded-t-sm" style={{ height: `${d.exp}%` }}></div>
                   <div className="bg-slate-500 w-1/2 rounded-t-sm" style={{ height: `${d.real}%` }}></div>
                 </div>
                 <span className="text-[10px] font-bold tracking-wider text-slate-500">{d.day}</span>
               </div>
             ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
            <div className="border border-slate-200 rounded-lg p-5 bg-white shadow-sm">
              <h4 className="text-[11px] font-bold tracking-wider text-red-600 flex items-center gap-2 mb-5">
                <AlertCircle className="w-3.5 h-3.5" /> BLOQUEOS HSE (MOTIVOS)
              </h4>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-700 font-medium">Certificado Médico Vencido</span>
                    <span className="font-mono text-slate-600 font-medium text-xs"><span className="font-bold">18</span> casos</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden"><div className="bg-red-600 h-full w-[60%]"></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-700 font-medium">Inducción Expirada</span>
                    <span className="font-mono text-slate-600 font-medium text-xs"><span className="font-bold">12</span> casos</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden"><div className="bg-red-600 h-full w-[40%]"></div></div>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-5 bg-white shadow-sm">
              <h4 className="text-[11px] font-bold tracking-wider text-slate-600 flex items-center gap-2 mb-5">
                <AlertCircle className="w-3.5 h-3.5" /> FALTAS INJUSTIFICADAS
              </h4>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-700 font-medium">Sin notificación previa</span>
                    <span className="font-mono text-slate-600 font-medium text-xs"><span className="font-bold">8</span> casos</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden"><div className="bg-slate-600 h-full w-[70%]"></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-700 font-medium">Incidencia de Marcación</span>
                    <span className="font-mono text-slate-600 font-medium text-xs"><span className="font-bold">4</span> casos</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden"><div className="bg-slate-600 h-full w-[30%]"></div></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
