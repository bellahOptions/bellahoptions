<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Admin\ClientReviewController as AdminClientReviewController;
use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\EmailCenterController;
use App\Http\Controllers\Admin\InvoiceController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\SupportTicketController as AdminSupportTicketController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\LiveChat\StaffChatController;
use App\Http\Controllers\ServiceOrderController;
use App\Http\Controllers\Admin\BlogPostController;
use App\Http\Controllers\Admin\EventController;
use App\Http\Controllers\Admin\FaqController;
use App\Http\Controllers\Admin\GalleryProjectController;
use App\Http\Controllers\Admin\ServicePricingController;
use App\Http\Controllers\Admin\SlideController;
use App\Http\Controllers\Dashboard\UserWorkspaceController;

Route::middleware(['auth', 'verified', 'staff', 'super-admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('service-pricing', [ServicePricingController::class, 'edit'])->name('service-pricing.edit');
    Route::patch('service-pricing', [ServicePricingController::class, 'update'])->name('service-pricing.update');
    Route::get('slides/media', [SlideController::class, 'mediaIndex'])->name('slides.media.index');
    Route::post('slides/media/upload', [SlideController::class, 'upload'])->name('slides.media.upload');
    Route::post('slides/media/crop', [SlideController::class, 'crop'])->name('slides.media.crop');
    Route::resource('slides', SlideController::class)->except(['create', 'show', 'edit']);
    Route::get('gallery/media', [GalleryProjectController::class, 'mediaIndex'])->name('gallery.media.index');
    Route::post('gallery/media/upload', [GalleryProjectController::class, 'upload'])->name('gallery.media.upload');
    Route::post('gallery/media/crop', [GalleryProjectController::class, 'crop'])->name('gallery.media.crop');
    Route::resource('gallery', GalleryProjectController::class)->except(['create', 'show', 'edit']);
    Route::resource('events', EventController::class)->except(['create', 'show', 'edit']);
    Route::resource('blog', BlogPostController::class)->except(['create', 'show', 'edit']);
    Route::resource('faqs', FaqController::class)->except(['create', 'show', 'edit']);
});


Route::get('/dashboard', AdminDashboardController::class)
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware(['auth', 'verified'])->group(function (): void {
    Route::get('/dashboard/orders', [UserWorkspaceController::class, 'orders'])->name('dashboard.orders');
    Route::get('/dashboard/referrals', [UserWorkspaceController::class, 'referrals'])->name('dashboard.referrals');
    Route::get('/dashboard/hires', [UserWorkspaceController::class, 'hires'])->name('dashboard.hires');
    Route::get('/dashboard/support', [UserWorkspaceController::class, 'support'])->name('dashboard.support');
    Route::post('/dashboard/support/tickets', [UserWorkspaceController::class, 'storeSupportTicket'])
        ->middleware('throttle:20,1')
        ->name('dashboard.support.tickets.store');
    Route::post('/dashboard/support/tickets/{ticket}/reply', [UserWorkspaceController::class, 'replySupportTicket'])
        ->middleware('throttle:30,1')
        ->name('dashboard.support.tickets.reply');
});

Route::middleware(['auth', 'verified', 'staff'])->group(function (): void {
    Route::get('/admin/live-chat', [StaffChatController::class, 'index'])->name('admin.live-chat.index');
    Route::get('/admin/live-chat/overview', [StaffChatController::class, 'overview'])->name('admin.live-chat.overview');
    Route::get('/admin/live-chat/threads/{thread}/messages', [StaffChatController::class, 'messages'])->name('admin.live-chat.threads.messages');
    Route::post('/admin/live-chat/threads/{thread}/messages', [StaffChatController::class, 'send'])
        ->middleware('throttle:60,1')
        ->name('admin.live-chat.threads.messages.send');
    Route::patch('/admin/live-chat/threads/{thread}/join', [StaffChatController::class, 'join'])->name('admin.live-chat.threads.join');
    Route::post('/admin/live-chat/threads/{thread}/typing', [StaffChatController::class, 'typing'])->name('admin.live-chat.threads.typing');
    Route::post('/admin/live-chat/messages/{message}/reactions', [StaffChatController::class, 'react'])
        ->middleware('throttle:120,1')
        ->name('admin.live-chat.messages.react');
    Route::patch('/admin/live-chat/threads/{thread}/status', [StaffChatController::class, 'updateStatus'])->name('admin.live-chat.threads.status');
    Route::post('/admin/live-chat/presence', [StaffChatController::class, 'presence'])->name('admin.live-chat.presence');

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
    Route::get('/admin/support-tickets', [AdminSupportTicketController::class, 'index'])->name('admin.support-tickets.index');
    Route::post('/admin/support-tickets/{ticket}/reply', [AdminSupportTicketController::class, 'reply'])
        ->middleware('throttle:40,1')
        ->name('admin.support-tickets.reply');
    Route::patch('/admin/support-tickets/{ticket}/status', [AdminSupportTicketController::class, 'updateStatus'])
        ->name('admin.support-tickets.status');
});

