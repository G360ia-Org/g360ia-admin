import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import rubrosDb from "@/lib/rubros-db";

function guardAdmin(session) {
  return session?.user?.rol === "superadmin";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!guardAdmin(session)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const [rows] = await rubrosDb.query("SELECT * FROM rubros ORDER BY nombre");
  return NextResponse.json({ ok: true, rubros: rows });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!guardAdmin(session)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { nombre, descripcion } = await request.json();
  if (!nombre?.trim())
    return NextResponse.json({ ok: false, error: "El nombre es requerido" }, { status: 400 });

  const [result] = await rubrosDb.query(
    "INSERT INTO rubros (nombre, descripcion, activo) VALUES (?, ?, 1)",
    [nombre.trim(), descripcion?.trim() ?? ""]
  );
  return NextResponse.json({ ok: true, id: result.insertId });
}
