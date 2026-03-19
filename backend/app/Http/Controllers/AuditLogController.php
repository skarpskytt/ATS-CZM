<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::query()->orderByDesc('created_at');

        if ($request->filled('action')) {
            $query->where('action', $request->input('action'));
        }

        if ($request->filled('entity')) {
            $query->where('entity', $request->input('entity'));
        }

        if ($request->filled('user_name')) {
            $query->where('user_name', 'like', '%' . $request->input('user_name') . '%');
        }

        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->date('start_date'));
        }

        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->date('end_date'));
        }

        return $query->paginate($request->integer('per_page', 30));
    }

    /**
     * Get timeline for a specific applicant
     * Shows status changes and key events
     */
    public function applicantTimeline($applicantId)
    {
        $events = AuditLog::query()
            ->where('entity', 'applicant')
            ->where('entity_id', $applicantId)
            ->whereIn('action', ['status_change', 'create'])
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'description' => $log->description,
                    'recruiter_name' => $log->user_name ?? 'System',
                    'recruiter_id' => $log->user_id,
                    'created_at' => $log->created_at,
                    'created_at_formatted' => $log->created_at->format('M d, Y h:i A'),
                ];
            });

        return response()->json($events);
    }
}
