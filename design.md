# 付箋コラボボード OSS（MVP）設計メモ

アプリ名：Gathercomb

> **結論（実装方針）**
> フロント：**React + Yjs（CRDT） + y-websocket + react-konva（Canvas）**
> サーバ：**Node.js（Express）＋ y-websocket サーバ**
> 永続化：**Postgres**
> 認証：**自前ログイン（Argon2id + セッションクッキー）** → 後続で OIDC（Google/GitHub）
> 同時接続：**1ボードあたり 10〜20 人想定**（スケール要件は軽め）
> オフライン：**y-indexeddb によるローカル持続＋再接続マージ**

---

## 1. 目的／非目的／成功基準

### 目的

* Miro/Figma 風の**同時編集付箋ボード**を OSS として公開。小規模チームが**単一 Docker**でセルフホスト可能。

### 非目的（MVP）

* 無制限ユーザの大規模スケール、SaaS運用、きめ細かい監査ログ、ボード内全文検索などは後回し。

### 成功基準（MVP受入）

* 10〜20名が同一ボードで**1秒以内の反映体感**。
* オフライン編集→再接続で**内容が自動整合**（CRDT）。
* 基本操作（作成/編集/移動/サイズ/色/削除/Undo/Redo/ズーム・パン/プレゼンス）が安定。
* Docker で起動し、**初回 5 分以内で動作確認**できる。

---

## 2. スコープ（MVP v0.1）

* 付箋モデル：`text / color / x / y / w / h / rotation / zIndex`
* 操作：作成、編集、移動、リサイズ、削除、複製、Undo/Redo
* 表示：キャンバス（パン・ズーム、選択枠、スナップ軽め）
* プレゼンス：ユーザ一覧、相手カーソル／選択枠
* ボード管理：作成、共有（リンク＋簡易ロール）
* 認証：メール＋パスワード（Argon2id）、セッションクッキー（HTTPOnly/SameSite=Lax）
* 永続化：

  * **Yjs 更新（binary update）**を**イベントログ**保存
  * 500 更新ごとに**スナップショット**
  * 誰が何を更新したかを**軽量に追跡**（Board単位）
* オフライン：y-indexeddb に保存、再接続でマージ
* デプロイ：DockerComponent（Node + Web + Postgres）

---

## 3. 非機能要件

* レイテンシ：同一ボード内で**95p < 150ms**（LAN/通常回線想定）
* 可用性：シングル構成（再起動で復元可能）。データは**スナップショット＋イベント**で復旧。
* セキュリティ：Argon2id、CSRFトークン、CORS制限、WSは認証必須。
* 監視（軽）：構成ログ、エラーログ、基本メトリクス（メモリ、接続数）。

---

## 4. 全体アーキテクチャ

```
[React (Vite)] --(WebSocket: y-websocket + awareness)--> [Node(y-websocket)]
        |                                         |
    y-indexeddb                              Postgres (event log + snapshots)
        |                                         |
       UI(Canvas: react-konva)                REST API (auth, boards, users)
```

* **CRDT**：Yjs（ドキュメント＝ボード）。付箋は `Y.Map` / `Y.Array`。本文は `Y.Text`。
* **同期**：`y-websocket`（部屋＝boardId）。Awareness でプレゼンス共有。
* **描画**：`react-konva`（Canvas）。軽量なスナップとガイドライン。
* **永続化**：サーバで Y 更新を受け取り**イベントログ**に追記。閾値で**スナップショット**（`Uint8Array`）を保存。
* **オフライン**：フロントは `y-indexeddb` でローカル保存。ネット復帰で自動マージ。
* **DockerCompose**：Node プロセス1つで REST + y-websocket + 静的配信。DB は Postgres

---

## 5. データモデル（サーバ／Postgres）

