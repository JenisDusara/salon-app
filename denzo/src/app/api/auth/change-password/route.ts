import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const { oldPassword, newPassword } = await request.json();

  if (!oldPassword || !newPassword)
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });

  if (newPassword.length < 6)
    return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });

  const admin = await prisma.admin.findUnique({ where: { id: payload.adminId } });
  if (!admin) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

  const isMatch = await bcrypt.compare(oldPassword, admin.passwordHash);
  if (!isMatch)
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.admin.update({ where: { id: admin.id }, data: { passwordHash: hashed } });

  return NextResponse.json({ success: true });
}
