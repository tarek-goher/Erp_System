<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * IpWhitelist Middleware
 * Restrict API access to whitelisted IP addresses (configurable per company)
 */
class IpWhitelist
{
    public function handle(Request $request, Closure $next): Response
    {
        $whitelistEnabled = config('security.ip_whitelist_enabled', false);

        if (!$whitelistEnabled) {
            return $next($request);
        }

        $clientIp = $request->ip();
        $user     = $request->user();

        if (!$user) {
            return $next($request); // Auth middleware will handle this
        }

        // Get company's IP whitelist from cache or DB
        $companyId  = $user->company_id;
        $cacheKey   = "ip_whitelist_{$companyId}";
        $whitelist  = Cache::remember($cacheKey, 300, function () use ($companyId) {
            return \App\Models\IpWhitelistEntry::where('company_id', $companyId)
                ->where('is_active', true)
                ->pluck('ip_address')
                ->toArray();
        });

        if (empty($whitelist)) {
            return $next($request); // No whitelist configured = allow all
        }

        foreach ($whitelist as $allowedIp) {
            if ($this->ipMatches($clientIp, $allowedIp)) {
                return $next($request);
            }
        }

        return response()->json([
            'error' => 'Access denied. Your IP address is not whitelisted.',
            'ip'    => $clientIp,
        ], 403);
    }

    private function ipMatches(string $clientIp, string $allowedIp): bool
    {
        // Exact match
        if ($clientIp === $allowedIp) return true;

        // CIDR range match (e.g. 192.168.1.0/24)
        if (str_contains($allowedIp, '/')) {
            [$subnet, $bits] = explode('/', $allowedIp, 2);
            $mask = -1 << (32 - (int)$bits);
            return (ip2long($clientIp) & $mask) === (ip2long($subnet) & $mask);
        }

        // Wildcard match (e.g. 192.168.1.*)
        if (str_contains($allowedIp, '*')) {
            $pattern = str_replace('.', '\\.', $allowedIp);
            $pattern = str_replace('\\.*', '(\\.\\d+)?', $pattern);
            $pattern = str_replace('*', '\\d+', $pattern);
            return (bool) preg_match("/^{$pattern}$/", $clientIp);
        }

        return false;
    }
}