```sql
-- users
CREATE TABLE users (
  id            TEXT PRIMARY KEY,         -- uuid
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,            -- Argon2id
  display_name  TEXT NOT NULL,
  created_at    INTEGER NOT NULL
);

-- boards
CREATE TABLE boards (
  id           TEXT PRIMARY KEY,          -- uuid
  title        TEXT NOT NULL,
  owner_id     TEXT NOT NULL REFERENCES users(id),
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);

-- memberships (board-level RBAC)
CREATE TABLE memberships (
  user_id  TEXT NOT NULL REFERENCES users(id),
  board_id TEXT NOT NULL REFERENCES boards(id),
  role     TEXT NOT NULL CHECK(role IN ('owner','editor','viewer')),
  PRIMARY KEY (user_id, board_id)
);

-- y_events: Yjs incremental updates (binary)
CREATE TABLE y_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  board_id   TEXT NOT NULL REFERENCES boards(id),
  actor_id   TEXT NOT NULL REFERENCES users(id),
  ts         INTEGER NOT NULL,
  update_bin BLOB NOT NULL              -- Yjs update (Uint8Array)
);

-- y_snapshots: periodic snapshot of Y.Doc
CREATE TABLE y_snapshots (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  board_id   TEXT NOT NULL REFERENCES boards(id),
  ts         INTEGER NOT NULL,
  state_bin  BLOB NOT NULL              -- Yjs encodeStateAsUpdate doc
);

-- audit_light: optional, human-readable summary for "誰が何を"（後で活用）
CREATE TABLE audit_light (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  board_id   TEXT NOT NULL,
  actor_id   TEXT NOT NULL,
  ts         INTEGER NOT NULL,
  action     TEXT NOT NULL,             -- 'create_note' | 'update_note' | ...
  note_id    TEXT,                      -- CRDT上のキー（存在すれば）
  payload    TEXT                       -- JSON (delta summary)
);
```

> **注**：実体の「付箋」は Yjs 上のオブジェクト。RDB には**構造を複製せず**、Y のスナップショット＋イベントだけ保存します（整合性を一元化）。

---

## 6. 同期／Awareness／部屋

* **部屋名**：`board:{boardId}`
* **接続**：WS 接続時に**セッションクッキー → JWT 検証**、`boardId` への join 可否をサーバで判定。
* **Awareness**：`userId, displayName, color, cursor(x,y), selection(noteIds[])` を共有。
* **スロットリング**：移動・リサイズは 16ms〜33ms 程度でバッチ。
* **スナップショット戦略**：`N=500` 更新ごと、または `T=5分` 経過で作成（可変設定）。

---

## 7. 認証／認可

* **ログイン**：`/api/auth/login`（メール＋パスワード）。Argon2id でハッシュ化。
* **セッション**：HTTPOnly/SameSite=Lax クッキー、TTL 7日。CSRF トークンをヘッダ送信。
* **認可（MVP）**：`owner, editor, viewer` の**ボード単位ロール**。viewer は編集不可。
* **WS 認証**：クッキー or ベアラートークンで handshake。join 前に role チェック。
* **将来**：OIDC（Google/GitHub）で SSO。ロールは Membership で維持。

---

## 8. REST API（抜粋）

```
POST   /api/auth/login            { email, password } -> 200 Set-Cookie
POST   /api/auth/logout
GET    /api/me                    -> { id, email, displayName }

POST   /api/boards                -> { id, title }
GET    /api/boards                -> [ { id, title, ... } ]
GET    /api/boards/:id            -> { ... }
POST   /api/boards/:id/invite     { email, role }  // editor/viewer

GET    /api/boards/:id/snapshot   -> binary (最新スナップ)
GET    /api/boards/:id/export     -> JSON（後続 v0.2）
```

* WebSocket：`/ws`（`?room=board:{id}`）。プロトコルは y-websocket 既定。
* 管理系：ログ／接続数の簡易情報を `/api/admin/health`。

---

## 9. フロント設計（React）

* **Stack**：Vite + TS + React + react-konva + Zustand（UI 状態） + Yjs（CRDT)
* **構成**

  * `modules/yjs/`：doc, providers（y-websocket, y-indexeddb）, awareness
  * `components/canvas/`：BoardCanvas / Note / Selection / Guides
  * `hooks/`：useZoomPan, useHotkeys, useSnapping
  * `pages/`：Login / BoardList / Board