Route::middleware(['auth', 'verified', 'staff', 'super-admin'])->group(function (): void {
    Route::get('/admin/settings', [SettingController::class, 'edit'])->name('admin.settings.edit');
    Route::patch('/admin/settings', [SettingController::class, 'update'])->name('admin.settings.update');
    Route::post('/admin/settings/discount-codes', [SettingController::class, 'storeDiscount'])->name('admin.settings.discounts.store');
    Route::patch('/admin/settings/discount-codes/{discountCode}/status', [SettingController::class, 'toggleDiscountStatus'])->name('admin.settings.discounts.status');
    Route::delete('/admin/settings/discount-codes/{discountCode}', [SettingController::class, 'destroyDiscount'])->name('admin.settings.discounts.destroy');
    Route::get('/admin/settings/google-reviews/preview', [SettingController::class, 'previewGoogleReviews'])->name('admin.settings.google-reviews.preview');
    Route::post('/admin/client-reviews', [AdminClientReviewController::class, 'store'])->name('admin.client-reviews.store');
    Route::patch('/admin/client-reviews/{clientReview}', [AdminClientReviewController::class, 'update'])->name('admin.client-reviews.update');
    Route::delete('/admin/client-reviews/{clientReview}', [AdminClientReviewController::class, 'destroy'])->name('admin.client-reviews.destroy');
    Route::post('/admin/settings/subscription-plans', [SettingController::class, 'storeSubscriptionPlan'])->name('admin.settings.subscription-plans.store');
    Route::patch('/admin/settings/subscription-plans/{subscriptionPlan}', [SettingController::class, 'updateSubscriptionPlan'])->name('admin.settings.subscription-plans.update');
    Route::delete('/admin/settings/subscription-plans/{subscriptionPlan}', [SettingController::class, 'destroySubscriptionPlan'])->name('admin.settings.subscription-plans.destroy');
    Route::get('/admin/email-center', [EmailCenterController::class, 'index'])->name('admin.email-center.index');
    Route::post('/admin/email-center/campaigns', [EmailCenterController::class, 'storeCampaign'])->name('admin.email-center.campaigns.store');
    Route::put('/admin/email-center/campaigns/{newsletter}', [EmailCenterController::class, 'updateCampaign'])->name('admin.email-center.campaigns.update');
    Route::delete('/admin/email-center/campaigns/{newsletter}', [EmailCenterController::class, 'destroyCampaign'])->name('admin.email-center.campaigns.destroy');
    Route::get('/admin/email-center/campaigns/{newsletter}/audience-preview', [EmailCenterController::class, 'previewAudience'])->name('admin.email-center.campaigns.preview');
    Route::post('/admin/email-center/campaigns/{newsletter}/send-test', [EmailCenterController::class, 'sendTest'])->name('admin.email-center.campaigns.send-test');
    Route::post('/admin/email-center/campaigns/{newsletter}/send', [EmailCenterController::class, 'sendCampaign'])->name('admin.email-center.campaigns.send');
    Route::post('/admin/email-center/assets/header-image', [EmailCenterController::class, 'uploadHeaderImage'])->name('admin.email-center.assets.header-image');
    Route::patch('/admin/email-center/templates', [EmailCenterController::class, 'updateTemplateLibrary'])->name('admin.email-center.templates.update');
    Route::patch('/admin/email-center/invoice-style', [EmailCenterController::class, 'updateInvoiceStyle'])->name('admin.email-center.invoice-style.update');
    Route::delete('/admin/invoices/{invoice}', [InvoiceController::class, 'destroy'])->name('admin.invoices.destroy');

    Route::get('/admin/users', [UserController::class, 'index'])->name('admin.users.index');
    Route::get('/admin/users/{user}', [UserController::class, 'show'])->name('admin.users.show');
    Route::patch('/admin/users/{user}', [UserController::class, 'update'])->name('admin.users.update');
    Route::delete('/admin/users/{user}', [UserController::class, 'destroy'])->name('admin.users.destroy');
});
