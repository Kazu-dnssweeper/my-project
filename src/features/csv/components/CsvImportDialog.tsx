'use client'

import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { Upload, CheckCircle, XCircle, FileSpreadsheet } from 'lucide-react'
import { parseCsv, importItems } from '../api'
import { CsvPreviewTable } from './CsvPreviewTable'
import type { CsvImportResult } from '../types'

interface CsvImportDialogProps {
  onSuccess?: () => void
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'result'

export function CsvImportDialog({ onSuccess }: CsvImportDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<ImportStep>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [data, setData] = useState<Record<string, string>[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [result, setResult] = useState<CsvImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setStep('upload')
    setFile(null)
    setData([])
    setHeaders([])
    setResult(null)
    setError(null)
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setError(null)

    try {
      const { data: parsedData, headers: parsedHeaders } = await parseCsv<
        Record<string, string>
      >(selectedFile)
      setData(parsedData)
      setHeaders(parsedHeaders)
      setStep('preview')
    } catch (err) {
      setError('CSVファイルの解析に失敗しました')
    }
  }

  const handleImport = async () => {
    setStep('importing')
    setError(null)

    try {
      const importResult = await importItems(data)
      setResult(importResult)
      setStep('result')
      if (importResult.success > 0) {
        onSuccess?.()
      }
    } catch (err) {
      setError('インポートに失敗しました')
      setStep('preview')
    }
  }

  const handleClose = () => {
    setOpen(false)
    reset()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          インポート
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            CSVインポート
          </DialogTitle>
          <DialogDescription>
            部品マスタをCSVファイルからインポートします
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 'upload' && (
          <div className="py-8">
            <label
              htmlFor="csv-file"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                クリックしてCSVファイルを選択
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                または、ファイルをドラッグ＆ドロップ
              </p>
            </label>
            <input
              id="csv-file"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {file?.name} - {data.length}件のデータ
              </p>
              <Button variant="ghost" size="sm" onClick={reset}>
                別のファイルを選択
              </Button>
            </div>
            <CsvPreviewTable data={data} headers={headers} limit={10} />
            {data.length > 10 && (
              <p className="text-sm text-muted-foreground text-center">
                他 {data.length - 10}件のデータ
              </p>
            )}
          </div>
        )}

        {step === 'importing' && (
          <div className="py-8 flex flex-col items-center justify-center">
            <Spinner size="lg" />
            <p className="mt-4 text-muted-foreground">
              インポート中... ({data.length}件)
            </p>
          </div>
        )}

        {step === 'result' && result && (
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100 text-green-600 mx-auto">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <p className="mt-2 text-2xl font-bold text-green-600">
                  {result.success}
                </p>
                <p className="text-sm text-muted-foreground">成功</p>
              </div>
              {result.failed > 0 && (
                <div className="text-center">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 text-red-600 mx-auto">
                    <XCircle className="h-6 w-6" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-red-600">
                    {result.failed}
                  </p>
                  <p className="text-sm text-muted-foreground">失敗</p>
                </div>
              )}
            </div>
            {result.errors.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">エラー詳細:</p>
                <div className="max-h-32 overflow-y-auto space-y-1 text-sm">
                  {result.errors.slice(0, 10).map((err, i) => (
                    <p key={i} className="text-destructive">
                      行{err.row}: {err.message}
                    </p>
                  ))}
                  {result.errors.length > 10 && (
                    <p className="text-muted-foreground">
                      他 {result.errors.length - 10}件のエラー
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                キャンセル
              </Button>
              <Button onClick={handleImport}>インポート実行</Button>
            </>
          )}
          {step === 'result' && (
            <Button onClick={handleClose}>閉じる</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
