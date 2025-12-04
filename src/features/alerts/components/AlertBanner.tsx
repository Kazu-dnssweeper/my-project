'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { X, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAlerts } from '../hooks/useAlerts'
import type { Alert as AlertType } from '../types'

export function AlertBanner() {
  const { data: alerts } = useAlerts()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visibleAlerts = alerts?.filter((a) => !dismissed.has(a.id)) || []
  const criticalAlerts = visibleAlerts.filter((a) => a.severity === 'critical')

  if (criticalAlerts.length === 0) {
    return null
  }

  const currentAlert = criticalAlerts[currentIndex % criticalAlerts.length]

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set([...prev, id]))
    if (currentIndex >= criticalAlerts.length - 1) {
      setCurrentIndex(0)
    }
  }

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? criticalAlerts.length - 1 : prev - 1
    )
  }

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev === criticalAlerts.length - 1 ? 0 : prev + 1
    )
  }

  return (
    <Alert variant="destructive" className="mb-4 relative">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="pr-20">{currentAlert.title}</AlertTitle>
      <AlertDescription className="pr-20">
        <Link
          href={
            currentAlert.itemId
              ? `/inventory/${currentAlert.itemId}`
              : '/inventory'
          }
          className="underline hover:no-underline"
        >
          {currentAlert.message}
        </Link>
      </AlertDescription>
      <div className="absolute right-2 top-2 flex items-center gap-1">
        {criticalAlerts.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handlePrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs">
              {currentIndex + 1}/{criticalAlerts.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => handleDismiss(currentAlert.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  )
}
