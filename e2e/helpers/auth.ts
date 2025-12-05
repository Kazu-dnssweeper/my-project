import { Page } from '@playwright/test'

/**
 * ログイン処理を行うヘルパー
 * テスト用のアカウントでログインする
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/login')

  await page.getByLabel(/メールアドレス/).fill(email)
  await page.getByLabel(/パスワード/).fill(password)
  await page.getByRole('button', { name: /ログイン/ }).click()

  // ダッシュボードに遷移するのを待つ
  await page.waitForURL(/dashboard/)
}

/**
 * ログアウト処理を行うヘルパー
 */
export async function logout(page: Page) {
  await page.getByRole('button', { name: /ユーザー|メニュー/ }).click()
  await page.getByRole('menuitem', { name: /ログアウト/ }).click()

  await page.waitForURL(/login/)
}

/**
 * 認証済み状態をセットアップするフィクスチャ
 * 実際のテストでは環境変数からテスト用認証情報を取得する
 */
export const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'testpassword123',
}
