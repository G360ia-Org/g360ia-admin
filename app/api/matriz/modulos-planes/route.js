import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import modDb from "@/lib/modulos-db";

function guardAdmin(session) {
  return session?.user?.rol === "superadmin";
}

// GET /api/adm-rubros/modulos-planes?modulo=crm
export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!guardAdmin(session)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const modulo = searchParams.get("modulo");
  if (!modulo) return NextResponse.json({ ok: false, error: "Falta modulo" }, { status: 400 });

  const [rows] = await modDb.query(
    "SELECT id, plan, precio, activo FROM modulos_planes WHERE modulo = ? ORDER BY id",
    [modulo]
  );
  return NextResponse.json({ ok: true, planes: rows });
}

// PUT /api/adm-rubros/modulos-planes
// body: { id, precio }
export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!guardAdmin(session)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { id, precio } = await request.json();
  if (id === undefined || precio === undefined)
    return NextResponse.json({ ok: false, error: "Faltan campos" }, { status: 400 });

  await modDb.query(
    "UPDATE modulos_planes SET precio = ? WHERE id = ?",
    [precio, id]
  );
  return NextResponse.json({ ok: true });
}
