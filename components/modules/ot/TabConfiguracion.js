"use client";

import { useState, useEffect } from "react";

export default function TabConfiguracion() {
  const [config,  setConfig]  = useState(null);
  const [prefijo, setPrefijo] = useState("OT-");
  const [modo,    setModo]    = useState("correlativo");
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState("");

  useEffect(() => {
    fetch("/api/ot/config")
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          setConfig(d.config);
          setPrefijo(d.config.prefijo        ?? "OT-");
          setModo(d.config.modo_numeracion   ?? "correlativo");
        }
      });
  }, []);

  async function guardar() {
    setSaving(true); setMsg("");
    try {
      const res  = await fetch("/api/ot/config", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ modo_numeracion: modo, prefijo }),
      });
      const data = await res.json();
      setMsg(data.ok ? "Configuración guardada ✓" : (data.error || "Error al guardar"));
    } finally { setSaving(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 560 }}>

      {/* Numeración */}
      <div className="ui-card">
        <div className="ui-card__header">
          <div className="ui-card__title">
            <i className="bi bi-hash" style={{ marginRight: 6 }} />Numeración de órdenes
          </div>
        </div>
        <div className="ui-card__body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          <div className="ui-field">
            <label className="ui-label">Modo de numeración</label>
            <select className="ui-select" value={modo} onChange={e => setModo(e.target.value)}>
              <option value="correlativo">Correlativo automático</option>
              <option value="manual">Manual (el operador ingresa el número)</option>
            </select>
          </div>

          <div className="ui-field">
            <label className="ui-label">Prefijo</label>
            <input
              className="ui-input" style={{ maxWidth: 180 }}
              placeholder="Ej: OT-"
              value={prefijo}
              onChange={e => setPrefijo(e.target.value)}
            />
            {config && (
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                Próximo número:{" "}
                <strong style={{ fontFamily: "var(--font-mono)", color: "var(--pr)" }}>
                  {prefijo}{String((config.ultimo_numero ?? 0) + 1).padStart(4, "0")}
                </strong>
              </div>
            )}
          </div>

          {msg && (
            <div style={{ fontSize: 13, color: msg.includes("✓") ? "var(--em,#22c55e)" : "#dc2626" }}>
              {msg}
            </div>
          )}

          <div>
            <button className="ui-btn ui-btn--primary ui-btn--sm" onClick={guardar} disabled={saving}>
              {saving ? "Guardando…" : <><i className="bi bi-check-lg" style={{ marginRight: 6 }} />Guardar</>}
            </button>
          </div>
        </div>
      </div>

      {/* Estados personalizados — herramienta bloqueada */}
      <div className="ui-card" style={{ opacity: 0.65 }}>
        <div className="ui-card__header">
          <div className="ui-card__title">
            <i className="bi bi-diagram-3" style={{ marginRight: 6 }} />Estados personalizados del ciclo
            <span className="ui-badge ui-badge--gray" style={{ marginLeft: 8, fontSize: 10 }}>Herramienta</span>
          </div>
        </div>
        <div className="ui-card__body">
          <div className="ui-empty">
            <div className="ui-empty__icon"><i className="bi bi-shield-lock" /></div>
            <div className="ui-empty__text">No activado</div>
            <div className="ui-empty__sub">
              Esta herramienta permite definir etapas personalizadas del ciclo de reparación.
              Puede ser activada por el administrador del sistema según el plan del tenant.
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
