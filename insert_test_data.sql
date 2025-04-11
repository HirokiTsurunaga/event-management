-- 管理者ユーザーの作成（存在しなければ）
INSERT INTO users (name, email, password, is_admin, created_at, updated_at)
SELECT '管理者', 'admin@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@example.com');

-- 一般ユーザーの作成（存在しなければ）
INSERT INTO users (name, email, password, is_admin, created_at, updated_at)
SELECT '一般ユーザー', 'user@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'user@example.com');

-- 既存のイベントをクリア
DELETE FROM events;

-- テストイベントの作成
INSERT INTO events (name, description, start_date, end_date, location, capacity, is_published, user_id, created_at, updated_at)
VALUES
('公開テストイベント1', 'これは誰でも見れる公開イベントです', DATE_ADD(NOW(), INTERVAL 10 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 10 DAY), INTERVAL 2 HOUR), '東京都渋谷区', 100, 1, (SELECT id FROM users WHERE email = 'admin@example.com'), NOW(), NOW()),
('公開テストイベント2', 'これは誰でも見れる公開イベントです', DATE_ADD(NOW(), INTERVAL 20 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 20 DAY), INTERVAL 3 HOUR), '大阪府大阪市', 50, 1, (SELECT id FROM users WHERE email = 'admin@example.com'), NOW(), NOW()),
('非公開テストイベント', 'これは管理者のみ見れる非公開イベントです', DATE_ADD(NOW(), INTERVAL 30 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 30 DAY), INTERVAL 4 HOUR), '福岡県福岡市', 30, 0, (SELECT id FROM users WHERE email = 'admin@example.com'), NOW(), NOW()); 