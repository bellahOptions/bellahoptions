<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use App\Support\HumanVerification;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
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
        return Inertia::render('Auth/Register', [
            ...HumanVerification::createChallenge(request(), 'auth_register_human_check'),
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(RegisterRequest $request): RedirectResponse
    {
        $request->session()->forget('auth_register_human_check');

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
