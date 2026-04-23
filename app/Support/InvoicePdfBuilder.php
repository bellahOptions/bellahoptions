<?php

namespace App\Support;

use App\Models\Invoice;

class InvoicePdfBuilder
{
    public function buildInvoice(Invoice $invoice): string
    {
        $companyName = (string) config('bellah.invoice.company_name', 'Bellah Options');
        $submittedOn = $invoice->issued_at?->format('d/m/Y') ?? now()->format('d/m/Y');
        $dueDate = $invoice->due_date?->format('d/m/Y') ?? $submittedOn;
        $amount = (float) $invoice->amount;
        $amountText = $this->formatCurrency($amount, (string) $invoice->currency);
        $customerName = trim((string) $invoice->customer_name) !== '' ? (string) $invoice->customer_name : 'Client';
        $customerEmail = trim((string) $invoice->customer_email) !== '' ? (string) $invoice->customer_email : 'N/A';
        $projectTitle = trim((string) $invoice->title) !== '' ? (string) $invoice->title : 'Service';

        $commands = [
            $this->setStrokeColor(0.86, 0.90, 0.93),
            $this->drawRectangle(24, 24, 564, 794, 1.0),
            $this->setFillColor(0.07, 0.12, 0.18),
            $this->drawText(40, 792, $companyName, 22, 'F2'),
            $this->setFillColor(0.37, 0.45, 0.52),
            $this->drawText(40, 774, 'Baba Ode, Onibukun Ota', 10),
            $this->drawText(40, 760, 'Ogun State, NG (BN3668420)', 10),
            $this->drawText(40, 746, '(234) 810 867 1804', 10),

            $this->setFillColor(0.07, 0.12, 0.18),
            $this->drawText(470, 792, 'Invoice', 22, 'F2'),
            $this->setFillColor(0.37, 0.45, 0.52),
            $this->drawText(470, 774, 'Submitted on '.$submittedOn, 10),

            $this->setStrokeColor(0.86, 0.90, 0.93),
            $this->drawLine(40, 730, 572, 730, 1.0),

            $this->setFillColor(0.37, 0.45, 0.52),
            $this->drawText(40, 706, 'Invoice for', 10),
            $this->setFillColor(0.07, 0.12, 0.18),
            $this->drawText(40, 690, $customerName, 12, 'F2'),
            $this->setFillColor(0.37, 0.45, 0.52),
            $this->drawText(40, 674, $customerEmail, 10),

            $this->setFillColor(0.37, 0.45, 0.52),
            $this->drawText(274, 706, 'Payable to', 10),
            $this->setFillColor(0.07, 0.12, 0.18),
            $this->drawText(274, 690, $companyName, 12, 'F2'),

            $this->setFillColor(0.37, 0.45, 0.52),
            $this->drawText(470, 706, 'Invoice #', 10),
            $this->setFillColor(0.07, 0.12, 0.18),
            $this->drawText(470, 690, (string) $invoice->invoice_number, 12, 'F2'),
            $this->setFillColor(0.37, 0.45, 0.52),
            $this->drawText(470, 672, 'Project', 10),
            $this->setFillColor(0.07, 0.12, 0.18),
            $this->drawText(470, 656, $this->truncate($projectTitle, 18), 11, 'F2'),
            $this->setFillColor(0.37, 0.45, 0.52),
            $this->drawText(470, 638, 'Due date', 10),
            $this->setFillColor(0.07, 0.12, 0.18),
            $this->drawText(470, 622, $dueDate, 11, 'F2'),

            $this->setStrokeColor(0.80, 0.86, 0.89),
            $this->drawLine(40, 606, 572, 606, 1.0),

            $this->setFillColor(0.37, 0.45, 0.52),
            $this->drawText(40, 588, 'Description', 10, 'F2'),
            $this->drawText(314, 588, 'Qty', 10, 'F2'),
            $this->drawText(372, 588, 'Unit price', 10, 'F2'),
            $this->drawText(492, 588, 'Total price', 10, 'F2'),

            $this->setStrokeColor(0.86, 0.90, 0.93),
            $this->drawLine(40, 580, 572, 580, 0.8),
            $this->setFillColor(0.07, 0.12, 0.18),
            $this->drawText(40, 560, $this->truncate($projectTitle, 42), 11),
            $this->drawText(322, 560, '1', 11),
            $this->drawText(372, 560, $amountText, 11),
            $this->drawText(492, 560, $amountText, 11, 'F2'),
            $this->setStrokeColor(0.86, 0.90, 0.93),
            $this->drawLine(40, 546, 572, 546, 0.8),

            $this->setFillColor(0.37, 0.45, 0.52),
            $this->drawText(40, 512, 'Notes:', 11, 'F2'),
        ];

        foreach ($this->wrapText('Please make payment to the account below:', 44) as $index => $line) {
            $commands[] = $this->setFillColor(0.07, 0.12, 0.18);
            $commands[] = $this->drawText(40, 494 - ($index * 14), $line, 10);
        }

        $commands[] = $this->setFillColor(0.37, 0.45, 0.52);
        $commands[] = $this->drawText(40, 462, str_repeat('-', 50), 10);
        $commands[] = $this->setFillColor(0.07, 0.12, 0.18);
        $commands[] = $this->drawText(40, 446, 'Account Number: 4210082961', 10);
        $commands[] = $this->drawText(40, 432, 'Account Name: Bellah Options', 10);
        $commands[] = $this->drawText(40, 418, 'Bank Name: Fidelity Bank', 10);

        $commands = array_merge($commands, [
            $this->setStrokeColor(0.86, 0.90, 0.93),
            $this->drawLine(340, 516, 572, 516, 0.8),
            $this->drawLine(340, 488, 572, 488, 0.8),
            $this->drawLine(340, 460, 572, 460, 0.8),

            $this->setFillColor(0.37, 0.45, 0.52),
            $this->drawText(340, 524, 'Subtotal', 10, 'F2'),
            $this->drawText(340, 496, 'Discount', 10, 'F2'),
            $this->drawText(340, 468, 'Total', 11, 'F2'),

            $this->setFillColor(0.07, 0.12, 0.18),
            $this->drawText(502, 524, $amountText, 10, 'F2'),
            $this->drawText(502, 496, $this->formatCurrency(0, (string) $invoice->currency), 10),
            $this->drawText(502, 468, $amountText, 11, 'F2'),

            $this->setStrokeColor(0.86, 0.90, 0.93),
            $this->drawLine(40, 384, 572, 384, 1.0),
            $this->setFillColor(0.07, 0.12, 0.18),
            $this->drawText(40, 364, "Ensure you've read and understood our Terms of Service before payment.", 10),
        ]);

        return $this->buildDocument($commands);
    }

