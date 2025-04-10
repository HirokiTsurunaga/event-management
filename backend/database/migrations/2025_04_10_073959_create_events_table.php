<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // 作成者（管理者）
            $table->string('name'); // イベント名
            $table->text('description')->nullable(); // イベント説明
            $table->dateTime('start_date'); // 開始日時
            $table->dateTime('end_date'); // 終了日時
            $table->string('location'); // 開催場所
            $table->integer('capacity')->nullable(); // 定員
            $table->boolean('is_published')->default(false); // 公開状態
            $table->string('image_path')->nullable(); // イベント画像
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
