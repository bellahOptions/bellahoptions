<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Collection;

class MessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $reactions = collect($this->reactions ?? [])
            ->groupBy('emoji')
            ->map(fn (Collection $group): array => [
                'emoji' => $group->first()?->emoji,
                'count' => $group->count(),
            ])
            ->values()
            ->all();

        return [
            'id' => $this->id,
            'sender_type' => $this->sender_type,
            'sender_name' => $this->sender_name,
            'body' => $this->body,
            'created_at' => $this->created_at?->toDateTimeString(),
            'reactions' => $reactions,
        ];
    }
}