    public function buildReceipt(Invoice $invoice): string
    {
        $companyName = (string) config('bellah.invoice.company_name', 'Bellah Options');
        $amountText = $this->formatCurrency((float) $invoice->amount, (string) $invoice->currency);
        $paidDate = $invoice->paid_at?->format('d/m/Y H:i') ?? now()->format('d/m/Y H:i');

        $commands = [
            $this->setStrokeColor(0.84, 0.91, 0.90),
            $this->drawRectangle(24, 24, 564, 794, 1.0),
            $this->setFillColor(0.02, 0.25, 0.23),
            $this->drawText(40, 792, $companyName.' Payment Receipt', 21, 'F2'),
            $this->setFillColor(0.33, 0.43, 0.42),
            $this->drawText(40, 772, 'Invoice #'.$invoice->invoice_number, 11),
            $this->drawText(40, 756, 'Receipt Date: '.$paidDate, 11),

            $this->setStrokeColor(0.84, 0.91, 0.90),
            $this->drawLine(40, 736, 572, 736, 1.0),

            $this->setFillColor(0.33, 0.43, 0.42),
            $this->drawText(40, 710, 'Customer', 10, 'F2'),
            $this->setFillColor(0.05, 0.18, 0.17),
            $this->drawText(40, 694, (string) $invoice->customer_name, 11),
            $this->drawText(40, 678, (string) $invoice->customer_email, 10),

            $this->setFillColor(0.33, 0.43, 0.42),
            $this->drawText(40, 648, 'Payment Summary', 10, 'F2'),
            $this->setStrokeColor(0.84, 0.91, 0.90),
            $this->drawLine(40, 640, 572, 640, 0.8),

            $this->setFillColor(0.05, 0.18, 0.17),
            $this->drawText(40, 620, 'Description: '.$this->truncate((string) $invoice->title, 58), 11),
            $this->drawText(40, 604, 'Amount Paid: '.$amountText, 11, 'F2'),
            $this->drawText(40, 588, 'Payment Reference: '.((string) ($invoice->payment_reference ?: 'N/A')), 11),

            $this->setStrokeColor(0.84, 0.91, 0.90),
            $this->drawLine(40, 562, 572, 562, 1.0),
            $this->setFillColor(0.05, 0.18, 0.17),
            $this->drawText(40, 540, 'Thank you for your payment.', 11),
            $this->drawText(40, 524, 'Issued by '.$companyName, 10),
        ];

        return $this->buildDocument($commands);
    }

