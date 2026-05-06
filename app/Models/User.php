<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'first_name', 'last_name', 'email', 'password', 'role', 'address'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    public const ROLE_SUPER_ADMIN = 'super_admin';

    public const ROLE_CUSTOMER_REP = 'customer_rep';

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

    public function isStaff(): bool
    {
        return $this->canManageInvoices();
    }

    public function isSuperAdmin(): bool
    {
        return in_array($this->role, [self::ROLE_SUPER_ADMIN, 'admin'], true);
    }

    public function isCustomerRep(): bool
    {
        return in_array($this->role, [self::ROLE_CUSTOMER_REP, 'staff'], true);
    }

    public function canManageInvoices(): bool
    {
        return $this->isSuperAdmin() || $this->isCustomerRep();
    }

    public function canManageSettings(): bool
    {
        return $this->isSuperAdmin();
    }

    public function canManageSlides(): bool
    {
        return $this->isSuperAdmin();
    }

    public function canManagePublicContent(): bool
    {
        return $this->isSuperAdmin();
    }

    public function canManageUsers(): bool
    {
        return $this->isSuperAdmin();
    }

    public function canManageWaitlist(): bool
    {
        return $this->isSuperAdmin() || $this->isCustomerRep();
    }

    public function liveChatThreads(): HasMany
    {
        return $this->hasMany(LiveChatThread::class, 'customer_user_id');
    }

    public function assignedLiveChatThreads(): HasMany
    {
        return $this->hasMany(LiveChatThread::class, 'assigned_staff_id');
    }

    public function liveChatPresence(): HasOne
    {
        return $this->hasOne(LiveChatStaffPresence::class);
    }
}
