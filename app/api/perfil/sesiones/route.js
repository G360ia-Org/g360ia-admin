export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import db from "../../../../lib/db";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }

    const [userRows] = await db.query(
      "SELECT id FROM usuarios WHERE email = ?",
      [session.user.email]
    );

    if (userRows.length === 0) {
      return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    const userId = userRows[0].id;

    const [sesiones] = await db.query(
      `SELECT id, ip, dispositivo, ubicacion, creado_en
       FROM sesiones_log
       WHERE usuario_id = ?
       ORDER BY creado_en DESC
       LIMIT 20`,
      [userId]
    );

    return NextResponse.json({ ok: true, sesiones });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
