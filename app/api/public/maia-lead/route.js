// app/api/public/maia-lead/route.js
// Endpoint público — recibe pedidos anticipados desde la landing de MaiA
// y los guarda como leads en el CRM con fuente "maia_landing".
//
// Requiere en .env: MAIA_TENANT_ID=<id del tenant g360ia para leads propios>
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import modulosDb from "@/lib/modulos-db";

const TENANT_ID = parseInt(process.env.MAIA_TENANT_ID || "1", 10);

const CORS = {
  "Access-Control-Allow-Origin": "https://g360ia.com.ar",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(req) {
  try {
    const {
      rubro, telefono, email, localidad, pais,
      web, redes, tipo_negocio, problema, meta,
    } = await req.json();

    // Validación mínima
    if (!email || !telefono || !rubro || !localidad) {
      return NextResponse.json(
        { ok: false, error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    // Armar notas con el contexto completo del formulario
    const extras = [];
    if (localidad) extras.push(`Localidad: ${localidad}`);
    if (pais)      extras.push(`País: ${pais}`);
    if (web)       extras.push(`Web: ${web}`);
    if (redes)     extras.push(`Redes: ${redes}`);
    if (tipo_negocio) extras.push(`Tipo de negocio: ${tipo_negocio}`);
    if (problema)     extras.push(`Preocupación: ${problema}`);
    if (meta)         extras.push(`Meta: ${meta}`);
    const notas = extras.join(" | ");

    await modulosDb.query(
      `INSERT INTO crm_leads
        (tenant_id, nombre, empresa, email, telefono, fuente, notas_ia, estado)
       VALUES (?, ?, ?, ?, ?, 'maia_landing', ?, 'nuevo')`,
      [TENANT_ID, email, rubro, email, telefono, notas || null]
    );

    return NextResponse.json({ ok: true }, { headers: CORS });
  } catch (err) {
    console.error("public/maia-lead POST:", err);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500, headers: CORS });
  }
}
