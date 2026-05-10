<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('native:jump {--host=127.0.0.1} {--port=8000}', function () {
    $host = (string) $this->option('host');
    $port = (int) $this->option('port');
    $baseUrl = sprintf('http://%s:%d', $host, $port);

    $this->info('Native jump is ready.');
    $this->line("App URL: {$baseUrl}");
    $this->comment('If the app is not already running, start it with: php artisan serve --host='.$host.' --port='.$port);

    return self::SUCCESS;
})->purpose('Show the local app URL entry point for native/web access');

Schedule::command('invoices:send-reminders')->dailyAt('09:00');
Schedule::command('support-tickets:send-unanswered-reminders')->hourlyAt(15);
Schedule::command('prospects:send-abandoned-order-reminders')->hourlyAt(20);
