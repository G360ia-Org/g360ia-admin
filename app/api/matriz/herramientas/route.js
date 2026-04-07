import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import modDb from "@/lib/modulos-db";

function guardAdmin(session) {
  return session?.user?.rol === "superadmin";
}

// GET /api/adm-rubros/herramientas?modulo=crm
export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!guardAdmin(session)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const modulo = searchParams.get("modulo");
  if (!modulo) return NextResponse.json({ ok: false, error: "Falta modulo" }, { status: 400 });

  const [rows] = await modDb.query(
    "SELECT id, slug, nombre, descripcion, plan_minimo, activo FROM modulos_herramientas WHERE modulo = ? ORDER BY id",
    [modulo]
  );
  return NextResponse.json({ ok: true, herramientas: rows });
}

// PUT /api/adm-rubros/herramientas
// body: { id, plan_minimo }
export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!guardAdmin(session)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { id, plan_minimo } = await request.json();
  if (!id || !plan_minimo) return NextResponse.json({ ok: false, error: "Faltan campos" }, { status: 400 });

  await modDb.query(
    "UPDATE modulos_herramientas SET plan_minimo = ? WHERE id = ?",
    [plan_minimo, id]
  );
  return NextResponse.json({ ok: true });
}
