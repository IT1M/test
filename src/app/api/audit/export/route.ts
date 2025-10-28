import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { AuditAction } from "@prisma/client";
import { createAuditLog, getClientInfo } from "@/utils/audit";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: "AUTH_ERROR", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Only AUDITOR, MANAGER, and ADMIN can export audit logs
    if (!["AUDITOR", "MANAGER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: { code: "AUTHORIZATION_ERROR", message: "Insufficient permissions" } },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format") || "csv";

    // Filters
    const userId = searchParams.get("userId");
    const action = searchParams.get("action") as AuditAction | null;
    const entityType = searchParams.get("entityType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build where clause
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate);
      }
    }

    // Fetch all matching audit logs
    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    // Create audit log for export
    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: session.user.id,
      action: "EXPORT",
      entityType: "AuditLog",
      ipAddress,
      userAgent,
    });

    if (format === "csv") {
      return exportAsCSV(logs);
    } else if (format === "pdf") {
      return exportAsPDF(logs);
    } else {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_FORMAT", message: "Invalid export format" } },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error exporting audit logs:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to export audit logs",
        },
      },
      { status: 500 }
    );
  }
}

function exportAsCSV(logs: any[]) {
  const headers = [
    "Timestamp",
    "User Name",
    "User Email",
    "User Role",
    "Action",
    "Entity Type",
    "Entity ID",
    "IP Address",
    "User Agent",
  ];

  const rows = logs.map((log) => [
    new Date(log.timestamp).toISOString(),
    log.user.name,
    log.user.email,
    log.user.role,
    log.action,
    log.entityType,
    log.entityId || "",
    log.ipAddress || "",
    log.userAgent || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  // Add UTF-8 BOM for proper Excel encoding
  const bom = "\uFEFF";
  const csvWithBom = bom + csvContent;

  return new NextResponse(csvWithBom, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}

function exportAsPDF(logs: any[]) {
  // Simple HTML-based PDF generation
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Audit Logs Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
    }
    h1 {
      color: #333;
      border-bottom: 2px solid #0066cc;
      padding-bottom: 10px;
    }
    .meta {
      color: #666;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      font-size: 12px;
    }
    th {
      background-color: #0066cc;
      color: white;
      padding: 10px;
      text-align: left;
      border: 1px solid #ddd;
    }
    td {
      padding: 8px;
      border: 1px solid #ddd;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: bold;
    }
    .badge-create { background-color: #d4edda; color: #155724; }
    .badge-update { background-color: #cce5ff; color: #004085; }
    .badge-delete { background-color: #f8d7da; color: #721c24; }
    .badge-login { background-color: #e2e3e5; color: #383d41; }
    .badge-logout { background-color: #e2e3e5; color: #383d41; }
    .badge-export { background-color: #fff3cd; color: #856404; }
    .badge-view { background-color: #d1ecf1; color: #0c5460; }
  </style>
</head>
<body>
  <h1>Audit Logs Report</h1>
  <div class="meta">
    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    <p><strong>Total Records:</strong> ${logs.length}</p>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Timestamp</th>
        <th>User</th>
        <th>Action</th>
        <th>Entity Type</th>
        <th>Entity ID</th>
        <th>IP Address</th>
      </tr>
    </thead>
    <tbody>
      ${logs
        .map(
          (log) => `
        <tr>
          <td>${new Date(log.timestamp).toLocaleString()}</td>
          <td>
            <div><strong>${log.user.name}</strong></div>
            <div style="font-size: 10px; color: #666;">${log.user.email}</div>
            <div style="font-size: 10px; color: #666;">${log.user.role}</div>
          </td>
          <td><span class="badge badge-${log.action.toLowerCase()}">${log.action}</span></td>
          <td>${log.entityType}</td>
          <td style="font-family: monospace; font-size: 10px;">${log.entityId ? log.entityId.slice(0, 12) + "..." : "-"}</td>
          <td style="font-size: 10px;">${log.ipAddress || "-"}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().split("T")[0]}.html"`,
    },
  });
}
