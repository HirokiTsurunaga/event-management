FROM php:8.2-fpm

# 必要なパッケージとPHP拡張をインストール
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libpq-dev

# PHPの拡張機能をインストール
RUN docker-php-ext-install pdo pdo_pgsql mbstring exif pcntl bcmath gd

# Composerのインストール
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 作業ディレクトリを設定
WORKDIR /var/www/html

# Laravelアプリケーションの起動コマンド
CMD php artisan serve --host=0.0.0.0 --port=8000 