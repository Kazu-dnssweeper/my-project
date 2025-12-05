import { test, expect } from '@playwright/test'

test.describe('バーコード機能', () => {
  test.describe('スキャンページ', () => {
    test.skip('スキャンページが表示される', async ({ page }) => {
      // Skip: requires authentication
      await page.goto('/scan')

      await expect(page.getByRole('heading', { name: /スキャン|バーコード/ })).toBeVisible()
    })

    test.skip('手入力フォールバックが機能する', async ({ page }) => {
      await page.goto('/scan')

      // 手入力ボタンをクリック
      await page.getByRole('button', { name: /手入力|手動/ }).click()

      // 入力フォームが表示される
      await expect(page.getByLabel(/バーコード|コード/)).toBeVisible()
    })
  })

  test.describe('ラベル生成', () => {
    test.skip('ラベル生成コンポーネントが表示される', async ({ page }) => {
      await page.goto('/scan')

      // ラベル生成タブ/ボタンをクリック
      await page.getByRole('button', { name: /ラベル|印刷/ }).click()

      await expect(page.getByLabel(/品番/)).toBeVisible()
      await expect(page.getByText(/サイズ/)).toBeVisible()
    })
  })
})

test.describe('レスポンシブデザイン', () => {
  test('モバイル表示でナビゲーションが機能する', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/login')

    // モバイルでもログインフォームが表示される
    await expect(page.getByRole('button', { name: /ログイン/ })).toBeVisible()
  })
})
