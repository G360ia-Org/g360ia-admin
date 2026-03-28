"use client";
// components/profile/DocumentosContent.js
// Contenido del popup "Documentos"

const DOCS = [
  { icon: "bi-file-earmark-text", label: "Términos y condiciones",      desc: "Condiciones de uso de la plataforma" },
  { icon: "bi-shield-check",      label: "Política de privacidad",       desc: "Cómo manejamos tus datos" },
  { icon: "bi-file-earmark-pdf",  label: "Contrato de servicio",         desc: "Acuerdo vigente con tu cuenta" },
  { icon: "bi-receipt",           label: "Facturas y comprobantes",      desc: "Historial de pagos y documentos fiscales" },
];

export default function DocumentosContent() {
  return (
    <div className="prof-content">
      {DOCS.map((doc) => (
        <div key={doc.label} className="prof-doc-row">
          <div className="prof-doc-icon">
            <i className={`bi ${doc.icon}`} />
          </div>
          <div className="prof-doc-info">
            <div className="prof-doc-label">{doc.label}</div>
            <div className="prof-doc-sub">{doc.desc}</div>
          </div>
          <i className="bi bi-chevron-right prof-doc-arrow" />
        </div>
      ))}
    </div>
  );
}
