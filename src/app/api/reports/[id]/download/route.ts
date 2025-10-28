import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { generatePDFReport } from "@/utils/pdfGenerator";
import { createAuditLog, getClientInfo } from "@/utils/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Check authorization - MANAGER role or higher
    const allowedRoles = ["MANAGER", "ADMIN"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: { code: "AUTHORIZATION_ERROR", message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        generatedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Report not found" } },
        { status: 404 }
      );
    }

    // Generate PDF
    const pdf = generatePDFReport(report as any);
    const pdfBuffer = Buffer.from(pdf.output("arraybuffer"));

    // Create audit log
    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: session.user.id,
      action: "EXPORT",
      entityType: "Report",
      entityId: report.id,
      ipAddress,
      userAgent,
    });

    // Generate filename
    const filename = `${report.title.replace(/[^a-z0-9]/gi, "_")}_${report.id.slice(0, 8)}.pdf`;

    // Return PDF as download
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error downloading report:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while downloading the report",
        },
      },
      { status: 500 }
    );
  }
}