* **UI仕様（MVP）**

  * キーボード：`Del`削除、`Cmd/Ctrl + D`複製、`Cmd/Ctrl + Z/Y` Undo/Redo、`Shift`で多選択
  * ズーム：ホイール、パン：中ボタン or Space+ドラッグ
  * スナップ：10px グリッド（可視/非表示切替）

---

## 10. デプロイ／運用

### Docker（DockerCompose使用）

* Node で API + y-websocket + 静的配信（`/public`）。
* DB は Postgres

```dockerfile
# Dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build   # フロントを /app/dist に出力

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/package*.json ./
RUN npm ci --only=production
VOLUME ["/app/data"]
EXPOSE 8080
CMD ["node", "server/index.js"]
```

**環境変数**

* `PORT=8080`
* `SESSION_SECRET=...`
* `ALLOWED_ORIGINS=https://your.domain`
* `SNAPSHOT_INTERVAL=500` / `SNAPSHOT_PERIOD_SEC=300`

※必要なら適宜追加してください。

---

## 11. ログ／監視（軽量）

* Pino で JSON ログ。
* `/api/admin/health`：`{ uptime, wsConnections, boardsOpen }`。
* 例外時：スタックトレース＋boardId 付きで出力。

---

## 12. テスト方針

* **ユニット**：Yjs 操作のラッパ、RBAC、認証。
* **E2E（Playwright）**：2クライアントで同時編集→反映検証、オフライン→復帰。
* **負荷（k6）**：20接続・移動/編集を 5 分。
* **回帰**：スナップショット復元→イベント再生で最終状態一致。

---

## 13. ロードマップ

* **v0.1（MVP）**：本ドキュメント範囲
* **v0.2**：コメント、テンプレート、ボード書き出し/読み込み(JSON)、ボード履歴タイムライン
* **v0.3**：OIDC（Google/GitHub）SSO、ロール拡張（ゲストリンク）、簡易監査（`audit_light`活用）
* **v0.4**：Postgres 対応、Redis Pub/Sub（将来の水平分散準備）




--------




# 付箋コラボ・オンラインボード OSS（MVP）設計メモ

## 0. スコープと前提

* **想定同時接続**: 1ボードあたり最大10名（稀に20名まで）
* **オフライン要件**: あり（復帰時の自動マージ必須）
* **運用形態**: **Dockerコンテナ**でセルフホスト
* **商用化**: なし（OSS継続運用）
* **認証**: 当初は自前DBのユーザー管理 → 後続でSSO対応
* **UI 方針**: ズーム・パンを伴うキャンバス操作（自由配置の付箋）

---

## 1. 要件定義

### 1.1 機能要件（MVP）

* ボード管理

  * ボード作成/一覧/削除
  * 参加者（owner/editor/viewer）のロール管理
* 付箋（Sticky）

  * 追加/編集（テキスト・色）/移動/サイズ変更/削除
  * Undo/Redo（ローカル・セッション内で自然に）
* 同期・共同編集

  * リアルタイム反映（~100ms台目安）
  * カーソル/選択枠のプレゼンス表示
* オフライン

  * オフライン編集 → 復帰時に**自動マージ（CRDT）**
  * ページ再読み込みでもローカルキャッシュから即時復元
* 認証

  * メール＋パスワードの自前ログイン/ログアウト
  * JWT（HTTP-only Cookie または Authorization Bearer）
* 永続化

  * ボード状態のスナップショット＋差分ログ保存
  * 最低限の**操作追跡（誰が・いつ・何を）**（優先度：低）

### 1.2 非機能要件

* パフォーマンス

  * 10名同時編集で体感ストレスなし（1操作→他端末反映 ≤ 200ms 目標）
  * 初回ロード（既存ボード）≤ 2s（サーバサイドでスナップショット提供）
* 可用性

  * 単一プロセス運用前提、コンテナ再起動で自動復旧
* セキュリティ

  * パスワードは Argon2id（代替: bcrypt）
  * CSRF対策（Cookie運用時）、CORS制御、レートリミット
* 運用

  * .env による設定、構成は **Docker Compose 1ファイル**で完結
  * ログはJSON構造化、健康監視（/healthz）

---

