"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Lock, Mail, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setIsLoading(false);

    if (error) {
      setErrorMsg("Credenciales inválidas. Verifica tu correo y contraseña.");
      return;
    }

    if (data.user) {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="absolute top-8 left-8 flex items-center gap-2">
        <div className="w-10 h-10 bg-black text-white rounded-md flex items-center justify-center">
          <span className="text-lg font-black">SH</span>
        </div>
        <span className="text-2xl font-bold text-slate-900">SafeGuard HSE</span>
      </div>

      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
          <CardDescription className="text-slate-500">
            Ingresa tus credenciales para acceder al sistema de gestión HSE.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@astillero.com"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Contraseña</Label>
                <a
                  href="#"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm font-medium">
                {errorMsg}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white mt-6 h-11"
              disabled={isLoading}
            >
              {isLoading ? "Verificando..." : "Acceder al Dashboard"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 text-center border-t border-slate-100 pt-6 mt-2">
          <p className="text-xs text-slate-500">
            Al iniciar sesión, aceptas nuestras{" "}
            <a href="#" className="underline">
              Políticas de Privacidad
            </a>{" "}
            y{" "}
            <a href="#" className="underline">
              Términos de Servicio
            </a>
            .
          </p>
          <p className="text-xs text-slate-400 font-mono">
            v3.0.0 (Astivik Build)
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
