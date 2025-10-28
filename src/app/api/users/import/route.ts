import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { canPerformAction } from "@/utils/rbac";
import { createAuditLog, getClientInfo } from "@/utils/audit";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Validation schema for importing users
const ImportUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  role: z.enum(["ADMIN", "DATA_ENTRY", "SUPERVISOR", "MANAGER", "AUDITOR"]),
  isActive: z.boolean().optional().default(true),
});

const BulkImportSchema = z.object({
  users: z.array(ImportUserSchema).min(1, "At least one user is required").max(100, "Maximum 100 users per import"),
  generatePasswords: z.boolean().optional().default(false),
  sendInvitations: z.boolean().optional().default(false),
});

// POST /api/users/import - Bulk import users
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Check if user has permission to create users
    if (!canPerformAction(session.user.role, "create", "user")) {
      return NextResponse.json(
        { success: false, error: { code: "AUTHORIZATION_ERROR", message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = BulkImportSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input data",
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { users, generatePasswords, sendInvitations } = validation.data;

    // Check for duplicate emails in the import data
    const emails = users.map(u => u.email.toLowerCase());
    const duplicateEmails = emails.filter((email, index) => emails.indexOf(email) !== index);
    if (duplicateEmails.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Duplicate emails found in import data",
            details: duplicateEmails,
          },
        },
        { status: 400 }
      );
    }

    // Check for existing users
    const existingUsers = await prisma.user.findMany({
      where: {
        email: { in: emails },
      },
      select: { email: true },
    });

    if (existingUsers.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Some users already exist",
            details: existingUsers.map(u => u.email),
          },
        },
        { status: 400 }
      );
    }

    // Generate passwords if needed
    const generateRandomPassword = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
      let password = "";
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    // Prepare users for creation
    const usersToCreate = await Promise.all(
      users.map(async (user) => {
        const password = user.password || (generatePasswords ? generateRandomPassword() : "TempPassword123!");
        const hashedPassword = await bcrypt.hash(password, 12);

        return {
          email: user.email.toLowerCase(),
          name: user.name,
          password: hashedPassword,
          role: user.role,
          isActive: user.isActive,
          plainPassword: generatePasswords ? password : undefined, // Store for invitation email
        };
      })
    );

    // Create users in database
    const createdUsers = [];
    const errors = [];

    for (const userData of usersToCreate) {
      try {
        const { plainPassword, ...dbData } = userData;
        const createdUser = await prisma.user.create({
          data: dbData,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        });

        createdUsers.push({
          ...createdUser,
          plainPassword: plainPassword, // Include for invitation email
        });

        // Create audit log for each user
        const { ipAddress, userAgent } = getClientInfo(request);
        await createAuditLog({
          userId: session.user.id,
          action: "CREATE",
          entityType: "User",
          entityId: createdUser.id,
          newValue: {
            email: createdUser.email,
            name: createdUser.name,
            role: createdUser.role,
            importBatch: true,
          },
          ipAddress,
          userAgent,
        });
      } catch (error) {
        console.error(`Error creating user ${userData.email}:`, error);
        errors.push({
          email: userData.email,
          error: "Failed to create user",
        });
      }
    }

    // Send invitation emails if requested
    const invitationResults = [];
    if (sendInvitations && createdUsers.length > 0) {
      // TODO: Implement email service integration
      // For now, we'll just log that invitations would be sent
      for (const user of createdUsers) {
        invitationResults.push({
          email: user.email,
          invited: true,
          password: user.plainPassword,
        });
      }
    }

    // Create summary audit log
    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: session.user.id,
      action: "BULK_IMPORT",
      entityType: "User",
      entityId: "bulk",
      newValue: {
        totalAttempted: users.length,
        successful: createdUsers.length,
        failed: errors.length,
        generatePasswords,
        sendInvitations,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: {
        imported: createdUsers.map(u => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          isActive: u.isActive,
        })),
        errors,
        invitations: sendInvitations ? invitationResults : undefined,
        summary: {
          totalAttempted: users.length,
          successful: createdUsers.length,
          failed: errors.length,
        },
      },
    });
  } catch (error) {
    console.error("Error importing users:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to import users",
        },
      },
      { status: 500 }
    );
  }
}