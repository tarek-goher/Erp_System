<?php

namespace App\Services;

use App\Models\ErpNotification;
use App\Models\User;

/**
 * NotificationService — إرسال إشعارات داخلية للمستخدمين
 * يُستخدم من الـ Listeners والـ Controllers
 */
class NotificationService
{
    /**
     * إرسال إشعار لمستخدم واحد
     */
    public function send(int $userId, string $title, string $body, string $type = 'info', ?array $data = null): ErpNotification
    {
        return ErpNotification::create([
            'user_id' => $userId,
            'title'   => $title,
            'body'    => $body,
            'type'    => $type, // info | success | warning | error
            'data'    => $data ? json_encode($data) : null,
        ]);
    }

    /**
     * إرسال إشعار لكل مستخدمي شركة
     */
    public function broadcastToCompany(int $companyId, string $title, string $body, string $type = 'info'): int
    {
        $users = User::where('company_id', $companyId)
            ->where('is_active', true)
            ->pluck('id');

        $records = $users->map(fn($userId) => [
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

    /**
     * إرسال إشعار لمستخدم بـ email محدد
     */
    public function sendToEmail(string $email, string $title, string $body, string $type = 'info'): ?ErpNotification
    {
        $user = User::where('email', $email)->first();
        if (!$user) {
            return null;
        }
        return $this->send($user->id, $title, $body, $type);
    }
}
