<?php

use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\InvoiceController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\WaitlistController;
use Illuminate\Support\Facades\Route;

Route::get('/', [WaitlistController::class, 'create'])->name('waitlist.create');
Route::view('/terms-of-service', 'terms-of-service')->name('terms.show');
Route::post('/waitlist', [WaitlistController::class, 'store'])
    ->middleware('throttle:waitlist')
    ->name('waitlist.store');

Route::get('/dashboard', AdminDashboardController::class)
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware(['auth', 'verified', 'staff'])->group(function (): void {
    Route::get('/admin/invoices', [InvoiceController::class, 'index'])->name('admin.invoices.index');
    Route::get('/admin/invoices/{invoice}', [InvoiceController::class, 'show'])->name('admin.invoices.show');
    Route::get('/admin/customers/search', [CustomerController::class, 'search'])->name('admin.customers.search');
    Route::post('/admin/customers', [CustomerController::class, 'store'])->name('admin.customers.store');
    Route::post('/admin/invoices', [InvoiceController::class, 'store'])->name('admin.invoices.store');
    Route::post('/admin/invoices/{invoice}/resend', [InvoiceController::class, 'resend'])->name('admin.invoices.resend');
    Route::post('/admin/invoices/{invoice}/remind', [InvoiceController::class, 'sendReminder'])->name('admin.invoices.remind');
    Route::patch('/admin/invoices/{invoice}/mark-paid', [InvoiceController::class, 'markPaid'])->name('admin.invoices.mark-paid');
});

Route::middleware(['auth', 'verified', 'super-admin'])->group(function (): void {
    Route::get('/admin/settings', [SettingController::class, 'edit'])->name('admin.settings.edit');
    Route::patch('/admin/settings', [SettingController::class, 'update'])->name('admin.settings.update');
    Route::delete('/admin/invoices/{invoice}', [InvoiceController::class, 'destroy'])->name('admin.invoices.destroy');

    Route::get('/admin/users', [UserController::class, 'index'])->name('admin.users.index');
    Route::get('/admin/users/{user}', [UserController::class, 'show'])->name('admin.users.show');
    Route::patch('/admin/users/{user}', [UserController::class, 'update'])->name('admin.users.update');
    Route::delete('/admin/users/{user}', [UserController::class, 'destroy'])->name('admin.users.destroy');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
