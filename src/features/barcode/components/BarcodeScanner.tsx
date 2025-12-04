'use client'

import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Camera, SwitchCamera, X } from 'lucide-react'

interface BarcodeScannerProps {
  onScan: (code: string) => void
  onError?: (error: Error) => void
  onClose?: () => void
  formats?: ('QR_CODE' | 'CODE_128' | 'EAN_13' | 'CODE_39')[]
}

export function BarcodeScanner({
  onScan,
  onError,
  onClose,
  formats = ['QR_CODE', 'CODE_128', 'EAN_13', 'CODE_39'],
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const hints = new Map()
    const formatMap: Record<string, BarcodeFormat> = {
      QR_CODE: BarcodeFormat.QR_CODE,
      CODE_128: BarcodeFormat.CODE_128,
      EAN_13: BarcodeFormat.EAN_13,
      CODE_39: BarcodeFormat.CODE_39,
    }

    hints.set(
      DecodeHintType.POSSIBLE_FORMATS,
      formats.map((f) => formatMap[f])
    )

    readerRef.current = new BrowserMultiFormatReader(hints)

    // カメラ一覧を取得
    readerRef.current
      .listVideoInputDevices()
      .then((devices) => {
        setCameras(devices)
        if (devices.length > 0) {
          // 背面カメラを優先
          const backCamera = devices.find(
            (d) =>
              d.label.toLowerCase().includes('back') ||
              d.label.toLowerCase().includes('rear')
          )
          setSelectedCamera(backCamera?.deviceId || devices[0].deviceId)
        }
      })
      .catch((err) => {
        setError('カメラの取得に失敗しました')
        onError?.(err as Error)
      })

    return () => {
      readerRef.current?.reset()
    }
  }, [formats, onError])

  useEffect(() => {
    if (!selectedCamera || !readerRef.current || !videoRef.current) return

    setIsLoading(true)
    setError(null)

    readerRef.current
      .decodeFromVideoDevice(selectedCamera, videoRef.current, (result, err) => {
        if (result) {
          const code = result.getText()
          onScan(code)
        }
        // エラーは読み取り失敗時に継続的に発生するので無視
      })
      .then(() => {
        setIsLoading(false)
      })
      .catch((err) => {
        setIsLoading(false)
        setError('カメラの起動に失敗しました')
        onError?.(err as Error)
      })

    return () => {
      readerRef.current?.reset()
    }
  }, [selectedCamera, onScan, onError])

  const switchCamera = () => {
    const currentIndex = cameras.findIndex((c) => c.deviceId === selectedCamera)
    const nextIndex = (currentIndex + 1) % cameras.length
    setSelectedCamera(cameras[nextIndex].deviceId)
  }

  return (
    <Card className="relative overflow-hidden bg-black">
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 bg-black/50 text-white hover:bg-black/70"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      )}

      {cameras.length > 1 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 left-2 z-10 bg-black/50 text-white hover:bg-black/70"
          onClick={switchCamera}
        >
          <SwitchCamera className="h-5 w-5" />
        </Button>
      )}

      <div className="relative aspect-square max-h-80">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center text-white">
              <Spinner size="lg" className="mb-2 text-white" />
              <p className="text-sm">カメラを起動中...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center text-white p-4">
              <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />

        {/* スキャン枠 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white rounded-lg">
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
          </div>
        </div>
      </div>

      <div className="p-3 bg-black text-white text-center text-sm">
        バーコードまたはQRコードを枠内に合わせてください
      </div>
    </Card>
  )
}
