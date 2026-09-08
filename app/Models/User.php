<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;

#[Fillable([
    'uuid',
    'name',
    'first_name',
    'last_name',
    'email',
    'password',
    'role',
    'position',
    'commission_eligible',
    'commission_percent',
    'address',
    'profile_photo_path',
    'company_name',
    'company_logo_path',
    'company_registration_number',
    'company_tax_id',
    'social_media_info',
    'business_number',
    'business_official_email',
    'business_address',
    'company_address',
    'company_website',
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    public const ROLE_SUPER_ADMIN = 'super_admin';

    public const ROLE_CUSTOMER_REP = 'customer_rep';

    protected static function booted(): void
    {
        static::creating(function (self $user): void {
            if (! is_string($user->uuid) || trim($user->uuid) === '') {
                $user->uuid = (string) Str::uuid();
            }
        });
    }

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
            'commission_eligible' => 'boolean',
            'commission_percent' => 'decimal:2',
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

    /**
     * A human-readable job title for use in staff-signed customer communications
     * (e.g. apology emails), falling back to a label derived from the role.
     */
    public function signatureTitle(): string
    {
        $position = trim((string) $this->position);

        if ($position !== '') {
            return $position;
        }

        return match ($this->role) {
            self::ROLE_SUPER_ADMIN, 'admin' => 'Administrator',
            self::ROLE_CUSTOMER_REP, 'staff' => 'Customer Service Representative',
            default => 'Team Member',
        };
    }

    public function canManageSettings(): bool
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

    public function supportTickets(): HasMany
    {
        return $this->hasMany(SupportTicket::class);
    }

    public function invoiceCommissions(): HasMany
    {
        return $this->hasMany(InvoiceStaffCommission::class);
    }

    public function isCommissionEligible(): bool
    {
        return (bool) $this->commission_eligible && (float) $this->commission_percent > 0;
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    public function resolveRouteBinding($value, $field = null): ?self
    {
        if ($field !== null) {
            return parent::resolveRouteBinding($value, $field);
        }

        $lookup = trim((string) $value);
        if ($lookup === '') {
            return null;
        }

        return static::query()
            ->where('uuid', $lookup)
            ->orWhere('id', ctype_digit($lookup) ? (int) $lookup : -1)
            ->first();
    }
}
