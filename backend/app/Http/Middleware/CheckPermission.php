<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Default permissions used when the settings table has no entry yet.
     */
    private const DEFAULTS = [
        'canEdit'            => ['admin', 'hr_manager', 'hr_supervisor'],
        'canDelete'          => ['admin', 'hr_manager', 'hr_supervisor'],
        'canManagePositions' => ['admin', 'hr_manager', 'hr_supervisor'],
        'canViewAnalytics'   => ['admin', 'hr_manager', 'hr_supervisor'],
        'canManageUsers'     => ['admin'],
    ];

    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $permissions = Setting::get('permissions', self::DEFAULTS);
        $allowed     = $permissions[$permission] ?? self::DEFAULTS[$permission] ?? [];

        if (! in_array($user->role, $allowed, true)) {
            return response()->json([
                'message' => 'Forbidden. You do not have permission to perform this action.',
            ], 403);
        }

        return $next($request);
    }
}
