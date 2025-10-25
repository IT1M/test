import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { createAuditLog, getClientInfo } from "@/utils/audit";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Check authorization - ADMIN or MANAGER only
    const allowedRoles = ["ADMIN", "MANAGER"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: { code: "AUTHORIZATION_ERROR", message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Find backup record
    const backup = await prisma.backup.findUnique({
      where: { id },
    });

    if (!backup) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Backup not found" } },
        { status: 404 }
      );
    }

    // Read backup file
    const filePath = join(process.cwd(), "public", backup.storagePath);
    const fileContent = await readFile(filePath);

    // Determine content type based on file type
    let contentType: string;
    switch (backup.fileType) {
      case "CSV":
        contentType = "text/csv";
        break;
      case "JSON":
        contentType = "application/json";
        break;
      case "SQL":
        contentType = "text/plain";
        break;
      default:
        contentType = "application/octet-stream";
    }

    // Create audit log
    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: session.user.id,
      action: "VIEW",
      entityType: "Backup",
      entityId: backup.id,
      ipAddress,
      userAgent,
    });

    // Return file with appropriate headers
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${backup.fileName}"`,
        "Content-Length": backup.fileSize.toString(),
      },
    });
  } catch (error) {
    console.error("Error downloading backup:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while downloading the backup",
        },
      },
      { status: 500 }
    );
  }
}
