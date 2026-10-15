# ShiftFit

大学の時間割と収入目標から、アルバイトのシフト案を提案するWebアプリです。

## 主な機能

- 時間割・職場（時給・勤務可能時間）・月の収入目標の登録
- AI（Claude）による複数のシフトパターン提案と比較
- 給与見込みの計算、CSVエクスポート
- グループでのシフト共有ボード

入力データはブラウザの localStorage に保存されます。

## 技術スタック

Next.js 16（App Router） / React 19 / TypeScript / Tailwind CSS 4 / Anthropic SDK / Vitest

## セットアップ

```bash
npm ci
cp .env.example .env.local   # ANTHROPIC_API_KEY を設定
npm run dev
```

## スクリプト

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 本番ビルド |
| `npm test` | テスト実行（Vitest） |
| `npm run lint` | ESLint |
| `npm run typecheck` | 型チェック |
