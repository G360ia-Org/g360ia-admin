// lib/auth.js — staging stub (sin autenticación real)
// En staging no hay next-auth. El tenant se configura por variable de entorno.

export const authOptions = {};

export async function getServerSession() {
  return {
    user: {
      tenant_id: Number(process.env.STAGING_TENANT_ID ?? 1),
      id:        Number(process.env.STAGING_USER_ID   ?? 1),
      rol:       process.env.STAGING_ROL              ?? "admin",
      name:      "Test User",
      email:     "test@staging.local",
    },
  };
}
