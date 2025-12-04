import { PageHeader } from '@/components/layouts/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CsvExportButton, CsvImportDialog } from '@/features/csv'
import { Download, Upload, FileSpreadsheet } from 'lucide-react'

export default function ImportExportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="CSV入出力"
        description="データのインポート・エクスポート"
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              エクスポート
            </CardTitle>
            <CardDescription>
              データをCSVファイルとしてダウンロードします
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">エクスポート可能なデータ</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>・部品マスタ（item_code, name, model_number, unit, ...）</li>
                <li>・在庫データ（item_code, warehouse, lot_number, quantity, ...）</li>
              </ul>
            </div>
            <CsvExportButton className="w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              インポート
            </CardTitle>
            <CardDescription>
              CSVファイルからデータを取り込みます
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">インポート時の注意</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>・1行目はヘッダー行として扱われます</li>
                <li>・部品コードが既存の場合は更新されます</li>
                <li>・文字コードはUTF-8を推奨します</li>
              </ul>
            </div>
            <CsvImportDialog />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            CSVフォーマット
          </CardTitle>
          <CardDescription>
            インポート用CSVファイルの形式
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">部品マスタ</h4>
              <div className="overflow-x-auto">
                <table className="text-sm border rounded-lg overflow-hidden w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">カラム名</th>
                      <th className="px-3 py-2 text-left">必須</th>
                      <th className="px-3 py-2 text-left">説明</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="px-3 py-2 font-mono">item_code</td>
                      <td className="px-3 py-2">○</td>
                      <td className="px-3 py-2">部品コード（一意）</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-3 py-2 font-mono">name</td>
                      <td className="px-3 py-2">○</td>
                      <td className="px-3 py-2">部品名</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-3 py-2 font-mono">unit</td>
                      <td className="px-3 py-2">○</td>
                      <td className="px-3 py-2">単位（個、本、枚など）</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-3 py-2 font-mono">model_number</td>
                      <td className="px-3 py-2"></td>
                      <td className="px-3 py-2">型番</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-3 py-2 font-mono">safety_stock</td>
                      <td className="px-3 py-2"></td>
                      <td className="px-3 py-2">安全在庫数</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-3 py-2 font-mono">reorder_point</td>
                      <td className="px-3 py-2"></td>
                      <td className="px-3 py-2">発注点</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
