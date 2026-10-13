# koushien-booking

ホテル甲子園 貸切湯（サウナ・露天風呂・岩盤浴）予約アプリ。予約完了時に、フロントの Star TSP143IIILAN レシートプリンターへ CloudPRNT 経由で自動印字する。

## 構成

- `server.js` - Express アプリのエントリーポイント
- `config.js` - 施設一覧・部屋番号・時間枠（**ここを編集すれば設定変更できる**）
- `db.js` - PostgreSQL 接続とスキーマ初期化
- `receipt.js` - レシート本文の組み立て
- `routes/reservations.js` - 予約API（`/api/config`, `/api/availability`, `/api/reservations`）
- `routes/cloudprnt.js` - Star CloudPRNT エンドポイント（`/cloudprnt`）
- `public/index.html` - お客様向け予約画面（部屋選択→施設×時間枠グリッド）

## ローカルで動かす

```bash
npm install
DATABASE_URL=postgres://user:pass@localhost:5432/koushien npm start
```

## Renderへのデプロイ

1. このリポジトリをGitHubにpush
2. Renderで「New +」→「Blueprint」からこのリポジトリを選択（`render.yaml` を自動検出、WebサービスとPostgresが同時に作成される）
3. デプロイ完了後、発行されたURL（例: `https://koushien-booking.onrender.com`）を控える

## プリンター側の設定（Star TSP143IIILAN）

1. プリンターのIPアドレスにブラウザでアクセスし、設定画面を開く（背面ラベルのQRのマニュアル参照）
2. CloudPRNT設定で以下を登録:
   - Server URL: `https://<Renderで発行されたURL>/cloudprnt`
   - Method/Protocol: HTTP (CloudPRNT Version HTTP)
3. プリンターがインターネットに出られるネットワークに接続されていることを確認

## QRコードの作り方

各部屋のQRは、上記URLの末尾に `#部屋番号` を付けるだけ（クエリ文字列ではなく `#` のハッシュ部分）。

```
https://koushien-booking.onrender.com/#203
```

これで203号室のお客様がQRを読み取ると、部屋選択をスキップして直接予約画面が開く。

## 未確定・要確認事項

- `config.js` の施設名・定員はプレースホルダー。正式名称が決まり次第差し替える
- 現状は認証なし（部屋番号の自己申告のみ）。不特定多数が同じQRを使い回せる環境なら、フロントでのチェックイン時にのみQRを渡す運用等で補う
