<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInvoiceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return (bool) $this->user()?->canManageInvoices();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'customer_name' => ['required_without:customer_id', 'string', 'min:2', 'max:120', "regex:/^[a-zA-Z\\s\\-\\.'`]+$/"],
            'customer_email' => ['required_without:customer_id', 'string', 'email:rfc', 'max:255'],
            'customer_occupation' => ['nullable', 'string', Rule::in(config('occupations.list', []))],
            'title' => ['required', 'string', 'min:3', 'max:180'],
            'description' => ['nullable', 'string', 'max:2500'],
            'amount' => ['required', 'numeric', 'min:1', 'max:999999999.99'],
            'currency' => ['required', 'string', Rule::in(['NGN', 'USD', 'EUR', 'GBP'])],
            'due_date' => ['nullable', 'date', 'after_or_equal:today'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'customer_occupation.in' => 'Please choose a valid occupation from the provided list.',
            'customer_name.regex' => 'Please enter a valid customer name.',
        ];
    }
}
