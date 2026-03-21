"use client";
// app/portal/dashboard/page.js
// Dashboard principal del portal tenant

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";

// ── Módulos disponibles por plan ──────────────────────────────────
const MODULOS_POR_PLAN = {
  starter:    ["dashboard"],
  pro:        ["dashboard", "clientes", "whatsapp", "facturacion", "estadisticas", "notificaciones"],
  plan_ia:    ["dashboard", "clientes", "whatsapp", "facturacion", "estadisticas", "notificaciones", "ia"],
  enterprise: ["dashboard", "clientes", "whatsapp", "facturacion", "estadisticas", "notificaciones", "ia"],
};

// ── Metadata de cada módulo ───────────────────────────────────────
const MODULO_META = {
  dashboard:     { label: "Dashboard",      icon: "bi-grid-1x2",       disponible: true  },
  clientes:      { label: "Clientes",       icon: "bi-people",         disponible: false },
  whatsapp:      { label: "WhatsApp",       icon: "bi-whatsapp",       disponible: false },
  facturacion:   { label: "Facturación",    icon: "bi-receipt",        disponible: false },
  estadisticas:  { label: "Estadísticas",   icon: "bi-bar-chart-line", disponible: false },
  notificaciones:{ label: "Notificaciones", icon: "bi-bell",           disponible: false },
  ia:            { label: "Asistente IA",   icon: "bi-stars",          disponible: false },
};

