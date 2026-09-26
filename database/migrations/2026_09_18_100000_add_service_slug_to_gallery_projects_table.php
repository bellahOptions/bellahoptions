<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Ties a gallery project to the service it belongs to.
 *
 * Until now a project only carried a free-text `category`, so a service landing
 * page had no reliable way to show its own work: matching on that text alone
 * would break the moment somebody typed "Branding" instead of "Brand Design".
 *
 * The column is nullable on purpose. Existing projects have no service, and the
 * landing pages fall back to matching the category against the service name, so
 * nothing has to be re-tagged by hand for the sections to be useful.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gallery_projects', function (Blueprint $table): void {
            $table->string('service_slug', 80)->nullable()->index()->after('category');
        });
    }

    public function down(): void
    {
        Schema::table('gallery_projects', function (Blueprint $table): void {
            $table->dropIndex(['service_slug']);
            $table->dropColumn('service_slug');
        });
    }
};
