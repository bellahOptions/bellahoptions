<?php

namespace App\Models;

use App\Observers\InvoiceObserver;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

#[ObservedBy(InvoiceObserver::class)]
#[Fillable([
    'uuid',
    'invoice_number',
    'customer_id',
    'customer_name',
    'customer_email',
    'customer_occupation',
    'title',
    'description',
    'amount',
    'currency',
    'due_date',
    'status',
    'issued_at',
    'paid_at',
    'payment_reference',
    'automatic_reminders_sent',
    'last_automatic_reminder_sent_at',
    'last_manual_reminder_sent_at',
    'created_by',
])]
class Invoice extends Model
{
    use HasFactory;

    protected static function booted(): void
    {
        static::creating(function (self $invoice): void {
            if (! is_string($invoice->uuid) || trim($invoice->uuid) === '') {
                $invoice->uuid = (string) Str::uuid();
            }
        });
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'issued_at' => 'datetime',
            'paid_at' => 'datetime',
            'last_automatic_reminder_sent_at' => 'datetime',
            'last_manual_reminder_sent_at' => 'datetime',
            'amount' => 'decimal:2',
        ];
    }

    /**
     * Invoices are looked up by their opaque uuid in routes rather than their
     * sequential id, so staff can't enumerate invoices by guessing numbers.
     */
    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function serviceOrder(): HasOne
    {
        return $this->hasOne(ServiceOrder::class, 'invoice_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class)->orderBy('sort_order');
    }

    public function incomeSplit(): HasOne
    {
        return $this->hasOne(IncomeSplit::class);
    }

    public function staffCommissions(): HasMany
    {
        return $this->hasMany(InvoiceStaffCommission::class);
    }
}
