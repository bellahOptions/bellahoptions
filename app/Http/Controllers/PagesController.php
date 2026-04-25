<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;
class PagesController extends Controller
{
    public function index(){
        return Inertia::render('Home');
    }
}
