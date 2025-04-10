<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CheckIn extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'registration_id',
        'event_id',
        'checked_by_user_id',
        'checked_in_at',
        'notes',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'checked_in_at' => 'datetime',
    ];

    /**
     * モデル作成時にフックしてchecked_in_atを現在時刻に設定
     */
    protected static function booted()
    {
        static::creating(function ($checkIn) {
            $checkIn->checked_in_at = $checkIn->checked_in_at ?? now();
        });
    }

    /**
     * 関連する参加登録
     */
    public function registration(): BelongsTo
    {
        return $this->belongsTo(Registration::class);
    }

    /**
     * 関連するイベント
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * チェックインを行った管理者
     */
    public function checkedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'checked_by_user_id');
    }
}
