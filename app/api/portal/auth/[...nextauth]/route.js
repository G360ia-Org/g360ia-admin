// app/api/portal/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import { authPortalOptions } from "@/lib/auth-portal";

const handler = NextAuth(authPortalOptions);
export { handler as GET, handler as POST };
