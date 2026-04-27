<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreServiceOrderUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->isStaff() === true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', 'string', Rule::in([
                'awaiting_payment',
                'queued',
                'in_progress',
                'in_review',
                'completed',
                'cancelled',
            ])],
            'progress_percent' => ['required', 'integer', 'min:0', 'max:100'],
            'note' => ['nullable', 'string', 'max:1500'],
            'is_public' => ['nullable', 'boolean'],
        ];
    }
}
