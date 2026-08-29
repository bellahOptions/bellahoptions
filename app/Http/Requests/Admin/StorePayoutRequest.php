<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePayoutRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return (bool) $this->user()?->isSuperAdmin();
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'payee_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'payee_name' => ['required_without:payee_user_id', 'string', 'max:160'],
            'payee_email' => ['nullable', 'string', 'email:rfc', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:999999999.99'],
            'currency' => ['required', 'string', Rule::in(['NGN', 'USD', 'EUR', 'GBP'])],
            'purpose' => ['required', 'string', 'max:255'],
            'service_order_id' => ['nullable', 'integer', 'exists:service_orders,id'],
        ];
    }
}
