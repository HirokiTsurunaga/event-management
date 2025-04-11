-- 管理者ユーザーの作成（存在しなければ）
INSERT INTO users (name, email, password, role, created_at, updated_at)
SELECT '管理者', 'admin@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@example.com');

-- 一般ユーザーの作成（存在しなければ）
INSERT INTO users (name, email, password, role, created_at, updated_at)
SELECT '一般ユーザー', 'user@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'participant', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'user@example.com');

-- 既存のイベントをクリア
DELETE FROM events;

-- テストイベントの作成
INSERT INTO events (name, description, start_date, end_date, location, capacity, is_published, user_id, created_at, updated_at)
SELECT
  '公開テストイベント1',
  'これは誰でも見れる公開イベントです',
  NOW() + INTERVAL '10 day',
  NOW() + INTERVAL '10 day 2 hour',
  '東京都渋谷区',
  100,
  true,
  id,
  NOW(),
  NOW()
FROM users WHERE email = 'admin@example.com';

INSERT INTO events (name, description, start_date, end_date, location, capacity, is_published, user_id, created_at, updated_at)
SELECT
  '公開テストイベント2',
  'これは誰でも見れる公開イベントです',
  NOW() + INTERVAL '20 day',
  NOW() + INTERVAL '20 day 3 hour',
  '大阪府大阪市',
  50,
  true,
  id,
  NOW(),
  NOW()
FROM users WHERE email = 'admin@example.com';

INSERT INTO events (name, description, start_date, end_date, location, capacity, is_published, user_id, created_at, updated_at)
SELECT
  '非公開テストイベント',
  'これは管理者のみ見れる非公開イベントです',
  NOW() + INTERVAL '30 day',
  NOW() + INTERVAL '30 day 4 hour',
  '福岡県福岡市',
  30,
  false,
  id,
  NOW(),
  NOW()
FROM users WHERE email = 'admin@example.com'; 