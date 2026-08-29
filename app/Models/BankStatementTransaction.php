<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'bank_statement_import_id',
    'transaction_date',
    'value_date',
    'channel',
    'description',
    'amount',
    'type',
    'running_balance',
    'needs_review',
    'suggested_category',
    'status',
    'expense_id',
    'other_income_id',
    'raw_text',
])]
class BankStatementTransaction extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';

    public const STATUS_CONVERTED = 'converted';

    public const STATUS_IGNORED = 'ignored';

    public const TYPE_INCOME = 'income';

    public const TYPE_EXPENSE = 'expense';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'transaction_date' => 'date',
            'value_date' => 'date',
            'amount' => 'decimal:2',
            'running_balance' => 'decimal:2',
            'needs_review' => 'boolean',
        ];
    }

    public function import(): BelongsTo
    {
        return $this->belongsTo(BankStatementImport::class, 'bank_statement_import_id');
    }

    public function expense(): BelongsTo
    {
        return $this->belongsTo(Expense::class);
    }

    public function otherIncome(): BelongsTo
    {
        return $this->belongsTo(OtherIncome::class);
    }
}
