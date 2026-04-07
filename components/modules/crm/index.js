"use client";

import { useState }         from "react";
import { useSession }       from "next-auth/react";
import SlidingTabs          from "@/components/ui/SlidingTabs";
import TabLeads             from "./TabLeads";
import TabFunnel            from "./TabFunnel";
import TabConversaciones    from "./TabConversaciones";
import TabClientes          from "./TabClientes";

const TABS = [
  { id: "leads",          label: "Leads",         icon: "bi-person-plus" },
  { id: "funnel",         label: "Funnel",         icon: "bi-funnel"      },
  { id: "conversaciones", label: "Conversaciones", icon: "bi-chat-dots"   },
  { id: "clientes",       label: "Clientes",       icon: "bi-people"      },
];

export default function CRMModule() {
  const { data: session } = useSession();
  const [tab, setTab] = useState("leads");

  const ctx = {
    tenant_id:  session?.user?.tenant_id ?? null,
    usuario_id: session?.user?.id        ?? null,
    rol:        session?.user?.rol        ?? null,
  };

  if (!ctx.tenant_id) {
    return (
      <div className="mod-tabs-layout">
        <div className="ui-empty">
          <div className="ui-empty__icon"><i className="bi bi-building-slash" /></div>
          <div className="ui-empty__text">Sin tenant asignado</div>
          <div className="ui-empty__sub">Tu usuario no tiene un tenant asociado. Contactá al administrador.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mod-tabs-layout">
      <div className="mod-page-header">
        <div>
          <div className="mod-title">CRM</div>
          <div className="mod-sub">Leads · Funnel · Conversaciones · Clientes</div>
        </div>
      </div>

      <SlidingTabs tabs={TABS} activeTab={tab} onTabChange={setTab} flushIds={["conversaciones"]}>
        <TabLeads          {...ctx} />
        <TabFunnel         {...ctx} />
        <TabConversaciones {...ctx} />
        <TabClientes       {...ctx} />
      </SlidingTabs>
    </div>
  );
}
