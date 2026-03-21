// lib/auth-portal.js
import GoogleProvider from "next-auth/providers/google";
import db from "@/lib/db";

export const authPortalOptions = {
  trustHost: true,

  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: { prompt: "select_account" },
      },
    }),
  ],

  pages: {
    signIn: "/portal",
    error:  "/portal/error",
  },

  callbacks: {
    async signIn({ user }) {
      try {
        const [rows] = await db.query(
          `SELECT id, nombre, rubro, plan, db_name, activo
           FROM tenants WHERE email = ? LIMIT 1`,
          [user.email]
        );
        if (rows.length === 0) return "/portal/no-autorizado";
        const tenant = rows[0];
        if (!tenant.activo)  return "/portal/inactivo";
        if (!tenant.db_name) return "/portal/configurando";
        return true;
      } catch (err) {
        console.error("Portal signIn error:", err);
        return "/portal/error";
      }
    },

    async jwt({ token }) {
      if (token.email) {
        try {
          const [rows] = await db.query(
            `SELECT id, nombre, rubro, plan, db_name, activo
             FROM tenants WHERE email = ? LIMIT 1`,
            [token.email]
          );
          if (rows.length > 0) {
            token.tenantId     = rows[0].id;
            token.tenantNombre = rows[0].nombre;
            token.tenantRubro  = rows[0].rubro;
            token.tenantPlan   = rows[0].plan;
            token.tenantDbName = rows[0].db_name;
          }
        } catch (err) {
          console.error("Portal JWT error:", err);
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.tenantId     = token.tenantId     ?? null;
        session.user.tenantNombre = token.tenantNombre ?? null;
        session.user.tenantRubro  = token.tenantRubro  ?? null;
        session.user.tenantPlan   = token.tenantPlan   ?? null;
        session.user.tenantDbName = token.tenantDbName ?? null;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.includes("/portal/no-autorizado")) return `${baseUrl}/portal/no-autorizado`;
      if (url.includes("/portal/inactivo"))      return `${baseUrl}/portal/inactivo`;
      if (url.includes("/portal/configurando"))  return `${baseUrl}/portal/configurando`;
      return `${baseUrl}/portal/bienvenido`;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
