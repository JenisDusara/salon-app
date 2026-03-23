export const dynamic = "force-dynamic";

import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { username, resetCode, newPassword } = await request.json();

    if (!username || !resetCode || !newPassword) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    // Validate reset code against env variable
    const validCode = process.env.ADMIN_RESET_CODE;
    if (!validCode || resetCode !== validCode) {
      return NextResponse.json(
        { error: "Invalid reset code" },
        { status: 401 },
      );
    }

    // Find admin
    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) {
      return NextResponse.json(
        { error: "Username not found" },
        { status: 404 },
      );
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    // Hash and update password
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.admin.update({
      where: { id: admin.id },
      data: { passwordHash },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
