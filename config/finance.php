<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Invoice Income Split
    |--------------------------------------------------------------------------
    |
    | Every paid invoice is split five ways: three fixed reserve categories,
    | a partner cut, and an owner cut. The three reserve percentages and the
    | partner percentage are fixed; the owner absorbs whatever remains, so
    | the five always sum to exactly 100% regardless of rounding.
    |
    */

    'income_split' => [
        'ads_savings_percent' => (float) env('FINANCE_ADS_SAVINGS_PERCENT', 15),
        'data_savings_percent' => (float) env('FINANCE_DATA_SAVINGS_PERCENT', 15),
        'ai_savings_percent' => (float) env('FINANCE_AI_SAVINGS_PERCENT', 10),
        'partner_percent' => (float) env('FINANCE_PARTNER_PERCENT', 20),

        'partner_email' => env('FINANCE_PARTNER_EMAIL', 'peacefrancis851@gmail.com'),
        'owner_email' => env('FINANCE_OWNER_EMAIL', 'ahmed@bellahoptions.com'),
    ],

];
