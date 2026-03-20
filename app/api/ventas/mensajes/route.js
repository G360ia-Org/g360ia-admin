import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import db from "@/lib/db";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const conversacion_id = searchParams.get("conversacion_id");

  if (!conversacion_id) return NextResponse.json({ error: "Falta conversacion_id" }, { status: 400 });

  try {
    const [rows] = await db.query(
      `SELECT vm.*, u.nombre AS enviado_por_nombre
       FROM ventas_mensajes vm
       LEFT JOIN usuarios u ON vm.enviado_por = u.id
       WHERE vm.conversacion_id = ?
       ORDER BY vm.creado_en ASC`,
      [conversacion_id]
    );

    // Marcar como leídos
    await db.query(
      `UPDATE ventas_mensajes SET leido = 1 
       WHERE conversacion_id = ? AND direccion = 'entrante' AND leido = 0`,
      [conversacion_id]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
return NextResponse.json({ ok: true, mensajes: rows });  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const { conversacion_id, direccion, contenido } = body;
    const enviado_por = direccion === "saliente" ? session.user.id : null;

    const [result] = await db.query(
      `INSERT INTO ventas_mensajes (conversacion_id, direccion, contenido, enviado_por)
       VALUES (?, ?, ?, ?)`,
      [conversacion_id, direccion, contenido, enviado_por]
    );

    // Actualizar ultimo_mensaje en la conversación
    await db.query(
      `UPDATE ventas_conversaciones 
       SET ultimo_mensaje = ?, ultimo_mensaje_at = NOW(), estado = 'en_curso'
       WHERE id = ?`,
      [contenido.substring(0, 200), conversacion_id]
    );

    return NextResponse.json({ id: result.insertId, ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al enviar mensaje" }, { status: 500 });
  }
}
