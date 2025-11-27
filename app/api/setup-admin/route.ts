import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: "admin@cricauction.com" },
    });

    if (existingAdmin) {
      return NextResponse.json(
        { message: "Admin user already exists!" },
        { status: 200 }
      );
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);

    const admin = await prisma.user.create({
      data: {
        email: "admin@cricauction.com",
        name: "Admin User",
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    return NextResponse.json({
      message: "Admin user created successfully!",
      credentials: {
        email: "admin@cricauction.com",
        password: "admin123",
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating admin:", error);
    return NextResponse.json(
      { error: "Failed to create admin user" },
      { status: 500 }
    );
  }
}
