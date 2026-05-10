<?php

use App\Http\Controllers\ClientReviewController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\LiveChat\CustomerChatController;
use App\Http\Controllers\PagesController;
use App\Http\Controllers\SeoController;
use App\Http\Controllers\ServiceOrderController;
use App\Http\Controllers\WaitlistController;
use Illuminate\Support\Facades\Route;

// SEO ROUTES
Route::get('/sitemap.xml', [SeoController::class, 'sitemap'])->name('seo.sitemap');
Route::get('/robots.txt', [SeoController::class, 'robots'])->name('seo.robots');
Route::get('/llms.txt', [SeoController::class, 'llms'])->name('seo.llms');

// PAGES ROUTES
Route::get('/', [PagesController::class, 'welcomePage'])->name('home');
Route::get('/welcome', [PagesController::class, 'welcomePage'])->name('welcome');
Route::get('/about-bellah-options', [PagesController::class, 'aboutPage'])->name('about');
Route::get('/services', [PagesController::class, 'servicesPage'])->name('services');
Route::get('/gallery', [PagesController::class, 'galleryPage'])->name('gallery');
Route::get('/web-design-samples', [PagesController::class, 'webDesignSamplesPage'])->name('web-design-samples');
Route::get('/manage-your-hires', [PagesController::class, 'manageHiresPage'])->name('manage-hires');
Route::get('/blog', [PagesController::class, 'blogPage'])->name('blog');
Route::get('/blog/{blogPost:slug}', [PagesController::class, 'blogShowPage'])->name('blog.show');
Route::get('/contact-us', [PagesController::class, 'contactPage'])->name('contact');
Route::get('/events', [PagesController::class, 'eventsPage'])->name('events');
Route::get('/faqs', [PagesController::class, 'faqsPage'])->name('faqs');
Route::get('/reviews', [PagesController::class, 'reviewsPage'])->name('reviews');
Route::get('/reviews/submit/{token}', [ClientReviewController::class, 'show'])->name('reviews.submit.show');
Route::post('/reviews/submit/{token}', [ClientReviewController::class, 'store'])
    ->middleware('throttle:20,1')
    ->name('reviews.submit.store');
Route::get('/services/{serviceSlug}', fn () => redirect()->route('home'))->name('services.show');

// ORDER ROUTES
Route::get('/order', fn () => redirect()->route('services'))->name('orders.index');
Route::get('/order/{serviceSlug}', [ServiceOrderController::class, 'create'])
    ->whereIn('serviceSlug', ['social-media-design', 'graphic-design', 'brand-design', 'web-design', 'mobile-app-development', 'ui-ux', 'special-service'])
    ->name('orders.create');
Route::post('/order/{serviceSlug}', [ServiceOrderController::class, 'store'])
    ->whereIn('serviceSlug', ['social-media-design', 'graphic-design', 'brand-design', 'web-design', 'mobile-app-development', 'ui-ux', 'special-service'])
    ->middleware('throttle:order-form')
    ->name('orders.store');
Route::post('/order/{serviceSlug}/prospect-draft', [ServiceOrderController::class, 'saveProspectDraft'])
    ->whereIn('serviceSlug', ['social-media-design', 'graphic-design', 'brand-design', 'web-design', 'mobile-app-development', 'ui-ux', 'special-service'])
    ->middleware('throttle:20,1')
    ->name('orders.prospect-draft.store');
Route::get('/orders/{serviceOrder}/payment', [ServiceOrderController::class, 'payment'])->name('orders.payment.show');
Route::get('/orders/{orderReference}/payment/initialize', [ServiceOrderController::class, 'redirectBlockedPaymentInitialize'])
    ->name('orders.payment.initialize.blocked');
Route::post('/orders/{serviceOrder}/payment/initialize', [ServiceOrderController::class, 'initializePayment'])->name('orders.payment.initialize');
Route::post('/orders/{serviceOrder}/payment/transfer', [ServiceOrderController::class, 'submitTransferPayment'])->name('orders.payment.transfer');
Route::get('/orders/payment/callback', [ServiceOrderController::class, 'paymentCallback'])->name('orders.payment.callback');
Route::get('/orders/{serviceOrder}', [ServiceOrderController::class, 'show'])->name('orders.show');
Route::post('/webhooks/paystack', [ServiceOrderController::class, 'webhook'])
    ->middleware('throttle:40,1')
    ->name('webhooks.paystack');
Route::post('/webhooks/flutterwave', [ServiceOrderController::class, 'flutterwaveWebhook'])
    ->middleware('throttle:40,1')
    ->name('webhooks.flutterwave');

    //REDIRECTS
Route::redirect('/smm-form', '/order/social-media-design')->name('orders.smm-form');
Route::redirect('/about-us', '/about-bellah-options')->name('about.legacy');
Route::redirect('/contact-bellah-options', '/contact-us')->name('former-contact');


Route::post('/contact-us', [ContactController::class, 'store'])
    ->middleware('throttle:contact-form')
    ->name('contact.submit');

// Route::get('/waitlist', [WaitlistController::class, 'create'])->name('waitlist.create');
// LEGAL ROUTES
Route::get('/terms-of-service', [PagesController::class, 'showTerms'])->name('terms.show');
Route::get('/privacy-policy', [PagesController::class, 'showPrivacyPolicy'])->name('privacy.show');
Route::get('/cookie-policy', [PagesController::class, 'showCookiePolicy'])->name('cookies.show');

Route::post('/waitlist', [WaitlistController::class, 'store'])
    ->middleware('throttle:waitlist')
    ->name('waitlist.store');

Route::prefix('live-chat')->name('live-chat.')->group(function (): void {
    Route::get('/session', [CustomerChatController::class, 'session'])
        ->middleware('throttle:live-chat-read')
        ->name('session');
    Route::get('/messages', [CustomerChatController::class, 'messages'])
        ->middleware('throttle:live-chat-read')
        ->name('messages');
    Route::post('/messages', [CustomerChatController::class, 'send'])
        ->middleware('throttle:40,1')
        ->name('messages.send');
    Route::patch('/close', [CustomerChatController::class, 'close'])
        ->middleware('throttle:live-chat-signal')
        ->name('close');
    Route::post('/presence', [CustomerChatController::class, 'presence'])
        ->middleware('throttle:live-chat-signal')
        ->name('presence');
    Route::post('/typing', [CustomerChatController::class, 'typing'])
        ->middleware('throttle:live-chat-signal')
        ->name('typing');
    Route::post('/messages/{message}/reactions', [CustomerChatController::class, 'react'])
        ->middleware('throttle:120,1')
        ->name('messages.react');
});

Route::get('/new-home', [PagesController::class, 'index'])->name('home.new');



require __DIR__.'/auth.php';
require __DIR__.'/admin.php';
