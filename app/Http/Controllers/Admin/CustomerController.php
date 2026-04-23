<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCustomerRequest;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CustomerController extends Controller
{
    public function store(StoreCustomerRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $fullName = trim("{$data['first_name']} {$data['last_name']}");

        $customer = Customer::create([
            'name' => $fullName,
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'email' => strtolower($data['email']),
            'occupation' => $data['occupation'] ?? null,
            'phone' => $data['phone'] ?? null,
            'company' => $data['company'] ?? null,
            'address' => $data['address'] ?? null,
            'notes' => $data['notes'] ?? null,
            'created_by' => $request->user()->id,
        ]);

        return back()->with('success', "Customer {$fullName} was saved for future invoices.");
    }

    public function search(Request $request): JsonResponse
    {
        abort_unless((bool) $request->user()?->canManageInvoices(), 403);

        $validated = $request->validate([
            'query' => ['required', 'string', 'min:2', 'max:120'],
        ]);

        $term = trim((string) $validated['query']);
        $like = '%'.$term.'%';

        $customerResults = Customer::query()
            ->where(function ($query) use ($like): void {
                $query
                    ->where('name', 'like', $like)
                    ->orWhere('email', 'like', $like)
                    ->orWhere('first_name', 'like', $like)
                    ->orWhere('last_name', 'like', $like);
            })
            ->latest('id')
            ->limit(15)
            ->get()
            ->map(fn (Customer $customer): array => [
                'source' => 'customer',
                'customer_id' => $customer->id,
                'name' => $customer->name,
                'first_name' => $customer->first_name,
                'last_name' => $customer->last_name,
                'email' => strtolower((string) $customer->email),
                'occupation' => $customer->occupation,
                'phone' => $customer->phone,
                'company' => $customer->company,
                'address' => $customer->address,
                'display_name' => $this->buildDisplayName(
                    $customer->first_name,
                    $customer->last_name,
                    $customer->name,
                    $customer->email,
                ),
            ]);

        $userResults = User::query()
            ->where(function ($query): void {
                $query
                    ->whereNull('role')
                    ->orWhereNotIn('role', [
                        User::ROLE_SUPER_ADMIN,
                        User::ROLE_CUSTOMER_REP,
                        'admin',
                        'staff',
                    ]);
            })
            ->where(function ($query) use ($like): void {
                $query
                    ->where('name', 'like', $like)
                    ->orWhere('email', 'like', $like)
                    ->orWhere('first_name', 'like', $like)
                    ->orWhere('last_name', 'like', $like);
            })
            ->latest('id')
            ->limit(15)
            ->get()
            ->map(fn (User $user): array => [
                'source' => 'user',
                'customer_id' => null,
                'name' => $user->name,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => strtolower((string) $user->email),
                'occupation' => null,
                'phone' => null,
                'company' => null,
                'address' => $user->address,
                'display_name' => $this->buildDisplayName(
                    $user->first_name,
                    $user->last_name,
                    $user->name,
                    $user->email,
                ),
            ]);

        $results = $customerResults
            ->concat($userResults)
            ->unique(fn (array $row): string => strtolower((string) $row['email']))
            ->take(20)
            ->values()
            ->all();

        return response()->json([
            'results' => $results,
        ]);
    }

    private function buildDisplayName(
        ?string $firstName,
        ?string $lastName,
        ?string $fallbackName,
        ?string $email,
    ): string {
        $nameFromParts = trim("{$firstName} {$lastName}");

        if ($nameFromParts !== '') {
            return $nameFromParts;
        }

        if (filled($fallbackName)) {
            return (string) $fallbackName;
        }

        return Str::before((string) $email, '@');
    }
}
