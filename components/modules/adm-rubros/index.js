"use client";

import { useState }   from "react";
import SlidingTabs    from "@/components/ui/SlidingTabs";
import TabRubros      from "./TabRubros";
import TabModulos     from "./TabModulos";
import TabPlanes      from "./TabPlanes";

const TABS = [
  { id: "rubros",  label: "Rubros",  icon: "bi-building"    },
  { id: "modulos", label: "Módulos", icon: "bi-box-seam"    },
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

      <SlidingTabs tabs={TABS} activeTab={tab} onTabChange={setTab}>
        <TabRubros />
        <TabModulos />
        <TabPlanes />
      </SlidingTabs>
    </div>
  );
}