export default function PortalDashboard() {
  const { data: session, status } = useSession();
  const [view, setView]         = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [menuUsuario, setMenuUsuario] = useState(false);
  const [modulosActivos, setModulosActivos] = useState([]);
  const menuRef = useRef(null);

  const tenant = {
    id:     session?.user?.tenantId,
    nombre: session?.user?.tenantNombre || "Mi negocio",
    rubro:  session?.user?.tenantRubro  || "",
    plan:   session?.user?.tenantPlan   || "starter",
    dbName: session?.user?.tenantDbName || "",
  };

  const userName    = session?.user?.name  || "";
  const userImage   = session?.user?.image || null;
  const userInitial = userName[0]?.toUpperCase() || "?";

  // Cargar módulos activos desde la DB del tenant
  useEffect(() => {
    if (!tenant.id) return;
    fetch(`/api/portal/modulos?tenant_id=${tenant.id}`)
      .then(r => r.json())
      .then(d => { if (d.ok) setModulosActivos(d.modulos); })
      .catch(() => {
        // Fallback: usar módulos del plan
        setModulosActivos(MODULOS_POR_PLAN[tenant.plan] || ["dashboard"]);
      });
  }, [tenant.id]);

  // Cerrar menú usuario al click afuera
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuUsuario(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (status === "loading") return <Cargando />;
  if (status === "unauthenticated") {
    if (typeof window !== "undefined") window.location.href = "/portal";
    return null;
  }

  const modulosVisibles = modulosActivos.length > 0
    ? modulosActivos
    : (MODULOS_POR_PLAN[tenant.plan] || ["dashboard"]);

  return (
    <>
      <div className="p-wrap">

        {/* ── SIDEBAR ── */}
        <nav className={`p-sb${collapsed ? " collapsed" : ""}`}>

          {/* Brand */}
          <div className="p-sb-brand">
            <div className="p-sb-logo-mark" onClick={() => setCollapsed(!collapsed)}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 18" width="16" height="16">
                <rect x="0" y="10" width="6" height="6" rx="1.5" fill="white" opacity=".3"/>
                <rect x="0" y="5"  width="6" height="6" rx="1.5" fill="white" opacity=".55"/>
                <rect x="0" y="0"  width="6" height="6" rx="1.5" fill="white"/>
                <rect x="8" y="0"  width="6" height="6" rx="1.5" fill="white"/>
                <rect x="8" y="5"  width="6" height="6" rx="1.5" fill="white" opacity=".55"/>
                <rect x="16" y="0" width="6" height="6" rx="1.5" fill="#B08A55"/>
              </svg>
            </div>
            <div className="p-sb-texts">
              <div className="p-sb-nombre">{tenant.nombre}</div>
              <div className="p-sb-rubro">{tenant.rubro}</div>
            </div>
          </div>

          {/* Nav */}
          <div className="p-sb-scroll">
            <div className="p-sb-sec">Menú</div>
            {modulosVisibles.map(mod => {
              const meta = MODULO_META[mod];
              if (!meta) return null;
              return (
                <div
                  key={mod}
                  className={`p-ni${view === mod ? " on" : ""}${!meta.disponible ? " pronto" : ""}`}
                  onClick={() => meta.disponible && setView(mod)}
                >
                  <span className="p-ni-ic">
                    <i className={`bi ${meta.icon}`} />
                  </span>
                  <span className="p-ni-txt">{meta.label}</span>
                  {!meta.disponible && (
                    <span className="p-ni-soon">soon</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer usuario */}
          <div className="p-sb-foot" ref={menuRef}>
            <div className="p-sb-user" onClick={() => setMenuUsuario(m => !m)}>
              {userImage
                ? <img src={userImage} className="p-sb-av-img" alt="" />
                : <div className="p-sb-av">{userInitial}</div>
              }
              <div className="p-sb-texts">
                <div className="p-sb-uname">{userName}</div>
                <div className="p-sb-urole">{PLAN_LABEL[tenant.plan] || tenant.plan}</div>
              </div>
            </div>

            {menuUsuario && (
              <div className="p-sb-menu">
                <div className="p-sb-menu-item" onClick={() => signOut({ callbackUrl: "/portal" })}>
                  <i className="bi bi-box-arrow-right" />
                  Cerrar sesión
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* ── MAIN ── */}
        <div className="p-main">

          {/* Topbar */}
          <div className="p-topbar">
            <div className="p-tb-title">
              {MODULO_META[view]?.label || "Dashboard"}
            </div>
            <div style={{ flex: 1 }} />
            <div className="p-tb-plan">
              <span className={`p-plan-badge p-plan-${tenant.plan}`}>
                {PLAN_LABEL[tenant.plan] || tenant.plan}
              </span>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-content">
            {view === "dashboard" && (
              <ViewDashboardTenant tenant={tenant} modulosVisibles={modulosVisibles} />
            )}
          </div>

        </div>
      </div>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --green: #1A7A4A;
          --green-l: #E8F5EE;
          --green-m: #3A9E70;
          --gold: #B08A55;
          --gold-l: #FDF3E0;
          --slate: #506886;
          --slate-d: #3E5270;
          --bg: #F0F4F0;
          --white: #fff;
          --border: #E5E7EB;
          --text: #1F2937;
          --text2: #4B5563;
          --muted: #9CA3AF;
          --sh: 0 1px 3px rgba(0,0,0,.06), 0 4px 14px rgba(0,0,0,.04);
          --r: 11px;
          --r-sm: 7px;
        }

        body { font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; background: var(--bg); color: var(--text); font-size: 13px; }

        /* ── WRAP ── */
        .p-wrap { display: flex; height: 100vh; overflow: hidden; }

        /* ── SIDEBAR ── */
        .p-sb {
          width: 230px; min-width: 230px;
          background: var(--green);
          display: flex; flex-direction: column;
          height: 100vh; overflow: hidden;
          transition: width .2s, min-width .2s;
          flex-shrink: 0;
        }
        .p-sb.collapsed { width: 52px; min-width: 52px; }

        .p-sb-brand {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 12px;
          border-bottom: 1px solid rgba(255,255,255,.15);
          flex-shrink: 0; overflow: hidden;
        }
        .p-sb-logo-mark {
          width: 30px; height: 30px; flex-shrink: 0;
          background: rgba(255,255,255,.15);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
        }
        .p-sb-texts { overflow: hidden; white-space: nowrap; transition: opacity .15s, max-width .2s; max-width: 180px; }
        .collapsed .p-sb-texts { opacity: 0; max-width: 0; }
        .p-sb-nombre { font-size: 0.82rem; font-weight: 700; color: #fff; overflow: hidden; text-overflow: ellipsis; }
        .p-sb-rubro  { font-size: 0.62rem; color: rgba(255,255,255,.6); margin-top: 1px; }

        .p-sb-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 8px 0; scrollbar-width: none; }
        .p-sb-scroll::-webkit-scrollbar { display: none; }

        .p-sb-sec {
          font-size: 0.58rem; font-weight: 700; letter-spacing: .12em;
          text-transform: uppercase; color: rgba(255,255,255,.4);
          padding: 8px 14px 4px; white-space: nowrap; overflow: hidden;
        }
        .collapsed .p-sb-sec { opacity: 0; height: 0; padding: 0; }

        .p-ni {
          display: flex; align-items: center; gap: 9px;
          padding: 7px 12px; margin: 1px 6px;
          border-radius: var(--r-sm);
          color: rgba(255,255,255,.8);
          cursor: pointer; font-size: 0.8rem; font-weight: 500;
          transition: background .12s;
          white-space: nowrap; overflow: hidden;
        }
        .p-ni:hover:not(.pronto) { background: rgba(255,255,255,.15); }
        .p-ni.on { background: rgba(255,255,255,.2); color: #fff; font-weight: 600; }
        .p-ni.pronto { opacity: 0.5; cursor: default; }
        .p-ni-ic { font-size: 0.92rem; flex-shrink: 0; width: 18px; text-align: center; }
        .p-ni-txt { flex: 1; overflow: hidden; transition: opacity .15s, max-width .2s; max-width: 140px; }
        .collapsed .p-ni-txt { opacity: 0; max-width: 0; }
        .p-ni-soon {
          font-size: 0.5rem; font-weight: 700; letter-spacing: .04em;
          background: rgba(176,138,85,.25); color: #C8A472;
          border: 1px solid rgba(176,138,85,.3);
          border-radius: 6px; padding: 1px 5px; flex-shrink: 0;
        }
        .collapsed .p-ni-soon { display: none; }

        /* Footer sidebar */
        .p-sb-foot {
          border-top: 1px solid rgba(255,255,255,.15);
          padding: 8px 6px; flex-shrink: 0;
          position: relative;
        }
        .p-sb-user {
          display: flex; align-items: center; gap: 9px;
          padding: 6px 8px; border-radius: var(--r-sm);
          cursor: pointer; transition: background .12s;
          overflow: hidden;
        }
        .p-sb-user:hover { background: rgba(255,255,255,.1); }
        .p-sb-av {
          width: 28px; height: 28px; border-radius: 50%;
          background: rgba(255,255,255,.2);
          color: #fff; font-size: 0.72rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .p-sb-av-img { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
        .p-sb-uname { font-size: 0.78rem; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .p-sb-urole { font-size: 0.6rem; color: rgba(255,255,255,.5); margin-top: 1px; }
        .collapsed .p-sb-texts { opacity: 0; max-width: 0; }

        .p-sb-menu {
          position: absolute; bottom: calc(100% + 6px); left: 6px; right: 6px;
          background: var(--white); border: 1px solid var(--border);
          border-radius: var(--r); box-shadow: var(--sh);
          overflow: hidden; z-index: 100;
        }
        .p-sb-menu-item {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 14px; cursor: pointer;
          font-size: 0.8rem; color: #D9534F;
          transition: background .12s;
        }
        .p-sb-menu-item:hover { background: #FDF2F2; }

        /* ── MAIN ── */
        .p-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }

        .p-topbar {
          height: 50px; background: var(--white);
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center; gap: 12px;
          padding: 0 20px; flex-shrink: 0;
        }
        .p-tb-title { font-size: 0.92rem; font-weight: 700; color: var(--text); }

        .p-plan-badge {
          font-size: 0.65rem; font-weight: 700;
          padding: 3px 10px; border-radius: 20px;
        }
        .p-plan-starter    { background: #F3F4F6; color: #6B7280; }
        .p-plan-pro        { background: var(--green-l); color: var(--green); }
        .p-plan-plan_ia    { background: var(--gold-l); color: #7A5800; }
        .p-plan-enterprise { background: #EDF1F6; color: var(--slate); }

        .p-content { flex: 1; overflow-y: auto; padding: 20px; }
        .p-content::-webkit-scrollbar { width: 4px; }
        .p-content::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

        /* ── CARDS ── */
        .p-card {
          background: var(--white); border: 1px solid var(--border);
          border-radius: var(--r); padding: 16px 18px;
          box-shadow: var(--sh);
        }

        /* ── GRID ── */
        .p-g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .p-g3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }

        /* ── AI PANEL ── */
        .p-ai {
          background: #1C3D2E;
          border-radius: var(--r); padding: 16px 18px;
          color: rgba(255,255,255,.9);
        }
        .p-ai-hdr {
          display: flex; align-items: center; gap: 7px;
          font-size: 0.65rem; font-weight: 700;
          color: rgba(255,255,255,.5);
          text-transform: uppercase; letter-spacing: .1em;
          margin-bottom: 10px;
        }
        .p-ai-dot { width: 7px; height: 7px; border-radius: 50%; background: #4EC88A; }
        .p-ai-txt { font-size: 0.82rem; line-height: 1.55; color: rgba(255,255,255,.85); }

        @keyframes p-fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        .p-anim { animation: p-fadeIn .18s ease; }
      `}</style>
    </>
  );
}

// ── Constantes ────────────────────────────────────────────────────
const PLAN_LABEL = {
  starter:    "Starter",
  pro:        "Pro",
  plan_ia:    "Plan IA",
  enterprise: "Enterprise",
};

// ── Vista Dashboard ───────────────────────────────────────────────
function ViewDashboardTenant({ tenant, modulosVisibles }) {
  return (
    <div className="p-anim">

      {/* Bienvenida */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1F2937", marginBottom: 4 }}>
          Bienvenido, {tenant.nombre} 👋
        </h1>
        <p style={{ fontSize: "0.82rem", color: "#6B7280" }}>
          {tenant.rubro} · Plan {PLAN_LABEL[tenant.plan] || tenant.plan}
        </p>
      </div>

      {/* Panel IA */}
      <div className="p-ai" style={{ marginBottom: 20 }}>
        <div className="p-ai-hdr">
          <div className="p-ai-dot" />
          Asistente IA · MAIA
        </div>
        <div className="p-ai-txt">
          Tu espacio está listo. A medida que uses la plataforma, voy a generarte sugerencias personalizadas para tu negocio.
        </div>
      </div>

      {/* Módulos disponibles */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>
          Tus módulos
        </div>
        <div className="p-g3">
          {modulosVisibles.map(mod => {
            const meta = MODULO_META[mod];
            if (!mod || mod === "dashboard") return null;
            return (
              <div key={mod} className="p-card" style={{
                opacity: meta?.disponible ? 1 : 0.6,
                cursor: meta?.disponible ? "pointer" : "default",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 8,
                    background: meta?.disponible ? "#E8F5EE" : "#F3F4F6",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <i className={`bi ${meta?.icon}`} style={{
                      color: meta?.disponible ? "#1A7A4A" : "#9CA3AF",
                      fontSize: "0.95rem",
                    }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1F2937" }}>
                      {meta?.label}
                    </div>
                    {!meta?.disponible && (
                      <div style={{ fontSize: "0.65rem", color: "#9CA3AF", marginTop: 1 }}>
                        Próximamente
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info plan */}
      {tenant.plan === "starter" && (
        <div style={{
          background: "#FDF3E0", border: "1px solid #E8D5AF",
          borderRadius: 10, padding: "14px 16px",
          display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <i className="bi bi-stars" style={{ color: "#B08A55", fontSize: "1rem", flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#7A5800", marginBottom: 3 }}>
              Expandí tu negocio con más módulos
            </div>
            <div style={{ fontSize: "0.75rem", color: "#92680A", lineHeight: 1.5 }}>
              Actualizá tu plan para acceder a WhatsApp, facturación, estadísticas y el asistente IA completo.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Componente cargando ───────────────────────────────────────────
function Cargando() {
  return (
    <div style={{
      minHeight: "100vh", background: "#F0F4F0",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "system-ui", color: "#9CA3AF", fontSize: "0.85rem",
    }}>
      Cargando...
    </div>
  );
}
