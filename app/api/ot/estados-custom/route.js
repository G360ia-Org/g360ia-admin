// app/api/ot/estados-custom/route.js
// Stub — herramienta no activada aún. Reservado para configuración de estados personalizados.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, estados: [], activado: false });
}

export async function POST() {
  return NextResponse.json(
    { ok: false, error: "Esta herramienta no está activada para este tenant." },
    { status: 403 }
  );
}
