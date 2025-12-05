import { test, expect } from '@playwright/test'

test.describe('入出庫管理', () => {
  test.describe('取引履歴ページ', () => {
    test.skip('取引履歴一覧が表示される', async ({ page }) => {
      // Skip: requires authentication
      await page.goto('/transactions')

      await expect(page.getByRole('heading', { name: /取引|入出庫/ })).toBeVisible()
      await expect(page.getByRole('table')).toBeVisible()
    })

    test.skip('フィルターが機能する', async ({ page }) => {
      await page.goto('/transactions')

      // タイプフィルター
      const typeFilter = page.getByLabel(/タイプ/)
      await typeFilter.click()
      await page.getByRole('option', { name: /入庫/ }).click()

      await page.waitForTimeout(500)
      await expect(page.getByRole('table')).toBeVisible()
    })
  })

  test.describe('入出庫登録ページ', () => {
    test.skip('入出庫登録フォームが表示される', async ({ page }) => {
      await page.goto('/transactions/new')

      await expect(page.getByRole('heading', { name: /入出庫|登録/ })).toBeVisible()
      await expect(page.getByLabel(/タイプ|種別/)).toBeVisible()
      await expect(page.getByLabel(/部品|品目/)).toBeVisible()
      await expect(page.getByLabel(/数量/)).toBeVisible()
    })

    test.skip('入力バリデーションが機能する', async ({ page }) => {
      await page.goto('/transactions/new')

      // 空のまま送信
      await page.getByRole('button', { name: /登録|保存/ }).click()

      // エラーメッセージが表示される
      await expect(page.getByText(/必須|入力してください/)).toBeVisible()
    })
  })
})
