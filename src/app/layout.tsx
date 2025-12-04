import type { Metadata } from "next"
import { QueryProvider } from "@/components/providers/query-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "PartStock - 電子部品在庫管理システム",
  description: "電子部品製造業向けクラウド在庫管理システム",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body className="font-sans antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
