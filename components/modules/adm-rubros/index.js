"use client";

import { useState } from "react";
import TabRubros  from "./TabRubros";
import TabModulos from "./TabModulos";
import TabPlanes  from "./TabPlanes";

const TABS = [
  { id: "rubros",  label: "Rubros",  icon: "bi-building"  },
  { id: "modulos", label: "Módulos", icon: "bi-box-seam"  },
  { id: "planes",  label: "Planes",  icon: "bi-credit-card" },
];

export default function MatrizModule() {
  const [tab, setTab] = useState("rubros");

  return (
    <div className="mod-tabs-layout">

      <div className="mod-page-header">
        <div>
          <div className="mod-title">Matriz</div>
          <div className="mod-sub">Rubros · Módulos · Planes</div>
        </div>
      </div>

      <div className="ui-tabs">
        {TABS.map(t => (
          <div
            key={t.id}
            className={`ui-tab${tab === t.id ? " ui-tab--active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <i className={`bi ${t.icon}`} /> {t.label}
          </div>
        ))}
      </div>

      <div className="mod-tab-body">
        {tab === "rubros"  && <TabRubros />}
        {tab === "modulos" && <TabModulos />}
        {tab === "planes"  && <TabPlanes />}
      </div>

    </div>
  );
}
