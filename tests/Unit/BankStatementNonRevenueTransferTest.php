<?php

namespace Tests\Unit;

use App\Http\Controllers\Admin\BankStatementController;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

/**
 * Transfers from these specific senders are personal/capital transfers from
 * the account owner or associates (one real transaction was even literally
 * labeled "loan"), not customer revenue. This exercises the keyword match
 * that auto-marks such income-type rows as "ignored" at import time instead
 * of letting them enter the pending-review queue as suggested income.
 */
class BankStatementNonRevenueTransferTest extends TestCase
{
    private function isNonRevenueTransfer(string $description): bool
    {
        $controller = new BankStatementController();
        $method = new ReflectionMethod($controller, 'isNonRevenueTransfer');
        $method->setAccessible(true);

        return $method->invoke($controller, $description);
    }

    public function test_matches_known_non_revenue_senders(): void
    {
        $this->assertTrue($this->isNonRevenueTransfer('AHMED OLUMUYIWA/Transfer from AHMED OLUMUYIWA BELL'));
        $this->assertTrue($this->isNonRevenueTransfer('MOYOSOREOLUWA P/Transfer from MOYOSOREOLUWA PEACE'));
        $this->assertTrue($this->isNonRevenueTransfer('TRANSFER FROM TAIWO OGEDENGBE'));
    }

    public function test_match_is_case_insensitive(): void
    {
        $this->assertTrue($this->isNonRevenueTransfer('transfer from ahmed olumuyiwa bell'));
    }

    public function test_does_not_match_unrelated_senders(): void
    {
        $this->assertFalse($this->isNonRevenueTransfer('TRANSFER FROM TOLUWALASE DEBORAH OLUJIMI'));
        $this->assertFalse($this->isNonRevenueTransfer('LEGAL SEARCH FEE IFO BELLAH OPTIONS'));
    }
}
