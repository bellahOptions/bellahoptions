<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\BlogPostController;
use App\Http\Controllers\Admin\EventController;
use App\Http\Controllers\Admin\FaqController;
use App\Http\Controllers\Admin\GalleryProjectController;
use App\Http\Controllers\Admin\ServicePricingController;
use App\Http\Controllers\Admin\SlideController;

Route::middleware(['auth', 'verified', 'super-admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('service-pricing', [ServicePricingController::class, 'edit'])->name('service-pricing.edit');
    Route::patch('service-pricing', [ServicePricingController::class, 'update'])->name('service-pricing.update');
    Route::get('slides/media', [SlideController::class, 'mediaIndex'])->name('slides.media.index');
    Route::post('slides/media/upload', [SlideController::class, 'upload'])->name('slides.media.upload');
    Route::resource('slides', SlideController::class)->except(['create', 'show', 'edit']);
    Route::get('gallery/media', [GalleryProjectController::class, 'mediaIndex'])->name('gallery.media.index');
    Route::post('gallery/media/upload', [GalleryProjectController::class, 'upload'])->name('gallery.media.upload');
    Route::resource('gallery', GalleryProjectController::class)->except(['create', 'show', 'edit']);
    Route::resource('events', EventController::class)->except(['create', 'show', 'edit']);
    Route::resource('blog', BlogPostController::class)->except(['create', 'show', 'edit']);
    Route::resource('faqs', FaqController::class)->except(['create', 'show', 'edit']);
});
