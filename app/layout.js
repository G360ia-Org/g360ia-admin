import Providers from "./providers";

export const metadata = {
  title: "G360 Admin — Gestión 360 iA",
  description: "Panel de administración de Gestión 360 iA",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; background: #F2F4F6; min-height: 100vh; }
          #__next_splash {
            position: fixed; inset: 0; background: #F2F4F6;
            display: flex; align-items: center; justify-content: center;
            flex-direction: column; gap: 1.1rem; z-index: 99999;
          }
          #__next_splash .sl-mark {
            width: 72px; height: 72px; background: #506886; border-radius: 18px;
            display: flex; align-items: center; justify-content: center;
            animation: slPop .5s cubic-bezier(.34,1.56,.64,1) forwards;
          }
          #__next_splash .sl-name { font-size: 1.2rem; font-weight: 600; color: #1F2937; opacity: 0; animation: slUp .4s ease .3s forwards; }
          #__next_splash .sl-sub { font-size: 0.72rem; color: #9CA3AF; letter-spacing: .08em; text-transform: uppercase; opacity: 0; animation: slUp .4s ease .5s forwards; }
          #__next_splash .sl-dots { display: flex; gap: 6px; opacity: 0; animation: slUp .4s ease .7s forwards; }
          #__next_splash .sl-dot { width: 6px; height: 6px; border-radius: 50%; background: #C5CDD6; animation: slPulse 1.2s ease infinite; }
          #__next_splash .sl-dot:nth-child(2) { animation-delay: .2s; }
          #__next_splash .sl-dot:nth-child(3) { animation-delay: .4s; }
          @keyframes slPop { from { transform: scale(.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          @keyframes slUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes slPulse { 0%,100% { background: #C5CDD6; transform: scale(1); } 50% { background: #506886; transform: scale(1.3); } }
        `}} />
      </head>
      <body>
        {/* Splash nativo — se muestra ANTES de que React hidrate */}
        <div id="__next_splash">
          <div className="sl-mark">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 18" width="36" height="30">
              <rect x="0"  y="10" width="6" height="6" rx="1.5" fill="white" opacity=".35"/>
              <rect x="0"  y="5"  width="6" height="6" rx="1.5" fill="white" opacity=".6"/>
              <rect x="0"  y="0"  width="6" height="6" rx="1.5" fill="white"/>
              <rect x="8"  y="0"  width="6" height="6" rx="1.5" fill="white"/>
              <rect x="8"  y="5"  width="6" height="6" rx="1.5" fill="white" opacity=".6"/>
              <rect x="16" y="0"  width="6" height="6" rx="1.5" fill="#B08A55"/>
            </svg>
          </div>
          <div className="sl-name">Gestión 360 iA</div>
          <div className="sl-sub">Software Modular Integrado con iA</div>
          <div className="sl-dots">
            <div className="sl-dot" />
            <div className="sl-dot" />
            <div className="sl-dot" />
          </div>
        </div>

        <Providers>{children}</Providers>

        {/* Script que remueve el splash después de 3s */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var splash = document.getElementById('__next_splash');
            if (!splash) return;
            setTimeout(function() {
              splash.style.transition = 'opacity .5s ease';
              splash.style.opacity = '0';
              setTimeout(function() { splash.remove(); }, 500);
            }, 3000);
          })();
        `}} />
      </body>
    </html>
  );
}
