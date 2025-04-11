<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'organization',
        'phone',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * 'role'属性のミューテーター
     * 'user'の値を'participant'に自動変換する
     */
    public function setRoleAttribute($value)
    {
        $this->attributes['role'] = $value === 'user' ? 'participant' : $value;
    }

    /**
     * ユーザーが作成したイベント（管理者の場合）
     */
    public function events(): HasMany
    {
        return $this->hasMany(Event::class);
    }

    /**
     * ユーザーのイベント参加登録情報
     */
    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class);
    }

    /**
     * ユーザーが行ったチェックイン操作（管理者の場合）
     */
    public function checkIns(): HasMany
    {
        return $this->hasMany(CheckIn::class, 'checked_by_user_id');
    }

    /**
     * ユーザーが管理者かどうか
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }
}
