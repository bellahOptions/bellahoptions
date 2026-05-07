<?php

namespace Tests\Feature;

use App\Models\LiveChatMessage;
use App\Models\LiveChatStaffPresence;
use App\Models\LiveChatThread;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class LiveChatFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_start_a_live_chat_and_restore_session_with_token(): void
    {
        $token = 'guest-test-token-001';

        $createResponse = $this->chatJson('POST', route('live-chat.messages.send'), [
            'guest_name' => 'Visitor Jane',
            'guest_email' => 'visitor@example.test',
            'message' => 'Hello, I need help with my order.',
        ], $token);

        $createResponse
            ->assertCreated()
            ->assertJsonPath('thread.status', 'open')
            ->assertJsonPath('message.sender_type', 'customer');

        $threadId = $createResponse->json('thread.id');

        $this->assertDatabaseHas('live_chat_threads', [
            'id' => $threadId,
            'visitor_token' => $token,
            'guest_name' => 'Visitor Jane',
            'status' => 'open',
        ]);

        $sessionResponse = $this->chatJson('GET', route('live-chat.session'), [], $token);

        $sessionResponse
            ->assertOk()
            ->assertJsonPath('thread.id', $threadId)
            ->assertJsonCount(1, 'messages');
    }

    public function test_staff_can_monitor_and_reply_to_live_chat_threads(): void
    {
        $thread = LiveChatThread::query()->create([
            'visitor_token' => 'staff-chat-thread-1',
            'guest_name' => 'Guest Customer',
            'guest_email' => 'guest@example.test',
            'status' => 'open',
            'last_message_at' => now()->subMinute(),
            'last_customer_message_at' => now()->subMinute(),
        ]);

        LiveChatMessage::query()->create([
            'live_chat_thread_id' => $thread->id,
            'sender_type' => 'customer',
            'sender_name' => 'Guest Customer',
            'body' => 'Please I need support now.',
        ]);

        $staff = User::factory()->create([
            'role' => User::ROLE_CUSTOMER_REP,
        ]);
        $thread->forceFill([
            'assigned_staff_id' => $staff->id,
        ])->save();

        $overviewResponse = $this
            ->actingAs($staff)
            ->getJson(route('admin.live-chat.overview', ['thread_id' => $thread->id]));

        $overviewResponse
            ->assertOk()
            ->assertJsonPath('selected_thread.id', $thread->id)
            ->assertJsonPath('threads.0.id', $thread->id);

        $replyResponse = $this
            ->actingAs($staff)
            ->postJson(route('admin.live-chat.threads.messages.send', $thread->id), [
                'message' => 'Thanks for reaching out. We are on it.',
            ]);

        $replyResponse
            ->assertCreated()
            ->assertJsonPath('message.sender_type', 'staff')
            ->assertJsonPath('thread.id', $thread->id);

        $this->assertDatabaseHas('live_chat_messages', [
            'live_chat_thread_id' => $thread->id,
            'sender_type' => 'staff',
            'sender_user_id' => $staff->id,
        ]);

        $this->assertDatabaseHas('live_chat_staff_presences', [
            'user_id' => $staff->id,
            'is_online' => true,
        ]);

        $this->assertTrue(LiveChatStaffPresence::query()->where('user_id', $staff->id)->exists());
    }

    public function test_customer_message_deduplication_reactions_and_close_flow(): void
    {
        $token = 'dedupe-test-token-001';
        $clientMessageId = 'client-msg-abc-001';

        $firstSend = $this->chatJson('POST', route('live-chat.messages.send'), [
            'guest_name' => 'Guest Alex',
            'guest_email' => 'alex@example.test',
            'message' => 'Need support with billing.',
            'client_message_id' => $clientMessageId,
        ], $token);

        $firstSend
            ->assertCreated()
            ->assertJsonPath('message.sender_type', 'customer');

        $threadId = (int) $firstSend->json('thread.id');
        $firstMessageId = (int) $firstSend->json('message.id');

        $duplicateSend = $this->chatJson('POST', route('live-chat.messages.send'), [
            'guest_name' => 'Guest Alex',
            'guest_email' => 'alex@example.test',
            'message' => 'Need support with billing.',
            'client_message_id' => $clientMessageId,
        ], $token);

        $duplicateSend
            ->assertOk()
            ->assertJsonPath('deduplicated', true)
            ->assertJsonPath('message.id', $firstMessageId);

        $this->assertDatabaseCount('live_chat_messages', 1);

        $reactResponse = $this->chatJson('POST', route('live-chat.messages.react', ['message' => $firstMessageId]), [
            'emoji' => '👍',
        ], $token);

        $reactResponse
            ->assertOk()
            ->assertJsonPath('message.reactions.0.emoji', '👍')
            ->assertJsonPath('message.reactions.0.count', 1);

        $unreactResponse = $this->chatJson('POST', route('live-chat.messages.react', ['message' => $firstMessageId]), [
            'emoji' => '👍',
        ], $token);

        $unreactResponse
            ->assertOk()
            ->assertJsonCount(0, 'message.reactions');

        $closeResponse = $this->chatJson('PATCH', route('live-chat.close'), [], $token);

        $closeResponse
            ->assertOk()
            ->assertJsonPath('thread.id', $threadId)
            ->assertJsonPath('thread.status', 'closed')
            ->assertCookieExpired('chat_token');
    }

    private function chatJson(string $method, string $uri, array $payload = [], ?string $token = null): TestResponse
    {
        $cookies = $token ? ['chat_token' => $token] : [];
        $server = [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_ACCEPT' => 'application/json',
        ];
        $content = $payload === [] ? null : json_encode($payload, JSON_THROW_ON_ERROR);

        return $this->call($method, $uri, [], $cookies, [], $server, $content);
    }
}
