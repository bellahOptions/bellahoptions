<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\SupportTicketStaffReplyMail;
use App\Models\SupportTicket;
use App\Models\SupportTicketMessage;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class SupportTicketController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless((bool) $request->user()?->isStaff(), 403);

        $statusFilter = trim((string) $request->query('status', 'all'));

        $tickets = SupportTicket::query()
            ->with([
                'user:id,name,email',
                'messages' => static fn (Builder $query) => $query
                    ->with('user:id,name')
                    ->oldest('id'),
            ])
            ->when($statusFilter !== 'all', static fn (Builder $query) => $query->where('status', $statusFilter))
            ->latest('id')
            ->limit(100)
            ->get();

        $selectedTicket = null;
        $selectedTicketId = (int) $request->integer('ticket');
        if ($selectedTicketId > 0) {
            $selectedTicket = $tickets->firstWhere('id', $selectedTicketId);
        }
        if (! $selectedTicket) {
            $selectedTicket = $tickets->first();
        }

        return Inertia::render('Admin/SupportTickets/Index', [
            'filters' => [
                'status' => $statusFilter,
            ],
            'statuses' => SupportTicket::statuses(),
            'priorities' => SupportTicket::priorities(),
            'summary' => [
                'open' => SupportTicket::query()->where('status', SupportTicket::STATUS_OPEN)->count(),
                'awaiting_customer' => SupportTicket::query()->where('status', SupportTicket::STATUS_AWAITING_CUSTOMER)->count(),
                'closed' => SupportTicket::query()->where('status', SupportTicket::STATUS_CLOSED)->count(),
            ],
            'tickets' => $tickets->map(function (SupportTicket $ticket): array {
                return [
                    'id' => $ticket->id,
                    'ticket_number' => (string) $ticket->ticket_number,
                    'subject' => (string) $ticket->subject,
                    'priority' => (string) $ticket->priority,
                    'status' => (string) $ticket->status,
                    'customer' => [
                        'id' => $ticket->user?->id,
                        'name' => (string) ($ticket->user?->name ?: 'Unknown'),
                        'email' => (string) ($ticket->user?->email ?: ''),
                    ],
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
        ]);
    }

    public function reply(Request $request, SupportTicket $ticket): RedirectResponse
    {
        $staff = $request->user();
        abort_unless($staff && $staff->isStaff(), 403);

        $validated = $request->validate([
            'message' => ['required', 'string', 'max:20000'],
        ]);

        $messageHtml = $this->sanitizeSupportMessageHtml((string) $validated['message']);

        if ($this->supportMessagePlainText($messageHtml) === '') {
            return back()->withErrors([
                'message' => 'Please write a reply before sending.',
            ])->withInput();
        }

        /** @var SupportTicketMessage $message */
        $message = DB::transaction(function () use ($staff, $ticket, $messageHtml): SupportTicketMessage {
            $message = $ticket->messages()->create([
                'user_id' => $staff->id,
                'sender_type' => SupportTicketMessage::SENDER_STAFF,
                'message' => $messageHtml,
            ]);

            $ticket->forceFill([
                'status' => SupportTicket::STATUS_AWAITING_CUSTOMER,
                'last_staff_reply_at' => now(),
            ])->save();

            return $message;
        });

        $ticket->loadMissing('user');
        $this->sendStaffReplyEmail($ticket, $message);

        return back()->with('success', 'Reply sent to customer.');
    }

    public function updateStatus(Request $request, SupportTicket $ticket): RedirectResponse
    {
        $staff = $request->user();
        abort_unless($staff && $staff->isStaff(), 403);

        $validated = $request->validate([
            'status' => ['required', Rule::in(SupportTicket::statuses())],
        ]);

        $status = (string) $validated['status'];

        $ticket->forceFill([
            'status' => $status,
            'closed_at' => $status === SupportTicket::STATUS_CLOSED ? now() : null,
        ])->save();

        return back()->with('success', 'Ticket status updated.');
    }

    private function sendStaffReplyEmail(SupportTicket $ticket, SupportTicketMessage $message): void
    {
        if (! $ticket->user || ! is_string($ticket->user->email) || trim($ticket->user->email) === '') {
            return;
        }

        try {
            Mail::to($ticket->user->email)->send(new SupportTicketStaffReplyMail($ticket, $message));
        } catch (Throwable $exception) {
            Log::warning('Support ticket staff reply email failed.', [
                'ticket_id' => $ticket->id,
                'ticket_number' => $ticket->ticket_number,
                'message_id' => $message->id,
                'error' => $exception->getMessage(),
            ]);
        }
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
}
