import db from "../../../lib/db";
import nodemailer from "nodemailer";

export async function POST(req) {
  const { email } = await req.json();

  await db.query(
    "UPDATE usuarios SET status = 'approved' WHERE email = ?",
    [email]
  );

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Gestión 360 iA" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Acceso aprobado",
    text: "Tu cuenta ya fue aprobada. Ya podés ingresar.",
  });

  return Response.json({ ok: true });
}
