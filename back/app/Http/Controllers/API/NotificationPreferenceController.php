<?php

namespace App\Http\Controllers\API;

use App\Models\NotificationPreference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationPreferenceController extends BaseController
{
    // GET /api/notification-preferences
    public function show(): JsonResponse
    {
        $prefs = NotificationPreference::firstOrCreate(
            ['user_id' => auth()->id()],
            [
                'email_on_assigned'      => true,
                'email_on_status_change' => true,
                'email_on_reply'         => true,
                'email_on_escalation'    => true,
                'inapp_on_assigned'      => true,
                'inapp_on_status_change' => true,
                'inapp_on_reply'         => true,
                'inapp_on_escalation'    => true,
            ]
        );

        return $this->success($prefs);
    }

    // PUT /api/notification-preferences
    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email_on_assigned'      => 'nullable|boolean',
            'email_on_status_change' => 'nullable|boolean',
            'email_on_reply'         => 'nullable|boolean',
            'email_on_escalation'    => 'nullable|boolean',
            'inapp_on_assigned'      => 'nullable|boolean',
            'inapp_on_status_change' => 'nullable|boolean',
            'inapp_on_reply'         => 'nullable|boolean',
            'inapp_on_escalation'    => 'nullable|boolean',
        ]);

        $prefs = NotificationPreference::updateOrCreate(
            ['user_id' => auth()->id()],
            $data
        );

        return $this->success($prefs, 'تم حفظ تفضيلات الإشعارات.');
    }
}