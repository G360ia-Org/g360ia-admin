export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import db from "../../../../lib/db";

// GET — listar leads (superadmin ve todos, vendedor ve los suyos)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const rol = searchParams.get("rol");
    const usuario_id = searchParams.get("usuario_id");
    const estado = searchParams.get("estado");

    let query = `
      SELECT 
        vl.*,
        u.nombre as vendedor_nombre,
        u.email as vendedor_email
      FROM ventas_leads vl
      LEFT JOIN usuarios u ON u.id = vl.asignado_a
    `;

    const condiciones = [];
    const valores = [];

    if (rol === "vendedor" && usuario_id) {
      condiciones.push("vl.asignado_a = ?");
      valores.push(usuario_id);
    }

    if (estado) {
      condiciones.push("vl.estado = ?");
      valores.push(estado);
    }

    if (condiciones.length > 0) {
      query += " WHERE " + condiciones.join(" AND ");
    }

    query += " ORDER BY vl.creado_en DESC";

    const [rows] = await db.query(query, valores);
    return NextResponse.json({ ok: true, leads: rows });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// POST — crear nuevo lead
export async function POST(req) {
  try {
    const {
      nombre, empresa, email, telefono,
      rubro_interes, plan_interes, fuente,
      asignado_a, valor_mrr_estimado, notas
    } = await req.json();

    if (!nombre) {
      return NextResponse.json({ ok: false, error: "Nombre es obligatorio" }, { status: 400 });
    }

    const [result] = await db.query(
      `INSERT INTO ventas_leads 
       (nombre, empresa, email, telefono, rubro_interes, plan_interes, fuente, asignado_a, valor_mrr_estimado, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        empresa || null,
        email || null,
        telefono || null,
        rubro_interes || null,
        plan_interes || null,
        fuente || "web",
        asignado_a || null,
        valor_mrr_estimado || null,
        notas || null,
      ]
    );

    return NextResponse.json({ ok: true, id: result.insertId });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// PATCH — actualizar lead
export async function PATCH(req) {
  try {
    const {
      id, nombre, empresa, email, telefono,
      rubro_interes, plan_interes, fuente, estado,
      asignado_a, valor_mrr_estimado, notas
    } = await req.json();

    if (!id) {
      return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });
    }

    const campos = [];
    const valores = [];

    if (nombre !== undefined)            { campos.push("nombre = ?");              valores.push(nombre); }
    if (empresa !== undefined)           { campos.push("empresa = ?");             valores.push(empresa); }
    if (email !== undefined)             { campos.push("email = ?");               valores.push(email); }
    if (telefono !== undefined)          { campos.push("telefono = ?");            valores.push(telefono); }
    if (rubro_interes !== undefined)     { campos.push("rubro_interes = ?");       valores.push(rubro_interes); }
    if (plan_interes !== undefined)      { campos.push("plan_interes = ?");        valores.push(plan_interes); }
    if (fuente !== undefined)            { campos.push("fuente = ?");              valores.push(fuente); }
    if (estado !== undefined)            { campos.push("estado = ?");              valores.push(estado); }
    if (asignado_a !== undefined)        { campos.push("asignado_a = ?");          valores.push(asignado_a); }
    if (valor_mrr_estimado !== undefined){ campos.push("valor_mrr_estimado = ?");  valores.push(valor_mrr_estimado); }
    if (notas !== undefined)             { campos.push("notas = ?");               valores.push(notas); }

    if (campos.length === 0) {
      return NextResponse.json({ ok: false, error: "Nada que actualizar" }, { status: 400 });
    }

    valores.push(id);
    await db.query(`UPDATE ventas_leads SET ${campos.join(", ")} WHERE id = ?`, valores);

    // Si se cierra el lead → crear tenant automáticamente
    if (estado === "cerrado") {
      const [[lead]] = await db.query("SELECT * FROM ventas_leads WHERE id = ?", [id]);
      if (lead && lead.email) {
        const [existe] = await db.query("SELECT id FROM tenants WHERE email = ?", [lead.email]);
        if (existe.length === 0) {
          await db.query(
            `INSERT INTO tenants (nombre, rubro, plan, email, telefono, activo, onboarding_completo)
             VALUES (?, ?, ?, ?, ?, 1, 0)`,
            [
              lead.empresa || lead.nombre,
              lead.rubro_interes || "otro",
              lead.plan_interes || "starter",
              lead.email,
              lead.telefono || null,
            ]
          );
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// DELETE — eliminar lead
export async function DELETE(req) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "Falta id" }, { status: 400 });
    await db.query("DELETE FROM ventas_leads WHERE id = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
