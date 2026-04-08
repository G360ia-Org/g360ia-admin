"use client";

// Staging: ctx hardcodeado para testear el módulo sin autenticación real.
// En producción el ctx lo inyecta el sistema de permisos del panel.

import OTModule from "@/components/modules/ot/index";

const __testCtx = {
  tenant_id:  1,
  usuario_id: 1,
  rol:        "admin",
};

export default function DashboardPage() {
  return <OTModule ctx={__testCtx} />;
}
