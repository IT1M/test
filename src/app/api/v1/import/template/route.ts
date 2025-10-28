import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '@/middleware/apiAuth';
import { importExportService } from '@/services/importExport';

/**
 * GET /api/v1/import/template - Download import template
 */
export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, context) => {
      try {
        const template = importExportService.generateImportTemplate();

        return new NextResponse(template, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="inventory_import_template.xlsx"',
          },
        });
      } catch (error: any) {
        return NextResponse.json(
          { error: error.message || 'Failed to generate template' },
          { status: 500 }
        );
      }
    },
    { requiredPermission: { resource: 'inventory', action: 'read' } }
  );
}
