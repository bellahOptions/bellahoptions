<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SeoModulesFunctionsPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_seo_modules_and_functions_page_renders_successfully(): void
    {
        $this->get(route('seo.modules-functions'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('SeoModulesFunctions')
                ->has('modules', 4)
                ->has('functions', 4)
            );
    }
}
