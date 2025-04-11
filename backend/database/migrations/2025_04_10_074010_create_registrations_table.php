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
        Schema::create('registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->onDelete('cascade'); // イベントID
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade'); // 参加者ID
            $table->foreignId('invited_by')->nullable()->constrained('users')->onDelete('set null');
            $table->string('invited_email')->nullable();
            $table->enum('status', ['pending', 'confirmed', 'cancelled'])->default('pending'); // 参加状態
            $table->text('comments')->nullable(); // 参加者コメント
            $table->timestamp('confirmed_at')->nullable(); // 確認日時
            $table->timestamp('cancelled_at')->nullable(); // キャンセル日時
            $table->string('registration_code', 8)->unique(); // 参加登録コード（QRコード用）
            $table->timestamps();

            // イベントと参加者の組み合わせはユニークであるべき
            $table->unique(['event_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('registrations');
    }
};
