# 印刷リレー セットアップ引き継ぎメモ

このファイルは、別PC（フロント現地PC）のClaude Codeに作業を引き継ぐために書かれています。
このファイルを読んだら、以下の手順をこの現地PC上で進めてください。ユーザー（塚本清修さん）はITに詳しくないので、画面のどこを具体的にクリックするかまで明確に案内してください。コスト意識が高いので、有料プランや課金が発生しそうな操作をする前には必ず確認すること。

## 背景

ホテル甲子園の貸切サウナ・風呂・岩盤浴の予約Webアプリ。予約が入ったら、フロントのレシートプリンターに自動で印字したい。

- リポジトリ: https://github.com/tsukamotoseishu-ship-it/koushien-booking
- 本番サーバー: https://koushien-booking.onrender.com （Render、動作確認済み）
- プリンター: Star Micronics TSP143IIILAN。固定IP **172.16.20.10**（Subnet 255.255.0.0, Gateway 172.16.0.1）。
- **重要**: このプリンターはCloudPRNT非対応と判明（TSP100IVからの対応機能で、TSP100IIIは非対応）。そのため「プリンターがサーバーに問い合わせる」方式ではなく、「フロントPC上の常駐スクリプトがサーバーをポーリングしてWindows印刷する」方式に設計変更済み。

## このPC（フロントPC）でやること

### 1. リポジトリをclone（まだなら）

```
git clone https://github.com/tsukamotoseishu-ship-it/koushien-booking
```

認証が必要な場合は、ユーザーに確認すること（GitHubのPersonal Access Tokenが必要になる可能性あり）。

### 2. futurePRNTドライバをインストール

https://www.star-m.jp/tsp100iii-wsw.html からfuturePRNTをダウンロードしてインストール。

### 3. プリンターを追加

- 接続方法: LAN（ネットワーク）
- IPアドレス: 172.16.20.10
- 機種: TSP143III

### 4. Windowsに登録されたプリンターの正確な名前を確認

`Win+R` → `control printers` → Enter で確認。

### 5. print-relay/start.ps1 を編集

このリポジトリの `print-relay/start.ps1` を開き、以下を書き換える：

- `PRINT_RELAY_TOKEN` → 塚本さんに別途(LINEやメールなど、リポジトリに書かない経路で)問い合わせて教えてもらう値
- `PRINTER_NAME` → 手順4で確認した正確なプリンター名

### 6. Renderの環境変数を確認

Renderの環境変数設定は塚本さんが対応します(現地PC側では対応不要)。

### 7. 実行・テスト

`start.ps1` を右クリック →「PowerShellで実行」。ウィンドウが開いたままになる。

予約サイト（https://koushien-booking.onrender.com）でテスト予約を1件作成し、5〜10秒以内にウィンドウに `printing job #1...` のようなログが出て、プリンターから紙が出るか確認。

### 8. 自動起動設定

動作確認できたら、README.mdの「自動起動させる」の手順に従い、`start.ps1` のショートカットをスタートアップフォルダ（`Win+R` → `shell:startup`）に入れる。

## 詳細情報

同じフォルダの `print-relay/README.md` に詳しい手順あり。コードは `print-relay/relay.js`。サーバー側の受け口は `routes/print-relay.js`。

## 完了したら

元のセッション（塚本さんのメインPC上のClaude Code）に進捗を伝えてもらうよう、塚本さんに依頼すること。
