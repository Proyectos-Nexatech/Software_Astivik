"use client";

import { useState, useEffect } from "react";
import { UserCircle, LogOut, Mail, Building2, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";

export function TopNav() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: pData } = await supabase.from('perfiles_usuario').select('*, contratistas!perfiles_usuario_contratista_id_fkey(nombre)').eq('id', user.id).single();
        if (pData) {
          setProfile(pData);
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const roleLabels: Record<string, string> = {
    "lider_hse": "Líder HSE",
    "lider_contratista": "Líder Contratista",
    "gerencia": "Gerencia",
    "guardia": "Guardia de Seguridad"
  };

  if (loading) {
    return (
      <div className="h-20 border-b border-slate-200 bg-slate-100/70 flex items-center justify-end px-6 shrink-0">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="h-20 border-b border-slate-200 bg-slate-100/70 flex items-center justify-end px-6 shrink-0 z-10">
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-3 hover:bg-slate-50 p-2 rounded-lg transition-colors border border-transparent hover:border-slate-200">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold text-slate-900 leading-none">
              {profile ? roleLabels[profile.rol] || profile.rol : "Usuario"}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {profile?.contratistas?.nombre || "Astivik S.A."}
            </div>
          </div>
          <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white shrink-0">
            <UserCircle className="w-6 h-6" />
          </div>
        </button>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Perfil de Usuario</DialogTitle>
            <DialogDescription>
              Información de tu sesión actual y permisos.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <Mail className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500 font-medium">Correo Electrónico</p>
                <p className="text-sm font-bold text-slate-900">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <ShieldCheck className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500 font-medium">Rol en el Sistema</p>
                <p className="text-sm font-bold text-slate-900">{profile ? roleLabels[profile.rol] || profile.rol : "Sin Rol Asignado"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <Building2 className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500 font-medium">Empresa / Contratista</p>
                <p className="text-sm font-bold text-slate-900">{profile?.contratistas?.nombre || "Astivik S.A. (Principal)"}</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button variant="destructive" onClick={handleLogout} className="w-full sm:w-auto font-semibold">
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
