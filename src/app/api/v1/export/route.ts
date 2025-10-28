import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '@/middleware/apiAuth';
import { importExportService } from '@/services/importExport';
import { z } from 'zod';

const exportQuerySchema = z.object({
  format: z.enum(['excel', 'csv', 'json', 'pdf']).default('excel'),
  search: z.string().optional(),
  destination: z.enum(['MAIS', 'FOZAN']).optional(),
  category: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  includeMetadata: z.string().optional().transform(val => val === 'true'),
});

/**
 * GET /api/v1/export - Export inventory items
 */
export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, context) => {
      try {
        const { searchParams } = new URL(req.url);
        const query = exportQuerySchema.parse(Object.fromEntries(searchParams));

        const filters = {
          search: query.search,
          destination: query.destination,
          category: query.category,
          startDate: query.startDate,
          endDate: query.endDate,
        };

        let data: any;
        let contentType: string;
        let filename: string;

        switch (query.format) {
          case 'excel':
            data = await importExportService.exportToExcel(filters);
            contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            filename = `inventory_export_${new Date().toISOString().split('T')[0]}.xlsx`;
            break;

          case 'csv':
            data = await importExportService.exportToCSV(filters);
            contentType = 'text/csv';
            filename = `inventory_export_${new Date().toISOString().split('T')[0]}.csv`;
            break;

          case 'json':
            data = await importExportService.exportToJSON(filters, query.includeMetadata);
            return NextResponse.json(data);

          case 'pdf':
            data = await importExportService.exportToPDF(filters);
            contentType = 'application/pdf';
            filename = `inventory_export_${new Date().toISOString().split('T')[0]}.pdf`;
            break;

          default:
            return NextResponse.json(
              { error: 'Invalid export format' },
              { status: 400 }
            );
        }

        return new NextResponse(data, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        });
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Validation error', details: error.errors },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { error: error.message || 'Failed to export data' },
          { status: 500 }
        );
      }
    },
    { requiredPermission: { resource: 'inventory', action: 'read' } }
  );
}