    /**
     * @param  list<string>  $commands
     */
    private function buildDocument(array $commands): string
    {
        $stream = implode("\n", $commands);

        $objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
            '<< /Length '.strlen($stream)." >>\nstream\n{$stream}\nendstream",
        ];

        return $this->renderPdf($objects);
    }

    /**
     * @param  list<string>  $objects
     */
    private function renderPdf(array $objects): string
    {
        $pdf = "%PDF-1.4\n";
        $offsets = [];

        foreach ($objects as $index => $object) {
            $objectNumber = $index + 1;
            $offsets[$objectNumber] = strlen($pdf);
            $pdf .= "{$objectNumber} 0 obj\n{$object}\nendobj\n";
        }

        $xrefOffset = strlen($pdf);
        $size = count($objects) + 1;

        $pdf .= "xref\n0 {$size}\n";
        $pdf .= "0000000000 65535 f \n";

        foreach ($offsets as $offset) {
            $pdf .= sprintf("%010d 00000 n \n", $offset);
        }

        $pdf .= "trailer\n<< /Size {$size} /Root 1 0 R >>\n";
        $pdf .= "startxref\n{$xrefOffset}\n%%EOF";

        return $pdf;
    }

    /**
     * @return list<string>
     */
    private function wrapText(string $line, int $width = 70): array
    {
        $wrapped = wordwrap($line, $width, "\n", true);

        return explode("\n", $wrapped);
    }

    private function drawText(float $x, float $y, string $text, int $fontSize = 11, string $font = 'F1'): string
    {
        return sprintf(
            "BT\n/%s %d Tf\n1 0 0 1 %.2F %.2F Tm\n(%s) Tj\nET",
            $font,
            $fontSize,
            $x,
            $y,
            $this->escapePdfText($text),
        );
    }

    private function drawLine(float $x1, float $y1, float $x2, float $y2, float $width = 1.0): string
    {
        return sprintf("%.2F w\n%.2F %.2F m\n%.2F %.2F l\nS", $width, $x1, $y1, $x2, $y2);
    }

    private function drawRectangle(float $x, float $y, float $width, float $height, float $strokeWidth = 1.0): string
    {
        return sprintf("%.2F w\n%.2F %.2F %.2F %.2F re\nS", $strokeWidth, $x, $y, $width, $height);
    }

    private function setFillColor(float $r, float $g, float $b): string
    {
        return sprintf('%.3F %.3F %.3F rg', $r, $g, $b);
    }

    private function setStrokeColor(float $r, float $g, float $b): string
    {
        return sprintf('%.3F %.3F %.3F RG', $r, $g, $b);
    }

    private function formatCurrency(float $amount, string $currency): string
    {
        return strtoupper(trim($currency)).' '.number_format($amount, 2);
    }

    private function truncate(string $value, int $maxLength): string
    {
        if ($maxLength <= 3 || strlen($value) <= $maxLength) {
            return $value;
        }

        return substr($value, 0, $maxLength - 3).'...';
    }

    private function escapePdfText(string $value): string
    {
        $value = preg_replace('/[\r\n\t]+/', ' ', $value) ?? '';
        $value = preg_replace('/[^\x20-\x7E]/', '?', $value) ?? '';

        return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $value);
    }
}