## 2. 技術スタック & バージョン指針

* **フロント**: React 18 / Vite / TypeScript / Zustand or Jotai

  * Canvas/ズーム: Konva.js もしくは DOM+CSS Transform で開始し、必要に応じて移行
  * CRDT: **Yjs**（`yjs`, `y-protocols/awareness`, `y-indexeddb`）
* **同期サーバ**: **y-websocket** を Node.js（TypeScript）に組み込み拡張

  * 認証フック・権限チェック・スナップショットI/Oを追加
* **API サーバ**: 同一 Node/Express（REST + JWT発行）
* **DB**: PostgreSQL 16（永続化は後述の2層方式）
* **ストレージ**: ローカル Volume（本番は外部永続ディスク）
* **テスト**: Vitest/Jest、Playwright（E2E）
* **Lint/Format**: ESLint, Prettier
* **ライセンス**: Apache-2.0（MITでも可）

---

## 3. アーキテクチャ

```
[React + Yjs + Awareness]
   |  WebSocket (JWT付き, boardId)
   v
[Node/Express]
  ├─ REST: /auth /boards /invites /snapshot
  ├─ WS: y-websocket (拡張版)
  └─ Persistence Adapter
        ├─ Postgres: y_updates (差分), y_snapshots (圧縮状態)
        └─ Audit（低優先度→後で）
```

### 3.1 データモデル（初期版）

* users

  * id (uuid), email (unique), password_hash, display_name, created_at
* boards

  * id (uuid), title, owner_id (uuid), created_at, updated_at
* board_members

  * board_id, user_id, role(enum: owner/editor/viewer), added_at
* y_updates

  * id (bigserial), board_id, created_at, **update_bytes (bytea)**, **client_id (text)**
* y_snapshots

  * board_id (pk), **snapshot_bytes (bytea)**, **state_vector (bytea)**, updated_at
* audit_events（後続）

  * id, board_id, user_id, action(enum), target_id, metadata(jsonb), created_at

> **方針**: Yjs の**状態スナップショット**を定期保存（例：100更新ごと）。ロード時は snapshot + 以降の updates を適用。クライアントからは `y-indexeddb` によりローカル復元。

### 3.2 ボード内のYjs構造（例）

* `doc.getMap('board')`

  * `stickies`: Y.Map<id, Y.Map>

    * sticky: `{ text: Y.Text, color: string, x: number, y: number, w: number, h: number, rot: number, z: number, createdBy: userId }`
  * `layers`: Y.Array<id>（描画順）
  * `meta`: Y.Map（title, background, grid, etc.）

### 3.3 プレゼンス

* `awareness` に `userId`, `name`, `color`, `cursor`（x,y,tool）を格納
* 退室/タイムアウトはサーバ側で適切にクリーンアップ

---

## 4. API & WebSocket 仕様（MVP）

### 4.1 REST（サンプル）

* `POST /auth/signup` `{ email, password, displayName }` → 201
* `POST /auth/login` `{ email, password }` → `{ token }`（JWT、期限12h）
* `GET /me` → ユーザ情報
* `GET /boards` / `POST /boards` / `DELETE /boards/:id`
* `POST /boards/:id/members` `{ userId, role }`
* `GET /boards/:id/snapshot` → `application/octet-stream`（snapshot_bytes）

> **認可**: owner/editor/viewer をボード単位で判定。viewer は読み取りのみ。

### 4.2 WebSocket（y-websocket拡張）

* 接続URL例: `wss://host/ws?doc=board:<boardId>`
* **JWT必須**（クエリ or Header）→ サーバで board 権限チェック
* 受信イベント: y-websocket 既定の Update/Sync/awareness を使用
* サーバ側フック

  * Update受信ごとに `y_updates` へ追記
  * N回ごとに `y_snapshots` を再生成（圧縮/compact）
  * `state_vector` を保存し、差分発行を最小化

---

## 5. オフライン・復旧ポリシ

