import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "DAILY";
  const date =
    searchParams.get("date") || new Date().toISOString().split("T")[0];
  const projectId = searchParams.get("project_id") || "all";

  // Respuesta basada exactamente en la especificación técnica
  return NextResponse.json({
    period: period,
    date: date,
    project_name: projectId === "barco_1" ? "Barco 1" : "Todos los Proyectos",
    summary: {
      total_expected: 45,
      total_present: 38,
      total_missing: 7,
      attendance_rate: "84.4%",
    },
    missing_details: [
      {
        worker_id: "1234567890",
        worker_name: "Andrés Felipe Gómez",
        company: "Metalprest",
        reason: "ARL Vencida (Bloqueo HSE)",
        hse_status: "NON_COMPLIANT",
      },
      {
        worker_id: "9876543210",
        worker_name: "Luis Fernando Ruiz",
        company: "Soldetech",
        reason: "Inasistencia No Registrada",
        hse_status: "COMPLIANT",
      },
    ],
  });
}
