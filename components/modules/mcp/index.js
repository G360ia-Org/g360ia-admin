"use client";

import { useState }      from "react";
import { useSession }    from "next-auth/react";
import SlidingTabs       from "@/components/ui/SlidingTabs";
import TabHub            from "./TabHub";
import TabWhatsapp       from "./TabWhatsapp";
import TabMercadoPago    from "./TabMercadoPago";
import TabGoogle         from "./TabGoogle";
import TabMeta           from "./TabMeta";

const TABS = [
  { id: "hub",         label: "Conexiones",  icon: "bi-grid-1x2"           },
  { id: "whatsapp",    label: "WhatsApp",    icon: "bi-whatsapp"            },
  { id: "mercadopago", label: "MercadoPago", icon: "bi-credit-card-2-front" },
  { id: "google",      label: "Google",      icon: "bi-google"              },
  { id: "meta",        label: "Meta",        icon: "bi-meta"                },
];

export default function MCPModule() {
  const { data: session } = useSession();
  const [tab, setTab] = useState("hub");

  const ctx = {
    tenant_id:  session?.user?.tenant_id ?? null,
    usuario_id: session?.user?.id        ?? null,
    rol:        session?.user?.rol       ?? null,
  };

  return (
    <div className="mod-tabs-layout">
      <div className="mod-page-header">
        <div>
          <div className="mod-title">MCP</div>
          <div className="mod-sub">Multi-Channel Platform · Conexiones externas</div>
        </div>
      </div>

      <SlidingTabs tabs={TABS} activeTab={tab} onTabChange={setTab}>
        <TabHub         {...ctx} onTabChange={setTab} />
        <TabWhatsapp    {...ctx} />
        <TabMercadoPago {...ctx} />
        <TabGoogle      {...ctx} />
        <TabMeta        {...ctx} />
      </SlidingTabs>
    </div>
  );
}
