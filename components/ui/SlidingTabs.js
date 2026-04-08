"use client";

import { useRef, useLayoutEffect, useState } from "react";

/**
 * SlidingTabs — barra de tabs con indicador deslizante + viewport carrusel.
 *
 * Props:
 *   tabs        {id, label, icon}[]   — definición de tabs
 *   activeTab   string                — tab activa
 *   onTabChange (id) => void          — callback al cambiar tab
 *   children    ReactNode[]           — paneles en el mismo orden que tabs[]
 *   flushIds    string[]              — ids de tabs cuyo panel va sin padding (opcional)
 */
export default function SlidingTabs({ tabs, activeTab, onTabChange, children, flushIds = [] }) {
  const tabRefs = useRef({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const el = tabRefs.current[activeTab];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeTab]);

  const panels  = Array.isArray(children) ? children : [children];
  const activeIndex = tabs.findIndex(t => t.id === activeTab);

  return (
    <>
      <div className="ui-tabs ui-tabs--sliding">
        {tabs.map(t => (
          <div
            key={t.id}
            ref={el => (tabRefs.current[t.id] = el)}
            className={`ui-tab${activeTab === t.id ? " ui-tab--active" : ""}`}
            onClick={() => onTabChange(t.id)}
          >
            <i className={`bi ${t.icon}`} /> {t.label}
          </div>
        ))}
        <span
          className="ui-tab-indicator"
          style={{ left: indicator.left, width: indicator.width }}
        />
      </div>

      <div className="mod-tab-slider">
        <div
          className="mod-tab-track"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {panels.map((panel, i) => (
            <div
              key={i}
              className={`mod-tab-panel${flushIds.includes(tabs[i]?.id) ? " mod-tab-panel--flush" : ""}`}
            >
              {panel}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
