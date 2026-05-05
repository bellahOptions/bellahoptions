<?php

use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\InvoiceController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\PagesController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SeoController;
use App\Http\Controllers\ServiceOrderController;
use App\Http\Controllers\WaitlistController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/sitemap.xml', [SeoController::class, 'sitemap'])->name('seo.sitemap');
Route::get('/robots.txt', [SeoController::class, 'robots'])->name('seo.robots');
Route::get('/llms.txt', [SeoController::class, 'llms'])->name('seo.llms');

Route::get('/', [PagesController::class, 'welcomePage'])->name('home');
Route::get('/welcome', [PagesController::class, 'welcomePage'])->name('welcome');
Route::get('/about-bellah-options', [PagesController::class, 'aboutPage'])->name('about');
Route::get('/services', [PagesController::class, 'servicesPage'])->name('services');
Route::get('/gallery', [PagesController::class, 'galleryPage'])->name('gallery');
Route::get('/web-design-samples', [PagesController::class, 'webDesignSamplesPage'])->name('web-design-samples');
Route::get('/blog', [PagesController::class, 'blogPage'])->name('blog');
Route::get('/blog/{blogPost:slug}', [PagesController::class, 'blogShowPage'])->name('blog.show');
Route::get('/contact-us', [PagesController::class, 'contactPage'])->name('contact');
Route::get('/events', [PagesController::class, 'eventsPage'])->name('events');
Route::get('/services/{serviceSlug}', fn () => redirect()->route('home'))->name('services.show');
Route::get('/order', fn () => redirect()->route('services'))->name('orders.index');
Route::get('/order/{serviceSlug}', [ServiceOrderController::class, 'create'])
    ->whereIn('serviceSlug', ['social-media-design', 'graphic-design', 'brand-design', 'web-design', 'mobile-app-development', 'ui-ux', 'special-service'])
    ->name('orders.create');
Route::post('/order/{serviceSlug}', [ServiceOrderController::class, 'store'])
    ->whereIn('serviceSlug', ['social-media-design', 'graphic-design', 'brand-design', 'web-design', 'mobile-app-development', 'ui-ux', 'special-service'])
    ->middleware('throttle:order-form')
    ->name('orders.store');
Route::get('/orders/{serviceOrder}/payment', [ServiceOrderController::class, 'payment'])->name('orders.payment.show');
Route::get('/orders/{orderReference}/payment/initialize', [ServiceOrderController::class, 'redirectBlockedPaymentInitialize'])
    ->name('orders.payment.initialize.blocked');
Route::post('/orders/{serviceOrder}/payment/initialize', [ServiceOrderController::class, 'initializePayment'])->name('orders.payment.initialize');
Route::get('/orders/payment/callback', [ServiceOrderController::class, 'paymentCallback'])->name('orders.payment.callback');
Route::get('/orders/{serviceOrder}', [ServiceOrderController::class, 'show'])->name('orders.show');
Route::post('/webhooks/paystack', [ServiceOrderController::class, 'webhook'])
    ->middleware('throttle:40,1')
    ->name('webhooks.paystack');
Route::post('/webhooks/flutterwave', [ServiceOrderController::class, 'flutterwaveWebhook'])
    ->middleware('throttle:40,1')
    ->name('webhooks.flutterwave');
Route::redirect('/smm-form', '/order/social-media-design')->name('orders.smm-form');
Route::redirect('/about-us', '/about-bellah-options')->name('about.legacy');
Route::post('/contact-us', [ContactController::class, 'store'])
    ->middleware('throttle:contact-form')
    ->name('contact.submit');

Route::get('/waitlist', [WaitlistController::class, 'create'])->name('waitlist.create');
Route::get('/terms-of-service', fn () => Inertia::render('Legal/Terms'))->name('terms.show');
Route::get('/privacy-policy', fn () => Inertia::render('Legal/Privacy'))->name('privacy.show');
Route::get('/cookie-policy', fn () => Inertia::render('Legal/Cookies'))->name('cookies.show');
Route::post('/waitlist', [WaitlistController::class, 'store'])
    ->middleware('throttle:waitlist')
    ->name('waitlist.store');

Route::get('/new-home', [PagesController::class, 'index'])->name('home.new');

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
    Route::post('/admin/service-orders/{serviceOrder}/updates', [ServiceOrderController::class, 'storeUpdate'])
        ->name('admin.service-orders.updates.store');
});

Route::middleware(['auth', 'verified', 'super-admin'])->group(function (): void {
    Route::get('/admin/settings', [SettingController::class, 'edit'])->name('admin.settings.edit');
    Route::patch('/admin/settings', [SettingController::class, 'update'])->name('admin.settings.update');
    Route::post('/admin/settings/discount-codes', [SettingController::class, 'storeDiscount'])->name('admin.settings.discounts.store');
    Route::patch('/admin/settings/discount-codes/{discountCode}/status', [SettingController::class, 'toggleDiscountStatus'])->name('admin.settings.discounts.status');
    Route::delete('/admin/settings/discount-codes/{discountCode}', [SettingController::class, 'destroyDiscount'])->name('admin.settings.discounts.destroy');
    Route::post('/admin/settings/subscription-plans', [SettingController::class, 'storeSubscriptionPlan'])->name('admin.settings.subscription-plans.store');
    Route::patch('/admin/settings/subscription-plans/{subscriptionPlan}', [SettingController::class, 'updateSubscriptionPlan'])->name('admin.settings.subscription-plans.update');
    Route::delete('/admin/settings/subscription-plans/{subscriptionPlan}', [SettingController::class, 'destroySubscriptionPlan'])->name('admin.settings.subscription-plans.destroy');
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
require __DIR__.'/admin.php';
