<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'name',
        'description',
        'start_date',
        'end_date',
        'location',
        'capacity',
        'is_published',
        'image_path',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'is_published' => 'boolean',
        'capacity' => 'integer',
    ];

    /**
     * イベントの作成者（管理者）
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * イベントの作成者（管理者）- creatorという名前でのエイリアス
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * イベントの参加登録一覧
     */
    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class);
    }

    /**
     * イベントのチェックイン記録一覧
     */
    public function checkIns(): HasMany
    {
        return $this->hasMany(CheckIn::class);
    }

    /**
     * イベントの参加者数を取得
     */
    public function getParticipantCountAttribute(): int
    {
        return $this->registrations()->where('status', 'confirmed')->count();
    }

    /**
     * イベントがキャパシティに達しているかどうか
     */
    public function isAtCapacity(): bool
    {
        if (!$this->capacity) {
            return false;
        }
        
        return $this->participant_count >= $this->capacity;
    }
}
