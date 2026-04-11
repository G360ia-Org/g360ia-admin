"use client";

import { useState, useEffect } from "react";

const PLAN_ORDER  = ["free", "pro", "business", "ia"];
const PLAN_LABELS = { free: "Free", pro: "Pro", business: "Business", ia: "Plan IA" };
const PLAN_COLORS = { free: "#64748b", pro: "#3b82f6", business: "#8b5cf6", ia: "#f59e0b" };

export default function TabPlanes() {
  const [modulos,      setModulos]      = useState([]);
  const [seleccionado, setSeleccionado] = useState(null); // modulo.nombre
  const [herramientas, setHerramientas] = useState([]);
  const [planes,       setPlanes]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [loadingDet,   setLoadingDet]   = useState(false);
  const [savingCell,   setSavingCell]   = useState(null);
  const [savedCell,    setSavedCell]    = useState(null);

  useEffect(() => {
    fetch("/api/matriz/modulos")
      .then(r => r.json())
      .then(d => {
        if (d.ok && d.modulos.length > 0) {
          setModulos(d.modulos);
          setSeleccionado(d.modulos[0].nombre);
        }
      })
      .catch(e => console.error("[TabPlanes]", e))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!seleccionado) return;
    setLoadingDet(true);
    Promise.all([
      fetch(`/api/matriz/herramientas?modulo=${encodeURIComponent(seleccionado)}`).then(r => r.json()),
      fetch(`/api/matriz/modulos-planes?modulo=${encodeURIComponent(seleccionado)}`).then(r => r.json()),
    ]).then(([hRes, pRes]) => {
      setHerramientas(hRes.ok ? hRes.herramientas : []);
      setPlanes(pRes.ok ? pRes.planes : []);
    }).catch(e => console.error("[TabPlanes detalle]", e))
      .finally(() => setLoadingDet(false));
  }, [seleccionado]);

  async function handlePlanMinimo(herramienta, plan) {
    const currentIdx = PLAN_ORDER.indexOf(herramienta.plan_minimo);
    const clickedIdx = PLAN_ORDER.indexOf(plan);
    let nuevoPlan;
    if (clickedIdx === currentIdx) {
      nuevoPlan = PLAN_ORDER[currentIdx + 1] ?? herramienta.plan_minimo;
    } else if (clickedIdx < currentIdx) {
      nuevoPlan = plan;
    } else {
      return;
    }
    if (nuevoPlan === herramienta.plan_minimo) return;

    const cellKey = `${herramienta.id}-${plan}`;
    setSavingCell(cellKey);
    try {
      await fetch("/api/matriz/herramientas", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id: herramienta.id, plan_minimo: nuevoPlan }),
      });
      setHerramientas(prev => prev.map(h => h.id === herramienta.id ? { ...h, plan_minimo: nuevoPlan } : h));
      setSavedCell(cellKey);
      setTimeout(() => setSavedCell(null), 1000);
    } catch (e) {
      console.error("[handlePlanMinimo]", e);
    } finally {
      setSavingCell(null);
    }
  }

  async function actualizarPrecio(planId, precio) {
    try {
      await fetch("/api/matriz/modulos-planes", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id: planId, precio: Number(precio) }),
      });
      setPlanes(prev => prev.map(p => p.id === planId ? { ...p, precio } : p));
    } catch (e) {
      console.error("[actualizarPrecio]", e);
    }
  }

  if (loading) return (
    <div className="ui-empty">
      <i className="bi bi-arrow-repeat ui-empty__icon" />
      <div className="ui-empty__text">Cargando módulos...</div>
    </div>
  );

  if (modulos.length === 0) return (
    <div className="ui-empty">
      <i className="bi bi-credit-card ui-empty__icon" />
      <div className="ui-empty__text">Sin módulos registrados</div>
      <div className="ui-empty__sub">Registrá módulos para configurar planes.</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Selector de módulo */}
      <div className="ui-card">
        <div className="ui-card__body" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <label className="ui-label" style={{ margin: 0, whiteSpace: "nowrap" }}>Módulo</label>
          <select
            className="ui-input"
            style={{ maxWidth: 280 }}
            value={seleccionado ?? ""}
            onChange={e => setSeleccionado(e.target.value)}
          >
            {modulos.map(m => (
              <option key={m.id} value={m.nombre}>{m.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla herramientas × planes */}
      {loadingDet ? (
        <div className="ui-empty">
          <i className="bi bi-arrow-repeat ui-empty__icon" />
          <div className="ui-empty__text">Cargando planes...</div>
        </div>
      ) : (
        <div className="ui-card" style={{ overflow: "hidden", borderTop: `3px solid ${PLAN_COLORS.pro}` }}>
          <div className="ui-card__header">
            <span className="ui-card__title">Herramientas y planes — {seleccionado}</span>
            <span className="mod-sub">Click en el plan mínimo para ajustarlo</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ padding: "14px 16px", textAlign: "left", borderBottom: "1px solid var(--border)", background: "var(--bg-soft)", width: "40%", fontSize: 11, color: "var(--sub)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                    Herramienta
                  </th>
                  {PLAN_ORDER.map(plan => {
                    const planRow = planes.find(p => p.plan === plan);
                    return (
                      <th key={plan} style={{ padding: "12px 16px", textAlign: "center", borderBottom: "1px solid var(--border)", borderLeft: "1px solid var(--border)", background: "var(--bg-soft)", minWidth: 120 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: PLAN_COLORS[plan], marginBottom: 6 }}>
                          {PLAN_LABELS[plan]}
                        </div>
                        {planRow ? (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                            <span style={{ fontSize: 11, color: "var(--sub)" }}>$</span>
                            <input
                              type="number" min="0"
                              style={{ width: 64, border: "none", borderBottom: "1px solid var(--border)", background: "transparent", textAlign: "center", fontSize: 14, fontWeight: 700, color: "var(--text)", outline: "none", padding: "2px 0" }}
                              value={planRow.precio}
                              onChange={e => setPlanes(prev => prev.map(p => p.id === planRow.id ? { ...p, precio: e.target.value } : p))}
                              onBlur={e => actualizarPrecio(planRow.id, e.target.value)}
                            />
                            <span style={{ fontSize: 11, color: "var(--sub)" }}>/mes</span>
                          </div>
                        ) : <span className="mod-sub">—</span>}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {herramientas.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 24, textAlign: "center" }} className="mod-sub">
                      Sin herramientas registradas para este módulo.
                    </td>
                  </tr>
                ) : herramientas.map((h, idx) => {
                  const minIdx = PLAN_ORDER.indexOf(h.plan_minimo);
                  const isLast = idx === herramientas.length - 1;
                  return (
                    <tr key={h.id} style={{ background: idx % 2 === 0 ? "transparent" : "var(--bg-soft)" }}>
                      <td style={{ padding: "12px 16px", borderBottom: isLast ? "none" : "1px solid var(--border)" }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)" }}>{h.nombre}</div>
                        {h.descripcion && <div className="mod-sub">{h.descripcion}</div>}
                      </td>
                      {PLAN_ORDER.map((plan, pIdx) => {
                        const included  = pIdx >= minIdx;
                        const isMinPlan = pIdx === minIdx;
                        const cellKey   = `${h.id}-${plan}`;
                        const isSaving  = savingCell === cellKey;
                        const isSaved   = savedCell  === cellKey;
                        return (
                          <td
                            key={plan}
                            style={{ textAlign: "center", padding: "12px 16px", borderBottom: isLast ? "none" : "1px solid var(--border)", borderLeft: "1px solid var(--border)", cursor: pIdx <= minIdx ? "pointer" : "default" }}
                            onClick={() => handlePlanMinimo(h, plan)}
                            title={pIdx < minIdx ? `Mover a ${PLAN_LABELS[plan]}` : isMinPlan ? "Subir un nivel" : `Incluido (${PLAN_LABELS[h.plan_minimo]}+)`}
                          >
                            {isSaving ? (
                              <i className="bi bi-arrow-repeat" style={{ fontSize: 14, color: "var(--sub)" }} />
                            ) : isSaved ? (
                              <i className="bi bi-check-lg" style={{ fontSize: 16, color: PLAN_COLORS[plan] }} />
                            ) : included ? (
                              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: "50%", background: isMinPlan ? PLAN_COLORS[plan] : `${PLAN_COLORS[plan]}22`, color: isMinPlan ? "#fff" : PLAN_COLORS[plan] }}>
                                <i className="bi bi-check" style={{ fontSize: 13 }} />
                              </span>
                            ) : (
                              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: "50%", border: "1.5px dashed var(--border)", color: "var(--border)" }}>
                                <i className="bi bi-dash" style={{ fontSize: 13 }} />
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
