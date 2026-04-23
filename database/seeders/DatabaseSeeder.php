<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'ahmed@bellahoptions.com'],
            [
                'name' => 'Ahmed Bellah',
                'first_name' => 'Ahmed',
                'last_name' => 'Bellah',
                'role' => User::ROLE_SUPER_ADMIN,
                'password' => Hash::make('#Panaman247'),
                'email_verified_at' => now(),
                'address' => null,
            ],
        );
    }
}
