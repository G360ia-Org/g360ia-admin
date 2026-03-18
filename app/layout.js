import Providers from "./providers";

export const metadata = {
  title: "G360 Admin — Gestión 360 iA",
  description: "Panel de administración de Gestión 360 iA",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
