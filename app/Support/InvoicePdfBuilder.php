<?php

namespace App\Support;

use App\Models\Invoice;
use Dompdf\Dompdf;
use Dompdf\Options;

class InvoicePdfBuilder
{
    public function buildInvoice(Invoice $invoice): string
    {
        $companyName = (string) config('bellah.invoice.company_name', 'Bellah Options');
        $invoiceDate = $invoice->issued_at?->format('d/m/Y') ?? now()->format('d/m/Y');
        $dueDate = $invoice->due_date?->format('d/m/Y') ?? $invoiceDate;
        $amount = (float) $invoice->amount;
        $invoice->loadMissing('customer:id,address,company');

        $description = trim((string) $invoice->title) !== '' ? (string) $invoice->title : 'Service';

        if (filled($invoice->description)) {
            $description .= ' - '.trim((string) $invoice->description);
        }

        $customerAddress = trim((string) ($invoice->customer?->address ?? ''));
        $customerCompany = trim((string) ($invoice->customer?->company ?? ''));
        $customerEmail = trim((string) $invoice->customer_email);
        $customerName = trim((string) $invoice->customer_name) !== '' ? trim((string) $invoice->customer_name) : 'Client';

        $recipientLines = array_values(array_filter([
            $customerName,
            $customerCompany !== '' ? 'ATTN: '.$customerCompany : null,
            ...preg_split('/\r\n|\r|\n/', $customerAddress) ?: [],
            $customerEmail !== '' ? $customerEmail : null,
        ], static fn (?string $line): bool => filled($line)));

        $subtotal = $amount;
        $vatRate = max(0, (float) config('bellah.invoice.vat_rate', 0));
        $vatAmount = ($subtotal * $vatRate) / 100;
        $creditAmount = 0.0;
        $total = $subtotal + $vatAmount - $creditAmount;
        $balance = $invoice->status === 'paid' ? 0.0 : $total;

        $logoDataUri = $this->buildLogoDataUri(public_path('logo-06.svg'));

        $html = view('pdfs.invoice', [
            'invoice' => $invoice,
            'companyName' => $companyName,
            'invoiceDate' => $invoiceDate,
            'dueDate' => $dueDate,
            'logoDataUri' => $logoDataUri,
            'statusLabel' => $invoice->status === 'paid' ? 'PAID' : 'UNPAID',
            'recipientLines' => $recipientLines,
            'description' => $description,
            'subtotal' => $this->formatCurrency($subtotal, (string) $invoice->currency),
            'vatRate' => $vatRate,
            'vatAmount' => $this->formatCurrency($vatAmount, (string) $invoice->currency),
            'credit' => $this->formatCurrency($creditAmount, (string) $invoice->currency),
            'total' => $this->formatCurrency($total, (string) $invoice->currency),
            'balance' => $this->formatCurrency($balance, (string) $invoice->currency),
            'generatedAt' => now()->format('d/m/Y'),
        ])->render();

        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', false);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->loadHtml($html);
        $dompdf->render();

        return $dompdf->output();
    }

    public function buildReceipt(Invoice $invoice): string
    {
        $companyName = (string) config('bellah.invoice.company_name', 'Bellah Options');
        $invoiceDate = $invoice->issued_at?->format('d/m/Y') ?? now()->format('d/m/Y');
        $receiptDate = $invoice->paid_at?->format('d/m/Y') ?? now()->format('d/m/Y');
        $dueDate = $invoice->due_date?->format('d/m/Y') ?? $invoiceDate;
        $amount = (float) $invoice->amount;
        $invoice->loadMissing('customer:id,address,company');

        $description = trim((string) $invoice->title) !== '' ? (string) $invoice->title : 'Service';

        if (filled($invoice->description)) {
            $description .= ' - '.trim((string) $invoice->description);
        }

        $customerAddress = trim((string) ($invoice->customer?->address ?? ''));
        $customerCompany = trim((string) ($invoice->customer?->company ?? ''));
        $customerEmail = trim((string) $invoice->customer_email);
        $customerName = trim((string) $invoice->customer_name) !== '' ? trim((string) $invoice->customer_name) : 'Client';

        $recipientLines = array_values(array_filter([
            $customerName,
            $customerCompany !== '' ? 'ATTN: '.$customerCompany : null,
            ...preg_split('/\r\n|\r|\n/', $customerAddress) ?: [],
            $customerEmail !== '' ? $customerEmail : null,
        ], static fn (?string $line): bool => filled($line)));

        $subtotal = $amount;
        $vatRate = max(0, (float) config('bellah.invoice.vat_rate', 0));
        $vatAmount = ($subtotal * $vatRate) / 100;
        $creditAmount = 0.0;
        $total = $subtotal + $vatAmount - $creditAmount;
        $paidAmount = $invoice->status === 'paid' ? $total : 0.0;
        $balance = max(0, $total - $paidAmount);
        $paymentReference = trim((string) ($invoice->payment_reference ?: 'N/A'));
        $logoDataUri = $this->buildLogoDataUri(public_path('logo-06.svg'));

        $html = view('pdfs.receipt', [
            'invoice' => $invoice,
            'companyName' => $companyName,
            'invoiceDate' => $invoiceDate,
            'receiptDate' => $receiptDate,
            'dueDate' => $dueDate,
            'logoDataUri' => $logoDataUri,
            'statusLabel' => 'PAID',
            'recipientLines' => $recipientLines,
            'description' => $description,
            'subtotal' => $this->formatCurrency($subtotal, (string) $invoice->currency),
            'vatRate' => $vatRate,
            'vatAmount' => $this->formatCurrency($vatAmount, (string) $invoice->currency),
            'credit' => $this->formatCurrency($creditAmount, (string) $invoice->currency),
            'total' => $this->formatCurrency($total, (string) $invoice->currency),
            'paidAmount' => $this->formatCurrency($paidAmount, (string) $invoice->currency),
            'balance' => $this->formatCurrency($balance, (string) $invoice->currency),
            'paymentReference' => $paymentReference,
            'generatedAt' => now()->format('d/m/Y'),
        ])->render();

        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', false);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->loadHtml($html);
        $dompdf->render();

        return $dompdf->output();
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
        $code = strtoupper(trim($currency));

        return match ($code) {
            'NGN' => 'N'.number_format($amount, 2),
            'USD' => '$'.number_format($amount, 2),
            'EUR' => 'EUR '.number_format($amount, 2),
            'GBP' => 'GBP '.number_format($amount, 2),
            default => $code.' '.number_format($amount, 2),
        };
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

    private function buildLogoDataUri(string $logoPath): ?string
    {
        if (! is_file($logoPath) || ! is_readable($logoPath)) {
            return null;
        }

        $logoContents = file_get_contents($logoPath);

        if ($logoContents === false) {
            return null;
        }

        return 'data:image/svg+xml;base64,'.base64_encode($logoContents);
    }
}
