<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Invoice #{{ $invoice->invoice_number }}</title>
    <style>
        @page {
            margin: 26px;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            color: #182433;
            font-family: DejaVu Sans, Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
        }

        .sheet {
            border: 1px solid #d9e0e7;
            padding: 22px;
            position: relative;
        }

        .status {
            position: absolute;
            top: 18px;
            right: 20px;
            padding: 6px 14px;
            border: 2px solid #dd4b39;
            color: #dd4b39;
            font-size: 15px;
            font-weight: 700;
            letter-spacing: 2px;
            transform: rotate(14deg);
        }

        .status.paid {
            border-color: #11845b;
            color: #11845b;
        }

        .header {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
        }

        .header td {
            vertical-align: top;
        }

        .logo {
            width: 145px;
            margin: 0 0 8px;
        }

        .company-fallback {
            margin: 0 0 8px;
            font-size: 22px;
            font-weight: 700;
            color: #0f1f33;
        }

        .company-line {
            margin: 0;
            color: #5f6d7c;
            font-size: 11px;
        }

        .payment-tip {
            text-align: right;
            color: #5f6d7c;
            font-size: 10px;
            width: 260px;
            padding-top: 2px;
        }

        .title {
            margin: 10px 0 2px;
            font-size: 22px;
            font-weight: 700;
            color: #0f1f33;
        }

        .meta {
            margin: 0;
            color: #344152;
            font-size: 12px;
        }

        .section-title {
            margin: 16px 0 6px;
            font-size: 13px;
            font-weight: 700;
            color: #0f1f33;
        }

        .invoiced-to {
            margin-bottom: 14px;
        }

        .invoiced-line {
            margin: 0;
            color: #344152;
            font-size: 12px;
        }

        .items {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
        }

        .items th,
        .items td {
            border-top: 1px solid #d9e0e7;
            border-bottom: 1px solid #d9e0e7;
            padding: 8px 10px;
            font-size: 12px;
        }

        .items th {
            text-align: left;
            background: #f7f9fb;
            color: #344152;
            font-weight: 700;
        }

        .items td:last-child,
        .items th:last-child {
            width: 170px;
            text-align: right;
        }

        .totals {
            width: 270px;
            border-collapse: collapse;
            margin: 10px 0 0 auto;
        }

        .totals td {
            padding: 4px 0;
            font-size: 12px;
            color: #344152;
        }

        .totals td:last-child {
            text-align: right;
            font-weight: 700;
            color: #0f1f33;
        }

        .totals .grand td {
            border-top: 1px solid #d9e0e7;
            padding-top: 8px;
            font-size: 13px;
            font-weight: 700;
            color: #0f1f33;
        }

        .transactions {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
        }

        .transactions th,
        .transactions td {
            border-top: 1px solid #d9e0e7;
            border-bottom: 1px solid #d9e0e7;
            padding: 8px 6px;
            font-size: 11px;
            text-align: left;
        }

        .transactions th:last-child,
        .transactions td:last-child {
            text-align: right;
        }

        .transactions-empty {
            text-align: center !important;
            color: #5f6d7c;
            font-style: italic;
        }

        .balance {
            width: 230px;
            margin: 8px 0 0 auto;
            border-top: 1px solid #d9e0e7;
            padding-top: 6px;
            text-align: right;
            font-size: 13px;
            color: #0f1f33;
            font-weight: 700;
        }

        .generated {
            margin: 18px 0 0;
            text-align: center;
            color: #7b8794;
            font-size: 10px;
        }
    </style>
</head>
<body>
    <div class="sheet">
        <div class="status {{ $statusLabel === 'PAID' ? 'paid' : '' }}">{{ $statusLabel }}</div>

        <table class="header">
            <tr>
                <td>
                    @if($logoDataUri)
                        <img src="{{ $logoDataUri }}" alt="Bellah Options" class="logo">
                    @else
                        <p class="company-fallback">{{ $companyName }}</p>
                    @endif
                    <p class="company-line">Baba Ode, Onibukun Ota</p>
                    <p class="company-line">Ogun State, NG (BN3668420)</p>
                    <p class="company-line">(234) 810 867 1804</p>
                </td>
                <td class="payment-tip">
                    To transfer from your bank account, use your preferred transfer method
                    and include the invoice number as payment reference.
                </td>
            </tr>
        </table>

        <p class="title">Invoice #{{ $invoice->invoice_number }}</p>
        <p class="meta">Invoice Date: {{ $invoiceDate }}</p>
        <p class="meta">Due Date: {{ $dueDate }}</p>

        <p class="section-title">Invoiced To</p>
        <div class="invoiced-to">
            @forelse($recipientLines as $line)
                <p class="invoiced-line">{{ $line }}</p>
            @empty
                <p class="invoiced-line">Client details unavailable.</p>
            @endforelse
        </div>

        <table class="items">
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>{{ $description }}</td>
                    <td>{{ $subtotal }}</td>
                </tr>
            </tbody>
        </table>

        <table class="totals">
            <tr>
                <td>Sub Total</td>
                <td>{{ $subtotal }}</td>
            </tr>
            <tr>
                <td>{{ number_format($vatRate, 2) }}% VAT</td>
                <td>{{ $vatAmount }}</td>
            </tr>
            <tr>
                <td>Credit</td>
                <td>{{ $credit }}</td>
            </tr>
            <tr class="grand">
                <td>Total</td>
                <td>{{ $total }}</td>
            </tr>
        </table>

        <p class="section-title">Transactions</p>
        <table class="transactions">
            <thead>
                <tr>
                    <th>Transaction Date</th>
                    <th>Gateway</th>
                    <th>Transaction ID</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td colspan="4" class="transactions-empty">No Related Transactions Found</td>
                </tr>
            </tbody>
        </table>

        <p class="balance">Balance: {{ $balance }}</p>
        <p class="generated">PDF Generated on {{ $generatedAt }}</p>
    </div>
</body>
</html>
