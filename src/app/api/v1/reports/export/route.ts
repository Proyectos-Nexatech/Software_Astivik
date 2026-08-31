import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function GET() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SafeGuard HSE - Astivik";
  workbook.lastModifiedBy = "Sistema Automatizado";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Reporte Faltantes");

  // Definir columnas
  worksheet.columns = [
    { header: "ID Trabajador", key: "worker_id", width: 15 },
    { header: "Nombre", key: "worker_name", width: 30 },
    { header: "Empresa", key: "company", width: 25 },
    { header: "Motivo / Razón", key: "reason", width: 35 },
    { header: "Estado HSE", key: "hse_status", width: 20 },
  ];

  // Estilo de la cabecera (Negrita y fondo gris)
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E293B" }, // Slate 800
  };

  // Agregar datos mock
  const data = [
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
  ];

  data.forEach((item) => {
    const row = worksheet.addRow(item);

    // Aplicar colores de semáforo a la columna hse_status
    const statusCell = row.getCell("hse_status");
    if (item.hse_status === "NON_COMPLIANT") {
      statusCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFCA5A5" },
      }; // Rojo claro
      statusCell.font = { color: { argb: "FF991B1B" }, bold: true };
    } else {
      statusCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF86EFAC" },
      }; // Verde claro
      statusCell.font = { color: { argb: "FF166534" }, bold: true };
    }
  });

  // Generar el buffer del archivo Excel
  const buffer = await workbook.xlsx.writeBuffer();

  // Devolver como archivo descargable
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="Reporte_Faltantes_HSE.xlsx"',
    },
  });
}
