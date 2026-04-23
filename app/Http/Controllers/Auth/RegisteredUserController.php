<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'nullable|string|max:255',
            'first_name' => ['required_without:name', 'string', 'max:120', "regex:/^[a-zA-Z\\s\\-\\.'`]+$/"],
            'last_name' => ['required_without:name', 'string', 'max:120', "regex:/^[a-zA-Z\\s\\-\\.'`]+$/"],
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $firstName = $request->string('first_name')->trim()->value();
        $lastName = $request->string('last_name')->trim()->value();

        if ($firstName === '' && $request->filled('name')) {
            $nameParts = preg_split('/\s+/', trim((string) $request->name)) ?: [];
            $firstName = $nameParts[0] ?? '';
            $lastName = $lastName !== '' ? $lastName : (count($nameParts) > 1 ? implode(' ', array_slice($nameParts, 1)) : '');
        }

        $fullName = trim((string) ($request->name ?: "{$firstName} {$lastName}"));

        $user = User::create([
            'name' => $fullName,
            'first_name' => $firstName !== '' ? $firstName : $fullName,
            'last_name' => $lastName !== '' ? $lastName : null,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'user',
            'address' => null,
        ]);

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('dashboard', absolute: false));
    }
}