* クライアント：`y-indexeddb` を必須にして、**再読み込み時は即時復元**
* ネット切断時：ローカル操作はYjsが蓄積 → 再接続で差分同期
* 競合：CRDTに依拠（Yjs）
* 破損対策：

  * サーバは定期スナップショット（例：5分/100更新）
  * 「ボードを指定時点へ復元」機能は**後続**（スナップショット+リプレイで可能）

---

## 6. デプロイ／運用

### 6.1 Docker方針

* **1 コンテナ**に以下を同梱

  * Node/Express（REST+y-websocket）
  * ビルド済み React 静的ファイル（`/public` 提供）
* DB は外部 Postgres を推奨（小規模なら同じ Compose 内でも可）

### 6.2 Docker Compose（構成方針）

* `app`（Node 20＋alpine）
* `db`（postgres:16-alpine, volume）
* 環境変数（例）

  * `JWT_SECRET`, `DATABASE_URL`, `PORT`, `NODE_ENV`
  * `SNAPSHOT_INTERVAL=100`, `SNAPSHOT_SECONDS=300`

### 6.3 ロギング/監視

* app: 構造化JSONログ（level, msg, reqId, userId, boardId）
* `/healthz`（DBアクセス軽量チェック）

---

## 7. セキュリティ設計（MVP段階）

* パスワード: Argon2id（bcrypt可）＋ ソルト
* JWT: HS256（後続でROTATION/失効リスト）
* CORS/CSRF:

  * Cookie運用時はCSRFトークン（Double Submit）
  * SPA＋BearerならCORS適正化のみ
* レート制限: `/auth/*` にIPベース制限
* 入力検証: zod / class-validator

---

## 8. 監査・履歴（優先度 低 → 後続でON）

* **軽量イベント**をクライアントからRESTで送る方式で開始

  * 例: `POST /audit` `{ action: 'sticky.update', boardId, stickyId, fields: ['x','y'], ts }`
* 将来的には**サーバ側で Yjs 更新を解釈して高粒度化**（変換コストは後回し）

---

## 9. 受け入れ基準（MVP Done条件）

1. 10名同時編集で、移動/編集の反映遅延が中央値≤200ms
2. オフライン→復帰でコンフリクトによる消失なし
3. ブラウザ再読み込み後、2秒以内に直前状態が視覚的に復元
4. 自前認証でログイン→ボード作成→招待→共同編集が通る
5. ボード状態がDBにスナップショット/差分として保存される

---




# WBS（MVP：React + Yjs + y-websocket + Node/Express + PostgreSQL／Docker）

> 想定：最大同時接続10〜20名、オフライン復帰あり、自前認証→後続SSO、キャンバスUI、Docker運用
> 工期目安：**4週間（平行作業可）**／各タスクはFE/BE/INF(Infra)/QAを併記

## M0. プロジェクト初期化（Week 0）

* **0.1 リポジトリ/モノレポ整備**（INF）

  * pnpmワークスペース `apps/web`, `apps/server` 作成
  * ESLint/Prettier/Vitest 共通設定
* **0.2 CI/品質ゲート**（INF）

  * GitHub Actions：Lint/TypeCheck/Unit/E2E スケルトン
  * ブランチ保護・PRテンプレ
* **0.3 Docker/Compose雛形**（INF）

  * Node(20-alpine) マルチステージ、Postgres(16-alpine)
  * `.env.example` と起動手順
* **0.4 技術決定の固定**（TL）

  * ライブラリ最終版：Yjs, y-websocket, y-indexeddb, Zustand/Jotai, Konva.js
  * ライセンス表記（Apache-2.0）・NOTICE

**成果物**：起動可能な空プロジェクト、CIが緑、`docker-compose up`で空白画面表示
**受入基準**：CI通過、`/healthz` 200（ダミー）

---

## M1. リアルタイム協調の骨格（Week 1）

* **1.1 Yjsドキュメント設計/スキーマ**（FE）

  * `board` Map、`stickies` Map、`layers` Array、`meta`
  * sticky要素：text(Y.Text), color, x,y,w,h,rot,z,createdBy
* **1.2 y-websocket 接続 & Awareness**（FE/BE）

  * `wss:/ws?doc=board:<boardId>` に接続
  * Awareness：userId, name, color, cursor
