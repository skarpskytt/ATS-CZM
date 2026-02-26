<?php

namespace App\Http\Controllers;

use App\Models\Applicant;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function overview()
    {
        $total = Applicant::query()->count();

        $recentCount = Applicant::query()
            ->where('created_at', '>=', now()->subDays(30))
            ->count();

        $byStatus = Applicant::query()
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->orderBy('status')
            ->get();

        $byPosition = Applicant::query()
            ->select('position_applied_for', DB::raw('count(*) as total'))
            ->groupBy('position_applied_for')
            ->orderBy('total', 'desc')
            ->get();

        return [
            'total_applicants' => $total,
            'recent_count' => $recentCount,
            'by_status' => $byStatus,
            'by_position' => $byPosition,
        ];
    }
}
