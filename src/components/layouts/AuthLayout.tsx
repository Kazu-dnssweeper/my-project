interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">PartStock</h1>
          <p className="text-muted-foreground mt-2">
            電子部品在庫管理システム
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
