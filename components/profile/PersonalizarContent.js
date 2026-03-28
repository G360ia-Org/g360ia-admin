"use client";
// components/profile/PersonalizarContent.js
// Contenido del popup "Personalizar"

export default function PersonalizarContent() {
  return (
    <div className="prof-content">
      <div className="prof-section-title">Apariencia</div>
      <div className="prof-option-row">
        <div className="prof-option-info">
          <div className="prof-option-label">Tema</div>
          <div className="prof-option-sub">Seleccioná el esquema de colores del panel</div>
        </div>
        <select className="prof-select">
          <option value="system">Sistema</option>
          <option value="light">Claro</option>
          <option value="dark">Oscuro</option>
        </select>
      </div>
      <div className="prof-option-row">
        <div className="prof-option-info">
          <div className="prof-option-label">Tamaño de fuente</div>
          <div className="prof-option-sub">Ajustá el tamaño del texto del panel</div>
        </div>
        <select className="prof-select">
          <option value="sm">Pequeño</option>
          <option value="md">Mediano</option>
          <option value="lg">Grande</option>
        </select>
      </div>
      <div className="prof-divider" />
      <div className="prof-section-title">Sidebar</div>
      <div className="prof-option-row">
        <div className="prof-option-info">
          <div className="prof-option-label">Inicio colapsado</div>
          <div className="prof-option-sub">El sidebar arranca minimizado al entrar al panel</div>
        </div>
        <label className="prof-toggle">
          <input type="checkbox" />
          <span className="prof-toggle__track" />
        </label>
      </div>
    </div>
  );
}
