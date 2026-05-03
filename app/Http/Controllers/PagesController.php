<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class PagesController extends Controller
{
    public function index()
    {
        return Inertia::render('Home');
    }

    public function welcomePage()
    {
        return Inertia::render('Welcome');
    }

    public function aboutPage()
    {
        return Inertia::render('About');
    }
}
