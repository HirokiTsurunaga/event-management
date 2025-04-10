<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class Registration extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'event_id',
        'user_id',
        'status',
        'comments',
        'confirmed_at',
        'cancelled_at',
        'registration_code',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'confirmed_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    /**
     * モデル作成時にフックして登録コードを生成
     */
    protected static function booted()
    {
        static::creating(function ($registration) {
            $registration->registration_code = $registration->registration_code ?? Str::uuid();
        });
    }

    /**
     * 登録されたイベント
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * 参加登録したユーザー
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * チェックイン記録
     */
    public function checkIn(): HasOne
    {
        return $this->hasOne(CheckIn::class);
    }

    /**
     * チェックイン済みかどうか
     */
    public function isCheckedIn(): bool
    {
        return $this->checkIn()->exists();
    }

    /**
     * 参加登録が確認済みかどうか
     */
    public function isConfirmed(): bool
    {
        return $this->status === 'confirmed';
    }

    /**
     * 参加登録がキャンセル済みかどうか
     */
    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }
}
