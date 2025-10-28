import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '@/middleware/apiAuth';
import { importExportService } from '@/services/importExport';

/**
 * POST /api/v1/import - Import inventory items from Excel/CSV
 */
export async function POST(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, context) => {
      try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
          return NextResponse.json(
            { error: 'File is required' },
            { status: 400 }
          );
        }

        // Validate file type
        const fileType = file.name.endsWith('.csv') ? 'csv' : 'excel';
        if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
          return NextResponse.json(
            { error: 'Invalid file type. Only Excel (.xlsx, .xls) and CSV files are supported' },
            { status: 400 }
          );
        }

        // Read file buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // Parse file
        const data = await importExportService.parseFile(buffer, fileType);

        if (data.length === 0) {
          return NextResponse.json(
            { error: 'File is empty or has no valid data' },
            { status: 400 }
          );
        }

        // Import data
        const result = await importExportService.importInventoryItems(
          data,
          context.apiKey.user.id
        );

        return NextResponse.json({
          success: result.success,
          message: `Import completed. ${result.imported} items imported, ${result.failed} failed.`,
          data: {
            imported: result.imported,
            failed: result.failed,
            errors: result.errors,
          },
        });
      } catch (error: any) {
        return NextResponse.json(
          { error: error.message || 'Failed to import file' },
          { status: 500 }
        );
      }
    },
    { requiredPermission: { resource: 'inventory', action: 'write' } }
  );
}
