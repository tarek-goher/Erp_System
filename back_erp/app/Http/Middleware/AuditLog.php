<?php

namespace App\Http\Middleware;

use App\Models\AuditLog as AuditLogModel;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * AuditLog Middleware
 *
 * Fix #14: كان $responseData يُعمل لكن لا يُستخدم في AuditLog::create.
 *          بالإضافة إلى أن أسماء الحقول في create كانت غير متوافقة مع الـ model.
 *
 * AuditLog model $fillable:
 *   user_id, company_id, action, model_type, model_id,
 *   old_values, new_values, ip_address, created_at
 *
 * الـ middleware القديم كان يستخدم:
 *   resource, record_id, ip, payload, status (حقول غير موجودة في الـ model)
 *
 * الحل:
 *   - استخدام model_type بدل resource
 *   - استخدام model_id بدل record_id
 *   - استخدام ip_address بدل ip
 *   - حفظ الـ payload في new_values
 *   - حذف حقل status (غير موجود في الـ model)
 */
class AuditLog
{
    private array $skipMethods = ['GET', 'HEAD', 'OPTIONS'];

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (in_array($request->method(), $this->skipMethods)) {
            return $response;
        }

        $user = $request->user();
        if (!$user) {
            return $response;
        }

        try {
            $method = $request->method();
            $action = match ($method) {
                'POST'              => 'create',
                'PUT', 'PATCH'      => 'update',
                'DELETE'            => 'delete',
                default             => strtolower($method),
            };

            // استخرج اسم الـ resource من الـ URL
            $segments   = explode('/', trim($request->path(), '/'));
            $modelType  = $segments[1] ?? $segments[0] ?? 'unknown'; // مثل: api/products/5 → products
            $modelId    = null;
            if (count($segments) >= 3 && is_numeric($segments[count($segments) - 1])) {
                $modelId = (int) $segments[count($segments) - 1];
            }

            // Fix #14: استخراج الـ response data واستخدامها فعلاً
            $newValues = null;
            if ($response->getStatusCode() < 400) {
                $body    = json_decode($response->getContent(), true);
                $modelId = $modelId ?? ($body['data']['id'] ?? $body['id'] ?? null);
                // حفظ بيانات الـ response في new_values (يفيد في الـ audit trail)
                $newValues = isset($body['data']) ? $body['data'] : null;
            }

            // Fix #14: استخدام أسماء الحقول الصحيحة من AuditLog model
            AuditLogModel::create([
                'user_id'    => $user->id,
                'company_id' => $user->company_id,
                'action'     => $action,
                // Fix: كان 'resource' → الصح 'model_type'
                'model_type' => $modelType,
                // Fix: كان 'record_id' → الصح 'model_id'
                'model_id'   => $modelId,
                // Fix: كان 'ip' → الصح 'ip_address'
                'ip_address' => $request->ip(),
                // Fix: payload → حقل old_values (الـ request payload قبل التغيير)
                'old_values' => $this->sanitizePayload($request->all()),
                // Fix #14: كان $responseData يُعمل ولا يُستخدم → الآن يُحفظ في new_values
                'new_values' => $newValues,
                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('AuditLog middleware error: ' . $e->getMessage());
        }

        return $response;
    }

    private function sanitizePayload(array $data): array
    {
        $sensitive = ['password', 'password_confirmation', 'current_password', 'token', 'secret'];
        foreach ($sensitive as $key) {
            if (array_key_exists($key, $data)) {
                $data[$key] = '***';
            }
        }
        return $data;
    }
}
