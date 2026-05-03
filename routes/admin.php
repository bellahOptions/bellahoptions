<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\SlideController;

Route::middleware(['auth', 'verified', 'staff'])->prefix('admin')->name('admin.')->group(function () {
    Route::resource('slides', SlideController::class);

});