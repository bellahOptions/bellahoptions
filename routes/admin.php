<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\BlogPostController;
use App\Http\Controllers\Admin\EventController;
use App\Http\Controllers\Admin\GalleryProjectController;
use App\Http\Controllers\Admin\SlideController;

Route::middleware(['auth', 'verified', 'super-admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::resource('slides', SlideController::class)->except(['create', 'show', 'edit']);
    Route::resource('gallery', GalleryProjectController::class)->except(['create', 'show', 'edit']);
    Route::resource('events', EventController::class)->except(['create', 'show', 'edit']);
    Route::resource('blog', BlogPostController::class)->except(['create', 'show', 'edit']);
});