* **1.3 キャンバスUI 基本**（FE）

  * ズーム/パン、付箋の作成/移動/サイズ変更/削除
  * 他ユーザの選択枠/カーソル表示
* **1.4 ローカル永続化（オフライン前提）**（FE）

  * `y-indexeddb` による即時復元
* **1.5 最小API（Boards）**（BE）

  * `POST /boards`, `GET /boards`, `GET /boards/:id`（メモリ or 仮DB）

**成果物**：複数ブラウザ間で付箋がリアルタイム同期・プレゼンス可
**受入基準**：2クライアント間で操作反映中央値 ≤ 200ms、再読込で状態復元

---

## M2. 認証・認可・WSガード（Week 2）

* **2.1 自前認証（メール＋PW）**（BE）

  * `POST /auth/signup`, `POST /auth/login`（Argon2id, JWT発行）
  * `GET /me`（ユーザ取得）
* **2.2 RBAC（board単位）**（BE）

  * roles: owner/editor/viewer、`POST /boards/:id/members`
  * RESTに認可ミドルウェア導入
* **2.3 WebSocket 認証統合**（BE）

  * 接続時JWT検証→board権限チェック
  * 不正/失効時クローズ
* **2.4 フロント統合**（FE）

  * ログイン/ログアウトUI、ボード一覧→入室
  * 役割に応じてUI操作制限（viewerは編集不可）

**成果物**：ログイン済みユーザのみWS接続可、役割別で操作制御
**受入基準**：未認証WS拒否、viewerで編集不可をE2Eで確認

---

## M3. 永続化（Postgres）とスナップショット（Week 3）

* **3.1 DBスキーマ実装**（BE/INF）

  * `users`, `boards`, `board_members`
  * `y_updates`(update_bytes, client_id, created_at)
  * `y_snapshots`(snapshot_bytes, state_vector, updated_at)
* **3.2 永続化アダプタ**（BE）

  * Update受信→`y_updates`追記
  * N回毎（例:100）にDocをcompact→`y_snapshots`保存
  * 初回ロード：`snapshot + 未適用updates`で復元REST
* **3.3 性能/復元チューニング**（BE/FE）

  * スナップショット間隔/TTL調整
  * ロード2秒以内の計測と最適化（必要ならgzip）
* **3.4 ログ/監視**（INF）

  * 構造化JSONログ、`/healthz` DBチェック実装

**成果物**：DBに差分/スナップショット保存、サーバ再起動後も状態復元
**受入基準**：既存ボードロード≤2s、10名同時でも保存遅延なし

---

## M4. 仕上げ・受け入れ・ドキュメント（Week 4）

* **4.1 Undo/Redo & 基本UX磨き**（FE）

  * 付箋色/テキスト編集、Z順、複数選択の快適化
* **4.2 軽量“誰が何を”イベント（任意）**（BE）

  * `POST /audit`（低粒度：action, fields, ts）※後続で高度化可
* **4.3 E2Eテスト整備**（QA/FE/BE）

  * 多クライアント操作反映、オフライン→復帰、権限
* **4.4 Dockerパッケージング**（INF）

  * Nginx/Caddyで静的配信＋WSリバプロ
  * Composeでapp+db起動、README整備
* **4.5 リリースタグ v0.1.0**（TL）

  * CHANGELOG、LICENSE/NOTICE、セットアップ手順

**成果物**：MVP出荷物（Dockerで稼働、README完備）
**受入基準**：MVP Done条件を満たす（オフライン復帰、反映遅延、認証/権限、永続化）

---

## クロスカット（全期間並行）

* **C.1 セキュリティ**：Argon2id設定、CORS、レート制限(`/auth/*`)
* **C.2 品質**：Unit/Integration/E2E の継続整備、カバレッジ計測
* **C.3 ドキュメント**：API仕様、アーキ図、運用手順の継続更新

---

## 依存関係（概要）

* M0 → M1（基盤がないとリアルタイム実装不可）
* M1 → M2（UI/WSの土台があって認可統合）
* M2 → M3（認証済みで保存戦略を実装）
* M3 → M4（性能/復元担保して仕上げ）

---
