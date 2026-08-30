<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Mail\InvoiceIssuedMail;
use App\Mail\SupportTicketCreatedAdminAlertMail;
use App\Mail\SupportTicketCreatedCustomerMail;
use App\Mail\SupportTicketCustomerReplyAdminAlertMail;
use App\Models\Invoice;
use App\Models\ServiceOrder;
use App\Models\ServiceOrderUpdate;
use App\Models\SupportTicket;
use App\Models\SupportTicketMessage;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class UserWorkspaceController extends Controller
{
    public function orders(Request $request): Response
    {
        $user = $this->customerUser($request);

        $orders = ServiceOrder::query()
            ->where('user_id', $user->id)
            ->latest('id')
            ->limit(80)
            ->get();

        return Inertia::render('Dashboard/Orders', [
            'orders' => $orders->map(static function (ServiceOrder $order): array {
                return [
                    'id' => $order->id,
                    'order_code' => (string) ($order->order_code ?: $order->uuid),
                    'service_name' => (string) $order->service_name,
                    'package_name' => (string) $order->package_name,
                    'amount' => (float) $order->amount,
                    'currency' => (string) ($order->currency ?: 'NGN'),
                    'payment_status' => (string) $order->payment_status,
                    'order_status' => (string) $order->order_status,
                    'progress_percent' => (int) ($order->progress_percent ?? 0),
                    'created_at' => $order->created_at?->toDateString(),
                    'show_url' => route('orders.show', $order),
                    'can_renew' => $order->payment_status === 'paid',
                ];
            })->values()->all(),
            'stats' => [
                'total' => $orders->count(),
                'active' => $orders->whereNotIn('order_status', ['completed', 'cancelled'])->count(),
                'completed' => $orders->where('order_status', 'completed')->count(),
                'unpaid' => $orders->whereIn('payment_status', ['pending', 'unpaid'])->count(),
            ],
        ]);
    }

    public function renewOrder(Request $request, ServiceOrder $serviceOrder): RedirectResponse
    {
        $user = $this->customerUser($request);

        abort_unless($serviceOrder->user_id === $user->id, 403);

        if ($serviceOrder->payment_status !== 'paid') {
            return back()->with('error', 'Only paid orders can be renewed.');
        }

        $guardKey = 'service-order:renew:'.$serviceOrder->id;

        if (! Cache::add($guardKey, now()->timestamp, now()->addSeconds(12))) {
            return back()->with('error', 'Duplicate renewal trigger detected. Please wait a moment before trying again.');
        }

        $newOrder = null;
        $newInvoice = null;

        try {
            DB::transaction(function () use ($serviceOrder, $user, $request, &$newOrder, &$newInvoice): void {
                $newOrder = ServiceOrder::create([
                    'uuid' => (string) Str::uuid(),
                    'order_code' => $this->generateOrderCode(),
                    'user_id' => $user->id,
                    'customer_id' => $serviceOrder->customer_id,
                    'service_slug' => $serviceOrder->service_slug,
                    'service_name' => $serviceOrder->service_name,
                    'package_code' => $serviceOrder->package_code,
                    'package_name' => $serviceOrder->package_name,
                    'currency' => $serviceOrder->currency,
                    'base_amount' => $serviceOrder->amount,
                    'amount' => $serviceOrder->amount,
                    'payment_provider' => $serviceOrder->payment_provider ?: 'paystack',
                    'payment_status' => 'pending',
                    'order_status' => 'awaiting_payment',
                    'progress_percent' => 5,
                    'full_name' => $serviceOrder->full_name,
                    'email' => $serviceOrder->email,
                    'phone' => $serviceOrder->phone,
                    'business_name' => $serviceOrder->business_name,
                    'position' => $serviceOrder->position,
                    'business_website' => $serviceOrder->business_website,
                    'project_summary' => $serviceOrder->project_summary,
                    'project_goals' => $serviceOrder->project_goals,
                    'target_audience' => $serviceOrder->target_audience,
                    'preferred_style' => $serviceOrder->preferred_style,
                    'deliverables' => $serviceOrder->deliverables,
                    'additional_details' => $serviceOrder->additional_details,
                    'brief_payload' => $serviceOrder->brief_payload,
                    'wants_account' => false,
                    'created_by_ip' => $request->ip(),
                    'user_agent' => Str::limit((string) $request->userAgent(), 1000),
                ]);

                $newInvoice = Invoice::create([
                    'invoice_number' => $this->generateInvoiceNumber(),
                    'customer_id' => $serviceOrder->customer_id,
                    'customer_name' => $serviceOrder->full_name,
                    'customer_email' => $serviceOrder->email,
                    'title' => $serviceOrder->service_name.' - '.$serviceOrder->package_name.' (Renewal)',
                    'description' => 'Renewal of order '.$serviceOrder->order_code.'.',
                    'amount' => $serviceOrder->amount,
                    'currency' => $serviceOrder->currency,
                    'due_date' => now()->addDays(7)->toDateString(),
                    'status' => 'sent',
                    'issued_at' => now(),
                    'created_by' => $user->id,
                ]);

                $newOrder->update(['invoice_id' => $newInvoice->id]);

                ServiceOrderUpdate::create([
                    'service_order_id' => $newOrder->id,
                    'status' => 'awaiting_payment',
                    'progress_percent' => 5,
                    'note' => 'Renewal order created from '.$serviceOrder->order_code.' and is awaiting payment confirmation.',
                    'is_public' => true,
                    'created_by' => $user->id,
                ]);
            });
        } catch (Throwable $exception) {
            Cache::forget($guardKey);

            Log::warning('Service order renewal failed.', [
                'service_order_id' => $serviceOrder->id,
                'user_id' => $user->id,
                'error' => $exception->getMessage(),
            ]);

            return back()->with('error', 'Unable to create a renewal order right now. Please try again.');
        }

        try {
            Mail::to($newOrder->email)->send(new InvoiceIssuedMail($newInvoice));
        } catch (Throwable $exception) {
            Log::warning('Renewal invoice email failed.', [
                'service_order_id' => $newOrder->id,
                'invoice_id' => $newOrder->invoice_id,
                'error' => $exception->getMessage(),
            ]);
        }

        return redirect()
            ->route('orders.show', $newOrder)
            ->with('success', 'Renewal order created. Complete payment to get started.');
    }

    public function referrals(Request $request): Response
    {
        $user = $this->customerUser($request);

        $orders = ServiceOrder::query()
            ->where('user_id', $user->id)
            ->latest('id')
            ->get(['id', 'created_at', 'order_status']);

        $completedOrders = $orders->where('order_status', 'completed')->count();
        $estimatedDiscount = round($completedOrders * 15, 2);

        $monthly = collect(range(5, 0))
            ->map(function (int $offset) use ($orders): array {
                $pointDate = now()->subMonths($offset);
                $count = $orders->filter(
                    static fn (ServiceOrder $order): bool => $order->created_at?->isSameMonth($pointDate) ?? false
                )->count();

                return [
                    'month' => $pointDate->format('M'),
                    'referred' => max(0, (int) floor($count / 2)),
                ];
            })
            ->values()
            ->all();

        return Inertia::render('Dashboard/Referrals', [
            'referral' => [
                'link' => url('/register?ref='.($user->uuid ?: $user->id)),
                'completed_orders' => $completedOrders,
                'estimated_discount' => $estimatedDiscount,
                'monthly' => $monthly,
            ],
        ]);
    }

    public function hires(Request $request): Response
    {
        $user = $this->customerUser($request);

        $activeOrders = ServiceOrder::query()
            ->where('user_id', $user->id)
            ->whereNotIn('order_status', ['completed', 'cancelled'])
            ->latest('id')
            ->limit(12)
            ->get();

        return Inertia::render('Dashboard/Hires', [
            'team_summary' => [
                'active_hires' => $activeOrders->count(),
                'last_update_at' => $activeOrders->first()?->updated_at?->toDateTimeString(),
            ],
            'active_hires' => $activeOrders->map(static function (ServiceOrder $order): array {
                return [
                    'id' => $order->id,
                    'title' => trim("{$order->service_name} · {$order->package_name}"),
                    'progress_percent' => (int) ($order->progress_percent ?? 0),
                    'status' => (string) $order->order_status,
                    'show_url' => route('orders.show', $order),
                ];
            })->values()->all(),
        ]);
    }

    public function support(Request $request): Response
    {
        $user = $this->customerUser($request);

        $tickets = SupportTicket::query()
            ->where('user_id', $user->id)
            ->with([
                'messages' => static fn ($query) => $query
                    ->with('user:id,name')
                    ->oldest('id'),
            ])
            ->latest('id')
            ->limit(40)
            ->get();

        $selectedTicket = null;
        $selectedTicketId = (int) $request->integer('ticket');
        if ($selectedTicketId > 0) {
            $selectedTicket = $tickets->firstWhere('id', $selectedTicketId);
        }
        if (! $selectedTicket) {
            $selectedTicket = $tickets->first();
        }

        $updates = ServiceOrderUpdate::query()
            ->where('is_public', true)
            ->whereHas('serviceOrder', static fn (Builder $query) => $query->where('user_id', $user->id))
            ->with(['serviceOrder:id,order_code,uuid,service_name,package_name'])
            ->latest('id')
            ->limit(12)
            ->get()
            ->map(static function (ServiceOrderUpdate $update): array {
                $order = $update->serviceOrder;

                return [
                    'id' => $update->id,
                    'note' => (string) $update->update_note,
                    'created_at' => $update->created_at?->toDateTimeString(),
                    'order_label' => $order ? trim(($order->order_code ?: $order->uuid).' · '.$order->service_name) : 'Order update',
                ];
            })
            ->values()
            ->all();

        return Inertia::render('Dashboard/Support', [
            'support' => [
                'open_tickets' => $tickets->where('status', SupportTicket::STATUS_OPEN)->count(),
                'awaiting_customer' => $tickets->where('status', SupportTicket::STATUS_AWAITING_CUSTOMER)->count(),
                'closed_tickets' => $tickets->where('status', SupportTicket::STATUS_CLOSED)->count(),
            ],
            'priorities' => SupportTicket::priorities(),
            'tickets' => $tickets->map(function (SupportTicket $ticket): array {
                return [
                    'id' => $ticket->id,
                    'ticket_number' => (string) $ticket->ticket_number,
                    'subject' => (string) $ticket->subject,
                    'priority' => (string) $ticket->priority,
                    'status' => (string) $ticket->status,
                    'last_customer_reply_at' => $ticket->last_customer_reply_at?->toDateTimeString(),
                    'last_staff_reply_at' => $ticket->last_staff_reply_at?->toDateTimeString(),
                    'created_at' => $ticket->created_at?->toDateTimeString(),
                    'updated_at' => $ticket->updated_at?->toDateTimeString(),
                    'messages' => $ticket->messages->map(function (SupportTicketMessage $message): array {
                        $attachmentUrl = null;
                        if (is_string($message->attachment_path) && trim($message->attachment_path) !== '') {
                            $attachmentUrl = Storage::disk('public')->url($message->attachment_path);
                        }

                        return [
                            'id' => $message->id,
                            'sender_type' => (string) $message->sender_type,
                            'sender_name' => (string) ($message->user?->name ?: ucfirst((string) $message->sender_type)),
                            'message' => $this->sanitizeSupportMessageHtml((string) $message->message),
                            'attachment_name' => (string) ($message->attachment_name ?: ''),
                            'attachment_url' => $attachmentUrl,
                            'created_at' => $message->created_at?->toDateTimeString(),
                        ];
                    })->values()->all(),
                ];
            })->values()->all(),
            'active_ticket_id' => $selectedTicket?->id,
            'updates' => $updates,
        ]);
    }

    public function storeSupportTicket(Request $request): RedirectResponse
    {
        $user = $this->customerUser($request);

        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:180'],
            'priority' => ['required', Rule::in(SupportTicket::priorities())],
            'message' => ['required', 'string', 'max:20000'],
            'attachment' => ['nullable', 'image', 'max:5120'],
        ]);

        $messageHtml = $this->sanitizeSupportMessageHtml((string) $validated['message']);

        if ($this->supportMessagePlainText($messageHtml) === '') {
            return back()->withErrors([
                'message' => 'Please write a message before creating a ticket.',
            ])->withInput();
        }

        $attachment = $request->file('attachment');
        $attachmentPath = $attachment?->store('support-tickets', 'public');

        /** @var SupportTicket $ticket */
        $ticket = DB::transaction(function () use ($validated, $user, $messageHtml, $attachmentPath, $attachment): SupportTicket {
            $ticket = SupportTicket::query()->create([
                'user_id' => $user->id,
                'subject' => trim((string) $validated['subject']),
                'priority' => (string) $validated['priority'],
                'status' => SupportTicket::STATUS_OPEN,
                'last_customer_reply_at' => now(),
                'last_staff_reply_at' => null,
                'closed_at' => null,
            ]);

            $ticket->messages()->create([
                'user_id' => $user->id,
                'sender_type' => SupportTicketMessage::SENDER_CUSTOMER,
                'message' => $messageHtml,
                'attachment_path' => $attachmentPath,
                'attachment_name' => $attachment ? Str::limit((string) $attachment->getClientOriginalName(), 255, '') : null,
            ]);

            return $ticket->fresh(['user', 'messages.user']) ?? $ticket;
        });

        $this->sendTicketCreatedEmails($ticket);

        return back()->with('success', 'Support ticket created. Our team has been notified.');
    }

    public function replySupportTicket(Request $request, SupportTicket $ticket): RedirectResponse
    {
        $user = $this->customerUser($request);
        abort_unless($ticket->user_id === $user->id, 403);

        $validated = $request->validate([
            'message' => ['required', 'string', 'max:20000'],
            'attachment' => ['nullable', 'image', 'max:5120'],
        ]);

        $messageHtml = $this->sanitizeSupportMessageHtml((string) $validated['message']);

        if ($this->supportMessagePlainText($messageHtml) === '') {
            return back()->withErrors([
                'message' => 'Please write a message before sending your reply.',
            ])->withInput();
        }

        $attachment = $request->file('attachment');
        $attachmentPath = $attachment?->store('support-tickets', 'public');

        /** @var SupportTicketMessage $message */
        $message = DB::transaction(function () use ($user, $ticket, $messageHtml, $attachmentPath, $attachment): SupportTicketMessage {
            $message = $ticket->messages()->create([
                'user_id' => $user->id,
                'sender_type' => SupportTicketMessage::SENDER_CUSTOMER,
                'message' => $messageHtml,
                'attachment_path' => $attachmentPath,
                'attachment_name' => $attachment ? Str::limit((string) $attachment->getClientOriginalName(), 255, '') : null,
            ]);

            $ticket->forceFill([
                'status' => SupportTicket::STATUS_OPEN,
                'last_customer_reply_at' => now(),
                'closed_at' => null,
            ])->save();

            return $message;
        });

        $this->sendCustomerReplyAdminAlert($ticket->fresh(['user']) ?? $ticket, $message);

        return back()->with('success', 'Your reply has been sent to support.');
    }

    private function customerUser(Request $request): User
    {
        $user = $request->user();

        abort_unless($user && ! $user->isStaff(), 403);

        return $user;
    }

    private function sendTicketCreatedEmails(SupportTicket $ticket): void
    {
        try {
            if ($ticket->user && is_string($ticket->user->email) && trim($ticket->user->email) !== '') {
                Mail::to($ticket->user->email)->send(new SupportTicketCreatedCustomerMail($ticket));
            }

            $adminRecipients = $this->supportAdminRecipients();
            if ($adminRecipients !== []) {
                Mail::to($adminRecipients)->send(new SupportTicketCreatedAdminAlertMail($ticket));
            }
        } catch (Throwable $exception) {
            Log::warning('Support ticket created email dispatch failed.', [
                'ticket_id' => $ticket->id,
                'ticket_number' => $ticket->ticket_number,
                'error' => $exception->getMessage(),
            ]);
        }
    }

    private function sendCustomerReplyAdminAlert(SupportTicket $ticket, SupportTicketMessage $message): void
    {
        $adminRecipients = $this->supportAdminRecipients();
        if ($adminRecipients === []) {
            return;
        }

        try {
            Mail::to($adminRecipients)->send(new SupportTicketCustomerReplyAdminAlertMail($ticket, $message));
        } catch (Throwable $exception) {
            Log::warning('Support ticket customer reply admin email failed.', [
                'ticket_id' => $ticket->id,
                'ticket_number' => $ticket->ticket_number,
                'message_id' => $message->id,
                'error' => $exception->getMessage(),
            ]);
        }
    }

    /**
     * @return array<int, string>
     */
    private function supportAdminRecipients(): array
    {
        $configured = (array) config('bellah.support.admin_notification_emails', []);
        $recipients = array_values(array_unique(array_filter(array_map(
            static fn (mixed $email): string => strtolower(trim((string) $email)),
            $configured,
        ))));

        if ($recipients !== []) {
            return $recipients;
        }

        return User::query()
            ->whereIn('role', [User::ROLE_SUPER_ADMIN, User::ROLE_CUSTOMER_REP, 'admin', 'staff'])
            ->whereNotNull('email')
            ->pluck('email')
            ->map(static fn (string $email): string => strtolower(trim($email)))
            ->filter(static fn (string $email): bool => $email !== '')
            ->unique()
            ->values()
            ->all();
    }

    private function sanitizeSupportMessageHtml(string $rawMessage): string
    {
        $trimmed = trim($rawMessage);
        if ($trimmed === '') {
            return '';
        }

        $allowedTags = '<p><br><strong><em><u><s><ul><ol><li><blockquote><h2><h3><h4>';
        $sanitized = strip_tags($trimmed, $allowedTags);
        $sanitized = preg_replace('/<([a-z0-9]+)\b[^>]*>/i', '<$1>', $sanitized) ?? $sanitized;
        $sanitized = trim($sanitized);

        return $sanitized === '<p><br></p>' ? '' : $sanitized;
    }

    private function supportMessagePlainText(string $messageHtml): string
    {
        return trim(preg_replace('/\s+/u', ' ', strip_tags($messageHtml)) ?? '');
    }

    private function generateOrderCode(): string
    {
        do {
            $orderCode = 'BO'.strtoupper(Str::random(6));
        } while (ServiceOrder::query()->where('order_code', $orderCode)->exists());

        return $orderCode;
    }

    private function generateInvoiceNumber(): string
    {
        $startNumber = 200;

        $highestNumericInvoiceNumber = Invoice::query()
            ->pluck('invoice_number')
            ->map(static fn (mixed $invoiceNumber): string => trim((string) $invoiceNumber))
            ->filter(static fn (string $invoiceNumber): bool => ctype_digit($invoiceNumber))
            ->map(static fn (string $invoiceNumber): int => (int) $invoiceNumber)
            ->max();

        $nextNumber = max(
            $startNumber,
            ($highestNumericInvoiceNumber ?? ($startNumber - 1)) + 1,
        );

        do {
            $number = (string) $nextNumber;
            $nextNumber++;
        } while (Invoice::query()->where('invoice_number', $number)->exists());

        return $number;
    }
}
