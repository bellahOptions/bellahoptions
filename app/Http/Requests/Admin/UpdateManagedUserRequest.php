<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateManagedUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return (bool) $this->user()?->isSuperAdmin();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var User|null $managedUser */
        $managedUser = $this->route('user');
        $managedUserId = $managedUser?->id ?? 0;

        return [
            'name' => ['nullable', 'string', 'max:255'],
            'first_name' => ['required_without:name', 'string', 'min:2', 'max:120', "regex:/^[a-zA-Z\\s\\-\\.'`]+$/"],
            'last_name' => ['required_without:name', 'string', 'min:2', 'max:120', "regex:/^[a-zA-Z\\s\\-\\.'`]+$/"],
            'email' => ['required', 'string', 'email:rfc', 'max:255', Rule::unique('users', 'email')->ignore($managedUserId)],
            'role' => ['required', 'string', Rule::in([
                User::ROLE_SUPER_ADMIN,
                User::ROLE_CUSTOMER_REP,
                'admin',
                'staff',
                'user',
            ])],
            'address' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
