<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
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
}
