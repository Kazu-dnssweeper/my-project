import { test, expect } from '@playwright/test'

test.describe('認証', () => {
  test('ログインページが表示される', async ({ page }) => {
    await page.goto('/login')

    await expect(page).toHaveTitle(/PartStock/)
    await expect(page.getByRole('heading', { name: /ログイン/ })).toBeVisible()
    await expect(page.getByLabel(/メールアドレス/)).toBeVisible()
    await expect(page.getByLabel(/パスワード/)).toBeVisible()
    await expect(page.getByRole('button', { name: /ログイン/ })).toBeVisible()
  })

  test('登録ページが表示される', async ({ page }) => {
    await page.goto('/register')

    await expect(page.getByRole('heading', { name: /アカウント作成|登録/ })).toBeVisible()
    await expect(page.getByLabel(/メールアドレス/)).toBeVisible()
    await expect(page.getByLabel(/パスワード/)).toBeVisible()
  })

  test('パスワードリセットページが表示される', async ({ page }) => {
    await page.goto('/forgot-password')

    await expect(page.getByRole('heading', { name: /パスワード.*リセット|パスワードをお忘れ/ })).toBeVisible()
  })

  test('未認証ユーザーはダッシュボードにアクセスできない', async ({ page }) => {
    await page.goto('/dashboard')

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/login/)
  })
})
