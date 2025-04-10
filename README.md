# イベント管理システム

## プロジェクト概要

イベント管理SaaSは、イベント主催者（管理者）がイベントの作成、参加者の管理、入場管理、アンケート作成・集計を一貫して行えるシステムです。

### 開発技術スタック
- **フロントエンド**: React + TypeScript
- **バックエンド**: PHP + Laravel
- **データベース**: PostgreSQL
- **開発・デプロイ環境**: Docker, Docker Compose

## 開発環境セットアップ

### 必要条件
- Docker と Docker Compose がインストールされていること

### セットアップ手順

1. リポジトリをクローン
```
git clone <リポジトリURL>
cd event-management
```

2. Docker環境を起動
```
docker-compose up -d
```

3. バックエンド（Laravel）のセットアップ
```
docker-compose exec backend composer install
docker-compose exec backend php artisan key:generate
docker-compose exec backend php artisan migrate
```

4. フロントエンド（React）のセットアップ
```
docker-compose exec frontend npm install
```

5. アプリケーションにアクセス
   - フロントエンド: http://localhost:3000
   - バックエンドAPI: http://localhost:8000/api

## MVPの機能
- 基本認証システム（管理者・参加者）
- イベント管理（基本機能）
- 参加申し込み
- 入場管理（QRコード）
- アンケート機能（基本）

## 開発体制
- MVPを優先的に開発
- 機能追加は段階的に実施 