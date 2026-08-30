<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Admin\BankStatementController;
use App\Http\Controllers\Admin\ClientReviewController as AdminClientReviewController;
use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\EmailCenterController;
use App\Http\Controllers\Admin\FinanceController;
use App\Http\Controllers\Admin\InvoiceController;
use App\Http\Controllers\Admin\ServiceOrderController as AdminServiceOrderController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\SupportTicketController as AdminSupportTicketController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\ServiceOrderController;
use App\Http\Controllers\Admin\BlogPostController;
use App\Http\Controllers\Admin\EventController;
use App\Http\Controllers\Admin\FaqController;
use App\Http\Controllers\Admin\GalleryProjectController;
use App\Http\Controllers\Admin\ServicePricingController;
use App\Http\Controllers\Dashboard\UserWorkspaceController;

Route::middleware(['auth', 'verified', 'staff', 'super-admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('service-pricing', [ServicePricingController::class, 'edit'])->name('service-pricing.edit');
    Route::patch('service-pricing', [ServicePricingController::class, 'update'])->name('service-pricing.update');
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
    Route::post('/dashboard/orders/{serviceOrder}/renew', [UserWorkspaceController::class, 'renewOrder'])->name('dashboard.orders.renew');
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
    Route::get('/admin/invoices', [InvoiceController::class, 'index'])->name('admin.invoices.index');
    Route::get('/admin/invoices/{invoice}', [InvoiceController::class, 'show'])->name('admin.invoices.show');
    Route::get('/admin/service-orders', [AdminServiceOrderController::class, 'index'])->name('admin.service-orders.index');
    Route::get('/admin/service-orders/{serviceOrder}', [AdminServiceOrderController::class, 'show'])->name('admin.service-orders.show');
    Route::get('/admin/customers/search', [CustomerController::class, 'search'])->name('admin.customers.search');
    Route::post('/admin/customers', [CustomerController::class, 'store'])->name('admin.customers.store');
    Route::post('/admin/invoices', [InvoiceController::class, 'store'])->name('admin.invoices.store');
    Route::post('/admin/invoices/{invoice}/resend', [InvoiceController::class, 'resend'])->name('admin.invoices.resend');
    Route::post('/admin/invoices/{invoice}/duplicate', [InvoiceController::class, 'duplicate'])->name('admin.invoices.duplicate');
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

    Route::get('/admin/finance', [FinanceController::class, 'overview'])->name('admin.finance.index');
    Route::get('/admin/finance/ledger', [FinanceController::class, 'ledger'])->name('admin.finance.ledger');
    Route::get('/admin/finance/ledger/export', [FinanceController::class, 'exportLedger'])->name('admin.finance.ledger.export');
    Route::get('/admin/finance/expenses', [FinanceController::class, 'expensesIndex'])->name('admin.finance.expenses.index');
    Route::post('/admin/finance/expenses', [FinanceController::class, 'storeExpense'])->name('admin.finance.expenses.store');
    Route::delete('/admin/finance/expenses/{expense}', [FinanceController::class, 'destroyExpense'])->name('admin.finance.expenses.destroy');
    Route::get('/admin/finance/payouts', [FinanceController::class, 'payoutsIndex'])->name('admin.finance.payouts.index');
    Route::post('/admin/finance/payouts', [FinanceController::class, 'storePayout'])->name('admin.finance.payouts.store');
    Route::patch('/admin/finance/payouts/{payout}/mark-paid', [FinanceController::class, 'markPayoutPaid'])->name('admin.finance.payouts.mark-paid');
    Route::delete('/admin/finance/payouts/{payout}', [FinanceController::class, 'destroyPayout'])->name('admin.finance.payouts.destroy');

    Route::get('/admin/finance/bank-imports', [BankStatementController::class, 'index'])->name('admin.finance.bank-imports.index');
    Route::post('/admin/finance/bank-imports', [BankStatementController::class, 'store'])->name('admin.finance.bank-imports.store');
    Route::get('/admin/finance/bank-imports/{bankStatementImport}', [BankStatementController::class, 'show'])->name('admin.finance.bank-imports.show');
    Route::delete('/admin/finance/bank-imports/{bankStatementImport}', [BankStatementController::class, 'destroy'])->name('admin.finance.bank-imports.destroy');
    Route::post('/admin/finance/bank-imports/{bankStatementImport}/bulk-convert', [BankStatementController::class, 'bulkConvert'])->name('admin.finance.bank-imports.bulk-convert');
    Route::post('/admin/finance/bank-imports/{bankStatementImport}/convert-all', [BankStatementController::class, 'convertAll'])->name('admin.finance.bank-imports.convert-all');
    Route::post('/admin/finance/bank-imports/transactions/{bankStatementTransaction}/convert', [BankStatementController::class, 'convert'])->name('admin.finance.bank-imports.transactions.convert');
    Route::patch('/admin/finance/bank-imports/transactions/{bankStatementTransaction}/ignore', [BankStatementController::class, 'ignore'])->name('admin.finance.bank-imports.transactions.ignore');
});
