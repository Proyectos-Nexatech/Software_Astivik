"use server";

import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY || process.env.resend_api_key;
const resend = new Resend(apiKey || "re_dummy_key");

export async function notificarHseDocumentoSubido(
  contratistaNombre: string,
  trabajadorNombre: string,
  tipoDocumento: string,
) {
  if (!apiKey) {
    console.log(
      `[SIMULACIÓN EMAIL] 📧 Correo a HSE: El contratista ${contratistaNombre} ha subido el documento [${tipoDocumento.toUpperCase()}] para ${trabajadorNombre}. Pendiente de revisión.`,
    );
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: "Sistema HSE <notificaciones@nexatech.com.co>",
      to: ["proyectos@nexatech.com.co"], // Idealmente configurable o extraído de la BD
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
  emailContratista: string,
  trabajadorNombre: string,
  tipoDocumento: string,
) {
  if (!apiKey) {
    console.log(
      `[SIMULACIÓN EMAIL] 📧 Correo a ${emailContratista}: Su documento [${tipoDocumento.toUpperCase()}] para ${trabajadorNombre} ha sido APROBADO por Astivik.`,
    );
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: "Sistema HSE <notificaciones@nexatech.com.co>",
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
