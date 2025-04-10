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
        Schema::create('check_ins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->constrained()->onDelete('cascade'); // 参加登録ID
            $table->foreignId('event_id')->constrained()->onDelete('cascade'); // イベントID
            $table->foreignId('checked_by_user_id')->constrained('users')->onDelete('cascade'); // チェックインした管理者
            $table->timestamp('checked_in_at'); // チェックイン時間
            $table->text('notes')->nullable(); // 備考
            $table->timestamps();

            // 参加登録IDは一意であるべき（1つの登録に対して1回のチェックインのみ）
            $table->unique('registration_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('check_ins');
    }
};
