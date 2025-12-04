import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface CsvPreviewTableProps {
  data: Record<string, string>[]
  headers: string[]
  limit?: number
}

export function CsvPreviewTable({
  data,
  headers,
  limit = 10,
}: CsvPreviewTableProps) {
  const displayData = limit ? data.slice(0, limit) : data

  if (data.length === 0 || headers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        データがありません
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">#</TableHead>
              {headers.map((header) => (
                <TableHead key={header} className="min-w-[100px]">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayData.map((row, index) => (
              <TableRow key={index}>
                <TableCell className="text-center text-muted-foreground">
                  {index + 1}
                </TableCell>
                {headers.map((header) => (
                  <TableCell key={header} className="max-w-xs truncate">
                    {row[header] || '-'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
