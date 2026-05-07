<?php

namespace App\Http\Controllers\LiveChat;

use App\Http\Controllers\Controller;
use App\Models\LiveChatMessage;
use App\Models\LiveChatStaffPresence;
use App\Models\LiveChatThread;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class StaffChatController extends Controller
{
    public function index(Request $request): Response
    {
        $this->touchPresence($request);

        return Inertia::render('Admin/LiveChat/Index', [
            'selectedThreadId' => $request->integer('thread_id') ?: null,
        ]);
    }

    public function overview(Request $request): JsonResponse
    {
        $this->touchPresence($request);

        $validated = $request->validate([
            'thread_id' => ['nullable', 'integer', 'min:1'],
            'after_id' => ['nullable', 'integer', 'min:0'],
        ]);

        $staffId = (int) $request->user()?->id;
        $threads = LiveChatThread::query()
            ->where('assigned_staff_id', $staffId)
            ->with([
                'customerUser:id,name,email',
                'assignedStaff:id,name',
                'latestMessage',
                'latestMessage.reactions',
            ])
            ->withCount(['messages as unread_count' => function ($query): void {
                $query
                    ->where('sender_type', 'customer')
                    ->where(function ($unreadQuery): void {
                        $unreadQuery
                            ->whereNull('live_chat_threads.staff_last_read_message_id')
                            ->orWhereColumn('live_chat_messages.id', '>', 'live_chat_threads.staff_last_read_message_id');
                    });
            }])
            ->orderByRaw("CASE WHEN status = 'open' THEN 0 ELSE 1 END")
            ->orderByDesc('last_message_at')
            ->orderByDesc('id')
            ->limit(80)
            ->get();

        $selectedThreadId = (int) ($validated['thread_id'] ?? ($threads->first()?->id ?? 0));
        $afterId = (int) ($validated['after_id'] ?? 0);
        $selectedThread = $selectedThreadId > 0
            ? LiveChatThread::query()
                ->where('assigned_staff_id', $staffId)
                ->with(['customerUser:id,name,email', 'assignedStaff:id,name'])
                ->find($selectedThreadId)
            : null;

        $messages = collect();
        if ($selectedThread) {
            $messagesQuery = $selectedThread->messages();

            if ($afterId > 0) {
                $messages = $messagesQuery
                    ->with('reactions')
                    ->where('id', '>', $afterId)
                    ->limit(120)
                    ->get();
            } else {
                $messages = $messagesQuery
                    ->with('reactions')
                    ->latest('id')
                    ->limit(80)
                    ->get()
                    ->reverse()
                    ->values();
            }

            $lastMessageId = $messages->last()?->id;
            if ($lastMessageId && (int) $selectedThread->staff_last_read_message_id < $lastMessageId) {
                $selectedThread->forceFill([
                    'staff_last_read_message_id' => $lastMessageId,
                    'assigned_staff_id' => $selectedThread->assigned_staff_id ?: $request->user()?->id,
                ])->save();
                $selectedThread->refresh();
            }
        }

        $onlineStaffIds = LiveChatStaffPresence::query()
            ->where('is_online', true)
            ->where('last_seen_at', '>=', now()->subMinute())
            ->pluck('user_id')
            ->all();

        $onlineStaff = User::query()
            ->whereIn('id', $onlineStaffIds)
            ->orderBy('name')
            ->get(['id', 'name', 'email'])
            ->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ])
            ->values();

        return response()->json([
            'threads' => $threads->map(fn (LiveChatThread $thread): array => $this->threadPayload($thread))->values(),
            'selected_thread' => $selectedThread ? $this->selectedThreadPayload($selectedThread) : null,
            'messages' => $messages->map(fn (LiveChatMessage $message): array => $this->messagePayload($message))->values(),
            'staff_presence' => [
                'online_staff_ids' => $onlineStaffIds,
                'online_staff' => $onlineStaff,
                'updated_at' => now()->toDateTimeString(),
            ],
        ]);
    }

    public function messages(Request $request, LiveChatThread $thread): JsonResponse
    {
        $this->touchPresence($request);
        $thread = $this->authorizeThreadAccess($request, $thread);

        $validated = $request->validate([
            'after_id' => ['nullable', 'integer', 'min:0'],
        ]);

        $afterId = (int) ($validated['after_id'] ?? 0);
        $messages = $thread->messages()
            ->with('reactions')
            ->when($afterId > 0, fn ($query) => $query->where('id', '>', $afterId))
            ->limit(120)
            ->get();

        $lastMessageId = $messages->last()?->id;
        if ($lastMessageId && (int) $thread->staff_last_read_message_id < $lastMessageId) {
            $thread->forceFill([
                'staff_last_read_message_id' => $lastMessageId,
                'assigned_staff_id' => $thread->assigned_staff_id ?: $request->user()?->id,
            ])->save();
        }

        return response()->json([
            'messages' => $messages->map(fn (LiveChatMessage $message): array => $this->messagePayload($message))->values(),
            'thread' => $this->selectedThreadPayload($thread->fresh(['customerUser:id,name,email', 'assignedStaff:id,name'])),
        ]);
    }

    public function send(Request $request, LiveChatThread $thread): JsonResponse
    {
        $this->touchPresence($request);
        $thread = $this->authorizeThreadAccess($request, $thread);

        $validated = $request->validate([
            'message' => ['required', 'string', 'min:1', 'max:2000'],
            'client_message_id' => ['nullable', 'string', 'min:8', 'max:80'],
        ]);

        $user = $request->user();
        $clientMessageId = trim((string) ($validated['client_message_id'] ?? ''));

        if ($clientMessageId !== '') {
            $deduplicated = $thread->messages()
                ->where('sender_type', 'staff')
                ->where('sender_user_id', $user?->id)
                ->where('client_message_id', $clientMessageId)
                ->first();

            if ($deduplicated) {
                return response()->json([
                    'deduplicated' => true,
                    'message' => $this->messagePayload($deduplicated->loadMissing('reactions')),
                    'thread' => $this->selectedThreadPayload($thread->fresh(['customerUser:id,name,email', 'assignedStaff:id,name'])),
                ]);
            }
        }

        $message = $thread->messages()->create([
            'sender_type' => 'staff',
            'sender_user_id' => $user?->id,
            'sender_name' => $user?->name ?? 'Support Team',
            'client_message_id' => $clientMessageId !== '' ? $clientMessageId : null,
            'body' => trim((string) $validated['message']),
        ]);

        $thread->forceFill([
            'assigned_staff_id' => $thread->assigned_staff_id ?: $user?->id,
            'status' => 'open',
            'closed_at' => null,
            'closed_by_type' => null,
            'closed_by_user_id' => null,
            'last_message_at' => now(),
            'last_staff_message_at' => now(),
            'staff_last_read_message_id' => $message->id,
            'staff_typing_at' => null,
        ])->save();

        return response()->json([
            'message' => $this->messagePayload($message->loadMissing('reactions')),
            'thread' => $this->selectedThreadPayload($thread->fresh(['customerUser:id,name,email', 'assignedStaff:id,name'])),
        ], 201);
    }

    public function updateStatus(Request $request, LiveChatThread $thread): JsonResponse
    {
        $this->touchPresence($request);
        $thread = $this->authorizeThreadAccess($request, $thread);

        $validated = $request->validate([
            'status' => ['required', 'in:open,closed'],
        ]);

        $wasOpen = $thread->status !== 'closed';
        $isClosed = $validated['status'] === 'closed';

        $thread->forceFill([
            'status' => $validated['status'],
            'closed_at' => $isClosed ? now() : null,
            'closed_by_type' => $isClosed ? 'staff' : null,
            'closed_by_user_id' => $isClosed ? $request->user()?->id : null,
            'customer_typing_at' => $isClosed ? null : $thread->customer_typing_at,
            'staff_typing_at' => $isClosed ? null : $thread->staff_typing_at,
        ])->save();

        if ($isClosed && $wasOpen) {
            $thread->messages()->create([
                'sender_type' => 'staff',
                'sender_user_id' => $request->user()?->id,
                'sender_name' => 'System',
                'body' => 'This chat was closed by staff. A transcript has been shared with both parties.',
            ]);
            $this->sendTranscript($thread->fresh(['customerUser:id,name,email', 'assignedStaff:id,name,email']));
        }

        return response()->json([
            'thread' => $this->selectedThreadPayload($thread->fresh(['customerUser:id,name,email', 'assignedStaff:id,name'])),
        ])->withCookie(Cookie::forget('chat_token'));
    }

    public function join(Request $request, LiveChatThread $thread): JsonResponse
    {
        $this->touchPresence($request);
        $thread = $this->authorizeThreadAccess($request, $thread, true);

        $staff = $request->user();
        $thread->forceFill([
            'assigned_staff_id' => $staff?->id,
            'status' => 'open',
            'closed_at' => null,
            'closed_by_type' => null,
            'closed_by_user_id' => null,
        ])->save();

        return response()->json([
            'thread' => $this->selectedThreadPayload($thread->fresh(['customerUser:id,name,email', 'assignedStaff:id,name'])),
        ]);
    }

    public function typing(Request $request, LiveChatThread $thread): JsonResponse
    {
        $this->touchPresence($request);
        $thread = $this->authorizeThreadAccess($request, $thread);

        $validated = $request->validate([
            'is_typing' => ['required', 'boolean'],
        ]);

        $thread->forceFill([
            'staff_typing_at' => $validated['is_typing'] ? now() : null,
        ])->save();

        return response()->json([
            'thread' => $this->selectedThreadPayload($thread->fresh(['customerUser:id,name,email', 'assignedStaff:id,name'])),
            'ok' => true,
        ]);
    }

    public function react(Request $request, LiveChatMessage $message): JsonResponse
    {
        $this->touchPresence($request);

        $validated = $request->validate([
            'emoji' => ['required', 'string', 'max:16'],
        ]);

        $thread = LiveChatThread::query()->findOrFail($message->live_chat_thread_id);
        $thread = $this->authorizeThreadAccess($request, $thread);
        $emoji = trim((string) $validated['emoji']);
        if ($emoji === '') {
            abort(422);
        }

        $existing = $message->reactions()
            ->where('emoji', $emoji)
            ->where('reactor_user_id', $request->user()?->id)
            ->whereNull('reactor_token')
            ->first();

        if ($existing) {
            $existing->delete();
        } else {
            $message->reactions()->create([
                'emoji' => $emoji,
                'reactor_user_id' => $request->user()?->id,
                'reactor_token' => null,
            ]);
        }

        return response()->json([
            'message' => $this->messagePayload($message->fresh()->load('reactions')),
            'thread' => $this->selectedThreadPayload($thread->fresh(['customerUser:id,name,email', 'assignedStaff:id,name'])),
        ]);
    }

    public function presence(Request $request): JsonResponse
    {
        $this->touchPresence($request);

        return response()->json([
            'ok' => true,
            'timestamp' => now()->toDateTimeString(),
        ]);
    }

    private function touchPresence(Request $request): void
    {
        $user = $request->user();
        if (! $user) {
            return;
        }

        LiveChatStaffPresence::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'is_online' => true,
                'last_seen_at' => now(),
            ]
        );
    }

    private function authorizeThreadAccess(Request $request, LiveChatThread $thread, bool $allowUnassigned = false): LiveChatThread
    {
        $staffId = (int) $request->user()?->id;
        if ($staffId <= 0) {
            abort(403);
        }

        if ((int) ($thread->assigned_staff_id ?? 0) === $staffId) {
            return $thread;
        }

        if ($allowUnassigned && $thread->assigned_staff_id === null) {
            return $thread;
        }

        abort(403);
    }

    private function threadPayload(LiveChatThread $thread): array
    {
        $latestMessage = $thread->latestMessage;
        $displayName = $thread->customerUser?->name ?: ($thread->guest_name ?: 'Website Visitor');
        $displayEmail = $thread->customerUser?->email ?: $thread->guest_email;

        return [
            'id' => $thread->id,
            'status' => $thread->status,
            'display_name' => $displayName,
            'display_email' => $displayEmail,
            'assigned_staff_id' => $thread->assigned_staff_id,
            'assigned_staff_name' => $thread->assignedStaff?->name,
            'last_message_at' => $thread->last_message_at?->toDateTimeString(),
            'latest_message' => $latestMessage ? $this->messagePayload($latestMessage) : null,
            'unread_count' => (int) ($thread->unread_count ?? 0),
            'customer_is_online' => (bool) $thread->customer_is_online && $thread->customer_last_seen_at?->greaterThan(now()->subMinute()),
            'customer_last_seen_at' => $thread->customer_last_seen_at?->toDateTimeString(),
            'customer_typing' => $thread->customer_typing_at?->greaterThan(now()->subSeconds(8)) ?? false,
            'staff_typing' => $thread->staff_typing_at?->greaterThan(now()->subSeconds(8)) ?? false,
        ];
    }

    private function selectedThreadPayload(LiveChatThread $thread): array
    {
        $displayName = $thread->customerUser?->name ?: ($thread->guest_name ?: 'Website Visitor');
        $displayEmail = $thread->customerUser?->email ?: $thread->guest_email;

        return [
            'id' => $thread->id,
            'status' => $thread->status,
            'display_name' => $displayName,
            'display_email' => $displayEmail,
            'assigned_staff_id' => $thread->assigned_staff_id,
            'assigned_staff_name' => $thread->assignedStaff?->name,
            'last_message_at' => $thread->last_message_at?->toDateTimeString(),
            'last_customer_message_at' => $thread->last_customer_message_at?->toDateTimeString(),
            'last_staff_message_at' => $thread->last_staff_message_at?->toDateTimeString(),
            'customer_is_online' => (bool) $thread->customer_is_online && $thread->customer_last_seen_at?->greaterThan(now()->subMinute()),
            'customer_last_seen_at' => $thread->customer_last_seen_at?->toDateTimeString(),
            'customer_typing' => $thread->customer_typing_at?->greaterThan(now()->subSeconds(8)) ?? false,
            'staff_typing' => $thread->staff_typing_at?->greaterThan(now()->subSeconds(8)) ?? false,
            'closed_by_type' => $thread->closed_by_type,
        ];
    }

    private function messagePayload(LiveChatMessage $message): array
    {
        $reactionSummary = $message->reactions
            ->groupBy('emoji')
            ->map(fn (Collection $group): array => [
                'emoji' => $group->first()?->emoji,
                'count' => $group->count(),
            ])
            ->values()
            ->all();

        return [
            'id' => $message->id,
            'sender_type' => $message->sender_type,
            'sender_name' => $message->sender_name,
            'sender_user_id' => $message->sender_user_id,
            'client_message_id' => $message->client_message_id,
            'body' => $message->body,
            'created_at' => $message->created_at?->toDateTimeString(),
            'reactions' => $reactionSummary,
        ];
    }

    private function sendTranscript(LiveChatThread $thread): void
    {
        $recipients = collect([
            $thread->customerUser?->email,
            $thread->guest_email,
            $thread->assignedStaff?->email,
        ])
            ->filter(fn ($email) => is_string($email) && trim($email) !== '')
            ->unique()
            ->values();

        if ($recipients->isEmpty()) {
            return;
        }

        $lines = $thread->messages()
            ->orderBy('id')
            ->get(['sender_name', 'body', 'created_at'])
            ->map(function (LiveChatMessage $message): string {
                $timestamp = $message->created_at?->format('Y-m-d H:i:s') ?? 'Unknown time';

                return sprintf("[%s] %s: %s", $timestamp, $message->sender_name, $message->body);
            })
            ->values()
            ->all();

        $subject = sprintf('Live Chat Transcript #%d', $thread->id);
        $body = "Conversation transcript\n\n".implode("\n", $lines);

        foreach ($recipients as $recipient) {
            try {
                Mail::raw($body, function ($mail) use ($recipient, $subject): void {
                    $mail->to($recipient)->subject($subject);
                });
            } catch (\Throwable $exception) {
                Log::warning('Live chat transcript email could not be sent.', [
                    'thread_id' => $thread->id,
                    'recipient' => $recipient,
                    'message' => $exception->getMessage(),
                ]);
            }
        }

        $thread->forceFill([
            'transcript_sent_at' => now(),
        ])->save();
    }
}
