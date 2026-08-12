"use server";

import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key");

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy-key",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function notificarHseDocumentoSubido(
  contratistaNombre: string, 
  trabajadorNombre: string, 
  tipoDocumento: string
) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[SIMULACIÓN EMAIL] 📧 Correo a HSE: El contratista ${contratistaNombre} ha subido el documento [${tipoDocumento.toUpperCase()}] para ${trabajadorNombre}. Pendiente de revisión.`);
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: 'Sistema HSE <notificaciones@nexatech.com.co>',
      to: ['proyectos@nexatech.com.co'], // Idealmente configurable o extraído de la BD
      subject: `NUEVO DOCUMENTO - Revisión Pendiente (${contratistaNombre})`,
      html: `
        <h2>Nuevo Documento HSE Subido</h2>
        <p>El contratista <strong>${contratistaNombre}</strong> ha cargado un nuevo documento.</p>
        <ul>
          <li><strong>Trabajador:</strong> ${trabajadorNombre}</li>
          <li><strong>Documento:</strong> ${tipoDocumento.toUpperCase()}</li>
        </ul>
        <p>Por favor, ingrese a la plataforma para revisarlo y aprobarlo.</p>
      `,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Error enviando email a HSE:", error);
    return { success: false, error };
  }
}

export async function notificarContratistaDocumentoAprobado(
  contratistaNombre: string,
  trabajadorNombre: string,
  tipoDocumento: string
) {
  let emailContratista = "proyectos@nexatech.com.co"; // Default fallback

  try {
    // 1. Encontrar el contratista por nombre
    const { data: contratistas } = await supabaseAdmin
      .from("contratistas")
      .select("id")
      .ilike("nombre", `%${contratistaNombre.split(' ')[0]}%`)
      .limit(1);

    if (contratistas && contratistas.length > 0) {
      const contratistaId = contratistas[0].id;

      // 2. Encontrar el perfil_usuario que sea lider_contratista de esta empresa
      const { data: perfiles } = await supabaseAdmin
        .from("perfiles_usuario")
        .select("id")
        .eq("rol", "lider_contratista")
        .eq("contratista_id", contratistaId)
        .limit(1);

      if (perfiles && perfiles.length > 0) {
        // 3. Buscar el email en Auth admin
        const authUserId = perfiles[0].id;
        const { data: authData } = await supabaseAdmin.auth.admin.getUserById(authUserId);
        
        if (authData?.user?.email) {
          emailContratista = authData.user.email;
        }
      }
    }
  } catch (err) {
    console.error("Error buscando el correo del contratista:", err);
  }

  if (!process.env.RESEND_API_KEY) {
    console.log(`[SIMULACIÓN EMAIL] 📧 Correo a ${emailContratista}: Su documento [${tipoDocumento.toUpperCase()}] para ${trabajadorNombre} ha sido APROBADO por Astivik.`);
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: 'Sistema HSE <notificaciones@nexatech.com.co>',
      to: [emailContratista],
      subject: `DOCUMENTO APROBADO - ${trabajadorNombre}`,
      html: `
        <h2>Documento HSE Aprobado</h2>
        <p>Estimado contratista,</p>
        <p>El siguiente documento ha sido revisado y <strong>aprobado</strong> por el equipo de HSE de Astivik:</p>
        <ul>
          <li><strong>Trabajador:</strong> ${trabajadorNombre}</li>
          <li><strong>Documento:</strong> ${tipoDocumento.toUpperCase()}</li>
        </ul>
        <p>Este trabajador está ahora más cerca de ser autorizado para ingresar a planta.</p>
      `,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Error enviando email al Contratista:", error);
    return { success: false, error };
  }
}
