<?php

namespace App\Http\Controllers\LiveChat;

use App\Http\Controllers\Controller;
use App\Http\Resources\MessageResource;
use App\Models\Faq;
use App\Models\LiveChatMessage;
use App\Models\LiveChatStaffPresence;
use App\Models\LiveChatThread;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class CustomerChatController extends Controller
{
    public function session(Request $request): JsonResponse
    {
        $user = $request->user();
        $token = $this->extractToken($request);
        if (! $user && ! $token) {
            $token = (string) Str::uuid();
        }

        $thread = $this->findThread($user, $token);

        if (! $thread) {
            $response = response()->json([
                'thread' => null,
                'messages' => [],
                'faqs' => $this->faqPayload(),
            ]);

            return $this->withGuestTokenCookie($response, $user, $token);
        }

        $this->touchCustomerPresence($thread, true);

        $messages = $thread->messages()
            ->with('reactions')
            ->latest('id')
            ->limit(40)
            ->get()
            ->reverse()
            ->values();

        $response = response()->json([
            'thread' => $this->threadPayload($thread->fresh(['assignedStaff:id,name'])),
            'messages' => MessageResource::collection($messages),
            'faqs' => $this->faqPayload(),
        ]);

        return $this->withGuestTokenCookie($response, $user, $thread->visitor_token ?? $token);
    }

    public function messages(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'after_id' => ['nullable', 'integer', 'min:0'],
            'mark_read' => ['nullable', 'boolean'],
        ]);

        $user = $request->user();
        $token = $this->extractToken($request);
        $thread = $this->findThread($user, $token);

        if (! $thread) {
            $response = response()->json([
                'thread' => null,
                'messages' => [],
            ]);

            return $this->withGuestTokenCookie($response, $user, $token);
        }

        $this->touchCustomerPresence($thread, true);

        $afterId = (int) ($validated['after_id'] ?? 0);
        $messages = $thread->messages()
            ->with('reactions')
            ->when($afterId > 0, fn ($query) => $query->where('id', '>', $afterId))
            ->limit(80)
            ->get();

        $latestId = $messages->last()?->id ?? $afterId;
        if ((bool) ($validated['mark_read'] ?? false)) {
            $this->markCustomerRead($thread, $latestId);
            $thread->refresh();
        }

        $response = response()->json([
            'thread' => $this->threadPayload($thread->fresh(['assignedStaff:id,name'])),
            'messages' => MessageResource::collection($messages),
        ]);

        return $this->withGuestTokenCookie($response, $user, $thread->visitor_token ?? $token);
    }

    public function send(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user && $user->isStaff()) {
            abort(403);
        }

        $validated = $request->validate([
            'message' => ['required', 'string', 'min:1', 'max:2000'],
            'guest_name' => ['nullable', 'string', 'min:2', 'max:120'],
            'guest_email' => ['nullable', 'email:rfc', 'max:255'],
            'client_message_id' => ['nullable', 'string', 'min:8', 'max:80'],
        ]);

        $token = $this->extractToken($request);
        $thread = $this->resolveThreadForOutboundMessage($user, $token, $validated);
        $this->touchCustomerPresence($thread, true);

        $clientMessageId = trim((string) ($validated['client_message_id'] ?? ''));
        if ($clientMessageId !== '') {
            $deduplicated = $thread->messages()
                ->where('sender_type', 'customer')
                ->where('client_message_id', $clientMessageId)
                ->first();

            if ($deduplicated) {
                $response = response()->json([
                    'deduplicated' => true,
                    'thread' => $this->threadPayload($thread->fresh(['assignedStaff:id,name'])),
                    'message' => MessageResource::make($deduplicated->loadMissing('reactions')),
                ]);

                return $this->withGuestTokenCookie($response, $user, $thread->visitor_token ?? $token);
            }
        }

        $senderName = $user?->name ?: ($thread->guest_name ?: 'Website Visitor');
        $message = $thread->messages()->create([
            'sender_type' => 'customer',
            'sender_user_id' => $user?->id,
            'sender_name' => $senderName,
            'client_message_id' => $clientMessageId !== '' ? $clientMessageId : null,
            'body' => trim((string) $validated['message']),
        ]);

        $thread->forceFill([
            'last_message_at' => now(),
            'last_customer_message_at' => now(),
            'status' => 'open',
            'closed_at' => null,
            'closed_by_type' => null,
            'closed_by_user_id' => null,
            'customer_last_read_message_id' => $message->id,
            'customer_typing_at' => null,
        ])->save();

        $response = response()->json([
            'thread' => $this->threadPayload($thread->fresh(['assignedStaff:id,name'])),
            'message' => MessageResource::make($message->loadMissing('reactions')),
        ], 201);

        return $this->withGuestTokenCookie($response, $user, $thread->visitor_token ?? $token);
    }

    public function close(Request $request): JsonResponse
    {
        $user = $request->user();
        $token = $this->extractToken($request);
        $thread = $this->findThread($user, $token);

        if (! $thread) {
            return response()->json([
                'thread' => null,
            ], 404)->withCookie(Cookie::forget('chat_token'));
        }

        $wasOpen = $thread->status !== 'closed';
        if ($wasOpen) {
            $thread->forceFill([
                'status' => 'closed',
                'closed_at' => now(),
                'closed_by_type' => 'customer',
                'closed_by_user_id' => $user?->id,
                'customer_is_online' => false,
                'customer_typing_at' => null,
            ])->save();

            $thread->messages()->create([
                'sender_type' => 'staff',
                'sender_name' => 'System',
                'body' => 'This chat was closed by the customer. A transcript has been shared with both parties.',
            ]);
        }

        if ($wasOpen) {
            $this->sendTranscript($thread->fresh(['customerUser:id,name,email', 'assignedStaff:id,name,email']));
        }

        return response()->json([
            'thread' => $this->threadPayload($thread->fresh(['assignedStaff:id,name'])),
        ])->withCookie(Cookie::forget('chat_token'));
    }

    public function presence(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'is_online' => ['nullable', 'boolean'],
        ]);

        $user = $request->user();
        $token = $this->extractToken($request);
        $thread = $this->findThread($user, $token);

        if (! $thread) {
            $response = response()->json([
                'thread' => null,
                'ok' => true,
            ]);

            return $this->withGuestTokenCookie($response, $user, $token);
        }

        $this->touchCustomerPresence($thread, (bool) ($validated['is_online'] ?? true));

        $response = response()->json([
            'thread' => $this->threadPayload($thread->fresh(['assignedStaff:id,name'])),
            'ok' => true,
        ]);

        return $this->withGuestTokenCookie($response, $user, $thread->visitor_token ?? $token);
    }

    public function typing(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'is_typing' => ['required', 'boolean'],
        ]);

        $user = $request->user();
        $token = $this->extractToken($request);
        $thread = $this->findThread($user, $token);

        if (! $thread) {
            $response = response()->json([
                'thread' => null,
                'ok' => true,
            ]);

            return $this->withGuestTokenCookie($response, $user, $token);
        }

        $thread->forceFill([
            'customer_typing_at' => $validated['is_typing'] ? now() : null,
            'customer_is_online' => true,
            'customer_last_seen_at' => now(),
        ])->save();

        $response = response()->json([
            'thread' => $this->threadPayload($thread->fresh(['assignedStaff:id,name'])),
            'ok' => true,
        ]);

        return $this->withGuestTokenCookie($response, $user, $thread->visitor_token ?? $token);
    }

    public function react(Request $request, LiveChatMessage $message): JsonResponse
    {
        $validated = $request->validate([
            'emoji' => ['required', 'string', 'max:16'],
        ]);

        $user = $request->user();
        $token = $this->extractToken($request);
        $thread = $this->findThread($user, $token);

        if (! $thread || (int) $thread->id !== (int) $message->live_chat_thread_id) {
            abort(403);
        }

        $emoji = trim((string) $validated['emoji']);
        if ($emoji === '') {
            abort(422);
        }

        $this->toggleReaction($message, $emoji, $user?->id, $thread->visitor_token ?? $token);

        $response = response()->json([
            'message' => MessageResource::make($message->fresh()->load('reactions')),
        ]);

        return $this->withGuestTokenCookie($response, $user, $thread->visitor_token ?? $token);
    }

    private function resolveThreadForOutboundMessage(?User $user, ?string &$token, array $validated): LiveChatThread
    {
        if ($user) {
            $openThread = LiveChatThread::query()
                ->where('customer_user_id', $user->id)
                ->where('status', 'open')
                ->latest('id')
                ->first();

            if ($openThread) {
                return $openThread;
            }

            return LiveChatThread::create([
                'customer_user_id' => $user->id,
                'guest_name' => $user->name,
                'guest_email' => $user->email,
                'status' => 'open',
            ]);
        }

        if (! $token) {
            $token = (string) Str::uuid();
        }

        $thread = LiveChatThread::query()
            ->where('visitor_token', $token)
            ->latest('id')
            ->first();

        if ($thread) {
            $updates = [];
            if (! $thread->guest_name && ! empty($validated['guest_name'])) {
                $updates['guest_name'] = trim((string) $validated['guest_name']);
            }
            if (! $thread->guest_email && ! empty($validated['guest_email'])) {
                $updates['guest_email'] = strtolower(trim((string) $validated['guest_email']));
            }
            if ($updates !== []) {
                $thread->forceFill($updates)->save();
            }

            return $thread;
        }

        return LiveChatThread::create([
            'visitor_token' => $token,
            'guest_name' => trim((string) ($validated['guest_name'] ?? 'Website Visitor')),
            'guest_email' => ! empty($validated['guest_email']) ? strtolower(trim((string) $validated['guest_email'])) : null,
            'status' => 'open',
        ]);
    }

    private function findThread(?User $user, ?string $token): ?LiveChatThread
    {
        if ($user && ! $user->isStaff()) {
            return LiveChatThread::query()
                ->where('customer_user_id', $user->id)
                ->latest('id')
                ->first();
        }

        if (! $token) {
            return null;
        }

        return LiveChatThread::query()
            ->where('visitor_token', $token)
            ->latest('id')
            ->first();
    }

    private function markCustomerRead(LiveChatThread $thread, ?int $latestId): void
    {
        if (! $latestId || (int) $thread->customer_last_read_message_id >= $latestId) {
            return;
        }

        $thread->forceFill([
            'customer_last_read_message_id' => $latestId,
        ])->save();
    }

    private function extractToken(Request $request): ?string
    {
        $rawToken = $request->cookie('chat_token');
        if (! is_string($rawToken)) {
            return null;
        }

        $token = trim($rawToken);
        if ($token === '' || strlen($token) > 64) {
            return null;
        }

        return $token;
    }

    private function threadPayload(LiveChatThread $thread): array
    {
        $customerUnread = $thread->messages()
            ->where('sender_type', 'staff')
            ->where('id', '>', (int) ($thread->customer_last_read_message_id ?? 0))
            ->count();

        $assignedStaffOnline = false;
        if ($thread->assigned_staff_id) {
            $assignedStaffOnline = LiveChatStaffPresence::query()
                ->where('user_id', $thread->assigned_staff_id)
                ->where('is_online', true)
                ->where('last_seen_at', '>=', now()->subMinute())
                ->exists();
        }

        $onlineStaffCount = LiveChatStaffPresence::query()
            ->where('is_online', true)
            ->where('last_seen_at', '>=', now()->subMinute())
            ->count();

        return [
            'id' => $thread->id,
            'status' => $thread->status,
            'guest_name' => $thread->guest_name,
            'last_message_at' => $thread->last_message_at?->toDateTimeString(),
            'unread_from_staff' => $customerUnread,
            'customer_is_online' => (bool) $thread->customer_is_online,
            'customer_last_seen_at' => $thread->customer_last_seen_at?->toDateTimeString(),
            'customer_typing' => $thread->customer_typing_at?->greaterThan(now()->subSeconds(8)) ?? false,
            'staff_typing' => $thread->staff_typing_at?->greaterThan(now()->subSeconds(8)) ?? false,
            'assigned_staff_online' => $assignedStaffOnline,
            'online_staff_count' => $onlineStaffCount,
            'closed_by_type' => $thread->closed_by_type,
        ];
    }

    private function withGuestTokenCookie(JsonResponse $response, ?User $user, ?string $token): JsonResponse
    {
        if ($user || ! $token) {
            return $response;
        }

        return $response->withCookie(
            cookie()->forever(
                name: 'chat_token',
                value: $token,
                path: '/',
                domain: null,
                secure: true,
                httpOnly: true,
                raw: false,
                sameSite: 'Strict'
            )
        );
    }

    /**
     * @return array<int, array{question: string, answer: string}>
     */
    private function faqPayload(): array
    {
        return Faq::query()
            ->where('is_published', true)
            ->orderBy('position')
            ->limit(6)
            ->get(['question', 'answer'])
            ->map(fn (Faq $faq): array => [
                'question' => $faq->question,
                'answer' => $faq->answer,
            ])
            ->values()
            ->all();
    }

    private function touchCustomerPresence(LiveChatThread $thread, bool $online): void
    {
        $thread->forceFill([
            'customer_is_online' => $online,
            'customer_last_seen_at' => now(),
        ])->save();
    }

    private function toggleReaction(LiveChatMessage $message, string $emoji, ?int $userId, ?string $token): void
    {
        $tokenValue = $userId ? null : ($token ? mb_substr($token, 0, 64) : null);
        $existing = $message->reactions()
            ->where('emoji', $emoji)
            ->where('reactor_user_id', $userId)
            ->where('reactor_token', $tokenValue)
            ->first();

        if ($existing) {
            $existing->delete();

            return;
        }

        $message->reactions()->create([
            'emoji' => $emoji,
            'reactor_user_id' => $userId,
            'reactor_token' => $tokenValue,
        ]);
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
