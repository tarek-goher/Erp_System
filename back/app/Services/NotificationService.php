<?php

namespace App\Services;

use App\Models\ErpNotification;
use App\Models\User;

/**
 * NotificationService — MERGED
 * الفرق عن ERP: أضاف company_id + url في send()
 */
class NotificationService
{
    public function send(
        int $userId,
        string $title,
        string $body,
        string $type = 'info',
        ?array $data = null,
        ?string $url = null
    ): ErpNotification {
        $user = User::find($userId);

        return ErpNotification::create([
            'company_id' => $user?->company_id,
            'user_id'    => $userId,
            'title'      => $title,
            'body'       => $body,
            'type'       => $type,
            'url'        => $url,
            'data'       => $data,
        ]);
    }

    public function broadcastToCompany(int $companyId, string $title, string $body, string $type = 'info'): int
    {
        $users = User::where('company_id', $companyId)
            ->where('is_active', true)
            ->pluck('id');

        $records = $users->map(fn($userId) => [
            'company_id' => $companyId,
            'user_id'    => $userId,
            'title'      => $title,
            'body'       => $body,
            'type'       => $type,
            'created_at' => now(),
            'updated_at' => now(),
        ])->toArray();

        ErpNotification::insert($records);
        return count($records);
    }

    public function sendToEmail(string $email, string $title, string $body, string $type = 'info'): ?ErpNotification
    {
        $user = User::where('email', $email)->first();
        if (!$user) return null;
        return $this->send($user->id, $title, $body, $type);
    }
}
