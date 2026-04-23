<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateManagedUserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless((bool) $request->user()?->isSuperAdmin(), 403);

        $search = trim((string) $request->query('search', ''));
        $role = trim((string) $request->query('role', ''));

        $query = User::query()->latest('id');

        if ($search !== '') {
            $like = '%'.$search.'%';

            $query->where(function ($searchQuery) use ($like): void {
                $searchQuery
                    ->where('name', 'like', $like)
                    ->orWhere('first_name', 'like', $like)
                    ->orWhere('last_name', 'like', $like)
                    ->orWhere('email', 'like', $like);
            });
        }

        if ($role !== '') {
            $query->where('role', $role);
        }

        $users = $query
            ->paginate(20)
            ->through(fn (User $user): array => $this->mapUser($user))
            ->withQueryString();

        return Inertia::render('Admin/Users/Index', [
            'filters' => [
                'search' => $search,
                'role' => $role,
            ],
            'roleOptions' => $this->roleOptions(),
            'stats' => [
                'total_users' => User::count(),
                'staff_users' => User::query()
                    ->whereIn('role', [User::ROLE_SUPER_ADMIN, User::ROLE_CUSTOMER_REP, 'admin', 'staff'])
                    ->count(),
                'customer_users' => User::query()
                    ->where(function ($query): void {
                        $query->whereNull('role')->orWhere('role', 'user');
                    })
                    ->count(),
                'verified_users' => User::whereNotNull('email_verified_at')->count(),
            ],
            'users' => $users,
        ]);
    }

    public function show(Request $request, User $user): Response
    {
        abort_unless((bool) $request->user()?->isSuperAdmin(), 403);

        return Inertia::render('Admin/Users/Show', [
            'roleOptions' => $this->roleOptions(),
            'userRecord' => $this->mapUser($user),
        ]);
    }

    public function update(UpdateManagedUserRequest $request, User $user): RedirectResponse
    {
        $data = $request->validated();

        if (
            $request->user()?->id === $user->id
            && $user->isSuperAdmin()
            && ! in_array((string) $data['role'], [User::ROLE_SUPER_ADMIN, 'admin'], true)
        ) {
            return back()->with('error', 'You cannot remove super admin access from your own account.');
        }

        $firstName = trim((string) ($data['first_name'] ?? ''));
        $lastName = trim((string) ($data['last_name'] ?? ''));
        $name = trim((string) ($data['name'] ?? ''));

        if ($name === '') {
            $name = trim($firstName.' '.$lastName);
        }

        $user->update([
            'name' => $name,
            'first_name' => $firstName !== '' ? $firstName : $name,
            'last_name' => $lastName !== '' ? $lastName : null,
            'email' => strtolower(trim((string) $data['email'])),
            'role' => $data['role'],
            'address' => $data['address'] ?? null,
        ]);

        return back()->with('success', 'User updated successfully.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        abort_unless((bool) $request->user()?->isSuperAdmin(), 403);

        if ($request->user()?->id === $user->id) {
            return back()->with('error', 'You cannot delete your own account from user management.');
        }

        if (
            $user->isSuperAdmin()
            && User::query()
                ->whereIn('role', [User::ROLE_SUPER_ADMIN, 'admin'])
                ->count() <= 1
        ) {
            return back()->with('error', 'At least one super admin account must remain.');
        }

        $deletedName = $user->name;
        $user->delete();

        return redirect()
            ->route('admin.users.index')
            ->with('success', "User {$deletedName} deleted successfully.");
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    private function roleOptions(): array
    {
        return [
            ['value' => User::ROLE_SUPER_ADMIN, 'label' => 'Super Admin'],
            ['value' => User::ROLE_CUSTOMER_REP, 'label' => 'Customer Representative'],
            ['value' => 'admin', 'label' => 'Admin (Legacy)'],
            ['value' => 'staff', 'label' => 'Staff (Legacy)'],
            ['value' => 'user', 'label' => 'User'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function mapUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'role' => $user->role,
            'address' => $user->address,
            'is_super_admin' => $user->isSuperAdmin(),
            'is_staff' => $user->isStaff(),
            'email_verified_at' => $user->email_verified_at?->toDateTimeString(),
            'created_at' => $user->created_at?->toDateTimeString(),
            'updated_at' => $user->updated_at?->toDateTimeString(),
        ];
    }
}
