<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Input for Paystack account-name resolution.
 *
 * The values are passed straight to the Paystack API, so both are constrained to
 * the shapes Paystack accepts: a NUBAN-style digit string and a numeric bank
 * code. Rejecting anything else here keeps arbitrary text out of the upstream
 * request.
 */
class ResolveBankAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->canManageSettings();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'account_number' => ['required', 'string', 'digits_between:6,34'],
            'bank_code' => ['required', 'string', 'digits_between:2,10'],
        ];
    }
}
