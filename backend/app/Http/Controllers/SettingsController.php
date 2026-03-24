<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    private const DEFAULTS = [
        'canEdit'            => ['admin', 'hr_manager', 'hr_supervisor'],
        'canDelete'          => ['admin', 'hr_manager', 'hr_supervisor'],
        'canManagePositions' => ['admin', 'hr_manager', 'hr_supervisor'],
        'canViewAnalytics'   => ['admin', 'hr_manager', 'hr_supervisor'],
        'canManageUsers'     => ['admin'],
    ];

    private const ALL_ROLES = ['admin', 'hr_manager', 'hr_supervisor', 'recruiter'];

    /**
     * GET /api/settings/permissions
     * Accessible by all authenticated users (needed to gate the UI).
     */
    public function getPermissions(): \Illuminate\Http\JsonResponse
    {
        $permissions = Setting::get('permissions', self::DEFAULTS);
        return response()->json($permissions);
    }

    /**
     * PUT /api/settings/permissions
     * Admin only. Validates + saves the permission matrix.
     */
    public function updatePermissions(Request $request): \Illuminate\Http\JsonResponse
    {
        $data = $request->validate([
            'canEdit'            => ['required', 'array'],
            'canEdit.*'          => ['string', 'in:' . implode(',', self::ALL_ROLES)],
            'canDelete'          => ['required', 'array'],
            'canDelete.*'        => ['string', 'in:' . implode(',', self::ALL_ROLES)],
            'canManagePositions' => ['required', 'array'],
            'canManagePositions.*' => ['string', 'in:' . implode(',', self::ALL_ROLES)],
            'canViewAnalytics'   => ['required', 'array'],
            'canViewAnalytics.*' => ['string', 'in:' . implode(',', self::ALL_ROLES)],
            'canManageUsers'     => ['required', 'array'],
            'canManageUsers.*'   => ['string', 'in:' . implode(',', self::ALL_ROLES)],
        ]);

        // Admin must always keep all permissions — enforce it silently.
        foreach ($data as $perm => $roles) {
            if (! in_array('admin', $roles, true)) {
                $data[$perm][] = 'admin';
            }
        }

        Setting::set('permissions', $data);

        return response()->json($data);
    }
}
