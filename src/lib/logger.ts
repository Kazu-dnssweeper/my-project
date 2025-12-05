type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

/**
 * 構造化ロガー
 * 開発環境ではconsoleに出力、本番環境では抑制または外部サービスに送信可能
 */
class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  private shouldLog(level: LogLevel): boolean {
    // 本番環境ではerrorとwarnのみ
    if (!this.isDevelopment) {
      return level === 'error' || level === 'warn'
    }
    return true
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context))
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context))
    }
  }

  error(message: string, error?: unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorContext = {
        ...context,
        ...(error instanceof Error && {
          errorName: error.name,
          errorMessage: error.message,
          stack: error.stack,
        }),
      }
      console.error(this.formatMessage('error', message, errorContext))

      // TODO: 本番環境では外部エラートラッキングサービス（Sentry等）に送信
      // if (!this.isDevelopment && typeof window !== 'undefined') {
      //   Sentry.captureException(error, { extra: context })
      // }
    }
  }
}

export const logger = new Logger()

/**
 * API関数用のエラーハンドラー
 * エラーをログに記録し、再スローする
 */
export function handleApiError(
  operation: string,
  error: unknown,
  context?: LogContext
): never {
  logger.error(`API Error: ${operation}`, error, context)
  throw error
}
