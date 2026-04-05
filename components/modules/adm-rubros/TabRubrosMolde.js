"use client";

import { useState, useEffect } from "react";

const ICONOS = {
  crm:          "bi-people",
  mcp:          "bi-grid-1x2",
  "adm-rubros": "bi-building",
};

const PLAN_ORDER = ["free", "pro", "business", "ia"];
const PLAN_LABELS = { free: "Free", pro: "Pro", business: "Business", ia: "Plan IA" };

export default function TabRubrosMolde() {
  const [rubros,          setRubros]          = useState([]);
  const [modulos,         setModulos]         = useState([]);
  const [asignaciones,    setAsignaciones]    = useState([]);
  const [rubroSel,        setRubroSel]        = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [planTab,         setPlanTab]         = useState("free");

  // { modulo_nombre: { herramientas: [], planes: [] } }
  const [moduloData,      setModuloData]      = useState({});

  const [toggling,        setToggling]        = useState(null);
  const [saving,          setSaving]          = useState(null); // "plan_minimo:id" | "precio:id"
  const [savedId,         setSavedId]         = useState(null);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setLoading(true);
    try {
      const [rRes, mRes, aRes] = await Promise.all([
        fetch("/api/adm-rubros/rubros").then(r => r.json()),
        fetch("/api/adm-rubros/modulos").then(r => r.json()),
        fetch("/api/adm-rubros/rubros-modulos").then(r => r.json()),
      ]);
      const listaRubros  = rRes.ok ? rRes.rubros  : [];
      const listaModulos = mRes.ok ? mRes.modulos : [];
      setRubros(listaRubros);
      setModulos(listaModulos);
      if (aRes.ok) setAsignaciones(aRes.asignaciones);
      setRubroSel(prev => prev ?? (listaRubros[0]?.id ?? null));

      // cargar herramientas y planes para cada módulo en paralelo
      const entradas = await Promise.all(
        listaModulos.map(async m => {
          const [hRes, pRes] = await Promise.all([
            fetch(`/api/adm-rubros/herramientas?modulo=${m.nombre}`).then(r => r.json()),
            fetch(`/api/adm-rubros/modulos-planes?modulo=${m.nombre}`).then(r => r.json()),
          ]);
          return [m.nombre, {
            herramientas: hRes.ok ? hRes.herramientas : [],
            planes:       pRes.ok ? pRes.planes       : [],
          }];
        })
      );
      setModuloData(Object.fromEntries(entradas));
    } catch (e) {
      console.error("[TabRubrosMolde]", e);
    } finally {
      setLoading(false);
    }
  }

  const asignadasAlRubro   = asignaciones.filter(a => Number(a.rubro_id) === rubroSel);
  const modulosHabilitados = modulos.filter(m => asignadasAlRubro.find(a => Number(a.modulo_id) === m.id));

  async function toggleModulo(modulo) {
    const habilitado = !!asignadasAlRubro.find(a => Number(a.modulo_id) === modulo.id);
    setToggling(modulo.id);
    try {
      if (habilitado) {
        await fetch(`/api/adm-rubros/rubros-modulos?rubro_id=${rubroSel}&modulo_id=${modulo.id}`, { method: "DELETE" });
      } else {
        await fetch("/api/adm-rubros/rubros-modulos", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ rubro_id: rubroSel, modulo_id: modulo.id, plan_minimo: "free" }),
        });
      }
      const aRes = await fetch("/api/adm-rubros/rubros-modulos").then(r => r.json());
      if (aRes.ok) setAsignaciones(aRes.asignaciones);
    } catch (e) {
      console.error("[toggleModulo]", e);
    } finally {
      setToggling(null);
    }
  }

  async function actualizarPlanMinimo(herramientaId, plan_minimo, moduloNombre) {
    const key = `pm:${herramientaId}`;
    setSaving(key);
    try {
      await fetch("/api/adm-rubros/herramientas", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id: herramientaId, plan_minimo }),
      });
      // actualizar local
      setModuloData(prev => ({
        ...prev,
        [moduloNombre]: {
          ...prev[moduloNombre],
          herramientas: prev[moduloNombre].herramientas.map(h =>
            h.id === herramientaId ? { ...h, plan_minimo } : h
          ),
        },
      }));
      setSavedId(key);
      setTimeout(() => setSavedId(null), 1500);
    } catch (e) {
      console.error("[actualizarPlanMinimo]", e);
    } finally {
      setSaving(null);
    }
  }

  async function actualizarPrecio(planId, precio, moduloNombre) {
    const key = `pr:${planId}`;
    setSaving(key);
    try {
      await fetch("/api/adm-rubros/modulos-planes", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id: planId, precio: Number(precio) }),
      });
      setModuloData(prev => ({
        ...prev,
        [moduloNombre]: {
          ...prev[moduloNombre],
          planes: prev[moduloNombre].planes.map(p =>
            p.id === planId ? { ...p, precio } : p
          ),
        },
      }));
      setSavedId(key);
      setTimeout(() => setSavedId(null), 1500);
    } catch (e) {
      console.error("[actualizarPrecio]", e);
    } finally {
      setSaving(null);
    }
  }

  if (loading) return (
    <div className="ui-empty">
      <i className="bi bi-arrow-repeat ui-empty__icon" />
      <div className="ui-empty__text">Cargando asignaciones...</div>
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 20, alignItems: "start" }}>

      {/* ── columna izquierda ── */}
      <div className="ui-card">
        <div className="ui-card__header">
          <span className="ui-card__title">Rubros</span>
        </div>
        <div className="ui-card__body" style={{ padding: 0 }}>
          {rubros.length === 0 ? (
            <div style={{ padding: "12px 16px" }} className="mod-sub">
              Sin rubros. Creá uno en la pestaña Rubros.
            </div>
          ) : rubros.map(r => (
            <div
              key={r.id}
              onClick={() => setRubroSel(r.id)}
              style={{
                padding:    "10px 16px",
                cursor:     "pointer",
                borderLeft: rubroSel === r.id ? "3px solid var(--pr)" : "3px solid transparent",
                background: rubroSel === r.id ? "var(--bg-hover)" : "transparent",
                fontWeight: rubroSel === r.id ? 600 : 400,
                fontSize:   14,
                color:      "var(--text)",
                transition: "all 0.12s",
                userSelect: "none",
              }}
            >
              {r.nombre}
            </div>
          ))}
        </div>
      </div>

      {/* ── columna derecha ── */}
      {rubroSel ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* sección 1: módulos habilitados */}
          <div className="ui-card">
            <div className="ui-card__header">
              <span className="ui-card__title">
                Módulos habilitados para <strong>{rubros.find(r => r.id === rubroSel)?.nombre}</strong>
              </span>
            </div>
            <div className="ui-card__body" style={{ padding: 0 }}>
              {modulos.length === 0 ? (
                <div style={{ padding: "12px 16px" }} className="mod-sub">Sin módulos en el sistema.</div>
              ) : modulos.map((m, idx) => {
                const habilitado = !!asignadasAlRubro.find(a => Number(a.modulo_id) === m.id);
                const icon       = ICONOS[m.nombre] ?? ICONOS[m.slug] ?? "bi-box-seam";
                const isLast     = idx === modulos.length - 1;
                return (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: isLast ? "none" : "1px solid var(--border)" }}>
                    <i className={`bi ${icon}`} style={{ fontSize: 18, color: "var(--pr)", width: 22, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>{m.nombre ?? m.slug}</div>
                      {m.descripcion && (
                        <div className="mod-sub" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 300 }}>
                          {m.descripcion}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => toggleModulo(m)}
                      disabled={toggling === m.id}
                      style={{
                        width: 42, height: 22, borderRadius: 11, border: "none",
                        cursor: toggling === m.id ? "wait" : "pointer",
                        background: habilitado ? "var(--pr)" : "var(--border)",
                        transition: "background 0.2s", position: "relative", flexShrink: 0,
                        opacity: toggling === m.id ? 0.6 : 1,
                      }}
                    >
                      <span style={{
                        position: "absolute", top: 3, left: habilitado ? 21 : 3,
                        width: 16, height: 16, borderRadius: "50%",
                        background: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                      }} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* sección 2: planes y precios */}
          {modulosHabilitados.length === 0 ? (
            <div className="ui-card">
              <div className="ui-card__body">
                <div className="ui-empty" style={{ padding: "8px 0" }}>
                  <i className="bi bi-toggles ui-empty__icon" style={{ fontSize: 28 }} />
                  <div className="ui-empty__text">Sin módulos habilitados</div>
                  <div className="ui-empty__sub">Habilitá módulos arriba para configurar sus planes.</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="ui-card">
              <div className="ui-card__header">
                <span className="ui-card__title">Planes y herramientas</span>
              </div>
              <div className="ui-card__body">

                {/* pill tabs */}
                <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
                  {PLAN_ORDER.map(p => (
                    <button
                      key={p}
                      onClick={() => setPlanTab(p)}
                      style={{
                        padding: "5px 14px", borderRadius: 20,
                        border: `1px solid ${planTab === p ? "var(--pr)" : "var(--border)"}`,
                        background: planTab === p ? "var(--pr)" : "transparent",
                        color: planTab === p ? "#fff" : "var(--sub)",
                        cursor: "pointer", fontSize: 13,
                        fontWeight: planTab === p ? 600 : 400, transition: "all 0.15s",
                      }}
                    >
                      {PLAN_LABELS[p]}
                    </button>
                  ))}
                </div>

                {/* módulos habilitados con precio y herramientas del plan */}
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  {modulosHabilitados.map(m => {
                    const data       = moduloData[m.nombre] ?? { herramientas: [], planes: [] };
                    const planActual = data.planes.find(p => p.plan === planTab);
                    const herramientasDelPlan = data.herramientas.filter(h => h.plan_minimo === planTab);

                    return (
                      <div key={m.id}>
                        {/* nombre módulo + precio */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>
                            {m.nombre}
                          </div>
                          {planActual && (
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span className="mod-sub">USD/mes</span>
                              <input
                                type="number"
                                min="0"
                                className="ui-input"
                                style={{ width: 90, textAlign: "right" }}
                                value={planActual.precio}
                                onChange={e => setModuloData(prev => ({
                                  ...prev,
                                  [m.nombre]: {
                                    ...prev[m.nombre],
                                    planes: prev[m.nombre].planes.map(p =>
                                      p.id === planActual.id ? { ...p, precio: e.target.value } : p
                                    ),
                                  },
                                }))}
                                onBlur={e => actualizarPrecio(planActual.id, e.target.value, m.nombre)}
                              />
                              {savedId === `pr:${planActual.id}` && (
                                <i className="bi bi-check-lg" style={{ color: "var(--pr)", fontSize: 14 }} />
                              )}
                            </div>
                          )}
                        </div>

                        {/* herramientas del plan */}
                        {data.herramientas.length === 0 ? (
                          <div className="mod-sub">Sin herramientas registradas.</div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {data.herramientas.map(h => {
                              const key = `pm:${h.id}`;
                              return (
                                <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{h.nombre}</div>
                                    {h.descripcion && <div className="mod-sub">{h.descripcion}</div>}
                                  </div>
                                  <select
                                    className="ui-select"
                                    style={{ width: 110, fontSize: 12 }}
                                    value={h.plan_minimo}
                                    onChange={e => actualizarPlanMinimo(h.id, e.target.value, m.nombre)}
                                    disabled={saving === key}
                                  >
                                    {PLAN_ORDER.map(p => (
                                      <option key={p} value={p}>{PLAN_LABELS[p]}</option>
                                    ))}
                                  </select>
                                  {savedId === key && (
                                    <i className="bi bi-check-lg" style={{ color: "var(--pr)", fontSize: 14 }} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="ui-empty">
          <i className="bi bi-building ui-empty__icon" />
          <div className="ui-empty__text">Seleccioná un rubro</div>
        </div>
      )}

    </div>
  );
}
