#!/bin/bash
# PartStock プロジェクトセットアップスクリプト

set -e

echo "🚀 PartStock プロジェクトセットアップを開始します..."

# 1. Next.js プロジェクト作成
echo "📦 Next.js プロジェクトを作成中..."
npx create-next-app@latest partstock \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-npm

cd partstock

# 2. 追加パッケージインストール
echo "📦 依存パッケージをインストール中..."
npm install @supabase/supabase-js @supabase/ssr
npm install zustand
npm install react-hook-form @hookform/resolvers zod
npm install @tanstack/react-query
npm install date-fns
npm install lucide-react
npm install @zxing/browser @zxing/library  # バーコード読み取り
npm install jspdf  # PDF生成

# 開発依存
npm install -D @types/node
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D msw

# 3. shadcn/ui セットアップ
echo "🎨 shadcn/ui をセットアップ中..."
npx shadcn@latest init -y

# 基本コンポーネント追加
npx shadcn@latest add button input label card dialog select checkbox badge toast skeleton

# 4. ディレクトリ構造作成
echo "📁 ディレクトリ構造を作成中..."
mkdir -p src/components/{ui,forms,data-display,layouts}
mkdir -p src/features/{inventory,transaction,bom,lot,barcode}/{components,hooks,api,types}
mkdir -p src/hooks
mkdir -p src/lib/{supabase,utils}
mkdir -p src/types
mkdir -p src/stores

# 5. 基本ファイル作成
echo "📝 基本ファイルを作成中..."

# Supabase クライアント
cat > src/lib/supabase/client.ts << 'EOF'
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
EOF

cat > src/lib/supabase/server.ts << 'EOF'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component では無視
          }
        },
      },
    }
  )
}
EOF

# 型定義ベース
cat > src/types/index.ts << 'EOF'
// 共通型定義
export type ID = string

export interface BaseEntity {
  id: ID
  created_at: string
  updated_at?: string
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
EOF

# Feature index テンプレート
for feature in inventory transaction bom lot barcode; do
  cat > src/features/$feature/index.ts << EOF
// $feature feature exports
export * from './types'
// export * from './components'
// export * from './hooks'
// export * from './api'
EOF

  cat > src/features/$feature/types/index.ts << EOF
// $feature types
export interface ${feature^}Entity {
  id: string
  // TODO: Define fields
}
EOF
done

# 6. 環境変数テンプレート
cat > .env.local.example << 'EOF'
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
EOF

# 7. VSCode設定
mkdir -p .vscode
cat > .vscode/settings.json << 'EOF'
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
EOF

# 8. package.json にスクリプト追加
npm pkg set scripts.type-check="tsc --noEmit"
npm pkg set scripts.test="vitest"
npm pkg set scripts.test:ui="vitest --ui"
npm pkg set scripts.db:types="npx supabase gen types typescript --local > src/types/database.ts"

echo ""
echo "✅ セットアップ完了！"
echo ""
echo "次のステップ:"
echo "1. cd partstock"
echo "2. .env.local.example を .env.local にコピーして環境変数を設定"
echo "3. npm run dev で開発サーバーを起動"
echo ""
echo "📖 CLAUDE.md を読んで開発を進めてください"
