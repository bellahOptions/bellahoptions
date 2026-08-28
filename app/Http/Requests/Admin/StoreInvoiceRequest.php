<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

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
            'currency' => ['required', 'string', Rule::in(['NGN', 'USD', 'EUR', 'GBP'])],
            'due_date' => ['nullable', 'date', 'after_or_equal:today'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.description' => ['required', 'string', 'min:2', 'max:255'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:100000'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0', 'max:999999999.99'],
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
            'items.required' => 'Add at least one line item.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $items = (array) $this->input('items', []);
            $total = array_reduce(
                $items,
                fn (float $carry, mixed $item): float => $carry + ((float) ($item['quantity'] ?? 0) * (float) ($item['unit_price'] ?? 0)),
                0.0,
            );

            if ($total < 1) {
                $validator->errors()->add('items', 'The invoice total must be at least 1.');
            }
        });
    }
}
