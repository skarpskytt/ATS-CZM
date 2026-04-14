<?php

namespace App\Http\Controllers;

use App\Models\Applicant;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function overview(Request $request)
    {
        // Optional period filter: 30 / 90 / 180 / 365 / all
        $days  = (int) $request->query('days', 0); // 0 = all time
        $query = fn () => $days > 0
            ? Applicant::query()->where('created_at', '>=', now()->subDays($days))
            : Applicant::query();

        $total       = $query()->count();
        // recent_count uses the same period filter, or 30 days if all time selected
        $recentDays  = $days > 0 ? min($days, 30) : 30;
        $recentCount = Applicant::query()->where('created_at', '>=', now()->subDays($recentDays))->count();

        $byStatus = $query()
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->orderBy('status')
            ->get();

        $byPosition = $query()
            ->select('position_applied_for', DB::raw('count(*) as total'))
            ->groupBy('position_applied_for')
            ->orderBy('total', 'desc')
            ->limit(10)
            ->get();

        // Monthly trend — last 12 months or based on period filter
        $trendMonths = $days > 0 ? max(1, (int) ceil($days / 30)) : 12;
        $monthlyTrend = Applicant::query()
            ->select(
                DB::raw('YEAR(created_at) as yr'),
                DB::raw('MONTH(created_at) as mo'),
                DB::raw('count(*) as total')
            )
            ->where('created_at', '>=', now()->subMonths($trendMonths)->startOfMonth())
            ->groupBy('yr', 'mo')
            ->orderBy('yr')
            ->orderBy('mo')
            ->get()
            ->map(function ($row) {
                $label = \Carbon\Carbon::createFromDate($row->yr, $row->mo, 1)
                    ->format('M Y');
                return ['month' => $label, 'total' => (int) $row->total];
            });

        // By vacancy source
        $bySource = $query()
            ->select('vacancy_source', DB::raw('count(*) as total'))
            ->whereNotNull('vacancy_source')
            ->where('vacancy_source', '!=', '')
            ->groupBy('vacancy_source')
            ->orderBy('total', 'desc')
            ->get();

        // By gender
        $byGender = $query()
            ->select('gender', DB::raw('count(*) as total'))
            ->whereNotNull('gender')
            ->groupBy('gender')
            ->get();

        // By education level
        $byEducation = $query()
            ->select('highest_education_level', DB::raw('count(*) as total'))
            ->whereNotNull('highest_education_level')
            ->groupBy('highest_education_level')
            ->orderBy('total', 'desc')
            ->get();

        // Top preferred locations
        $byLocation = $query()
            ->select('preferred_work_location', DB::raw('count(*) as total'))
            ->whereNotNull('preferred_work_location')
            ->where('preferred_work_location', '!=', '')
            ->groupBy('preferred_work_location')
            ->orderBy('total', 'desc')
            ->limit(8)
            ->get();

        // Computed metrics
        $hired    = $byStatus->where('status', 'hired')->first()?->total ?? 0;
        $rejected = $byStatus->where('status', 'rejected')->first()?->total ?? 0;
        $hireRate     = $total > 0 ? round(($hired    / $total) * 100, 1) : 0;
        $rejectedRate = $total > 0 ? round(($rejected / $total) * 100, 1) : 0;

        $avgExperience = round(
            $query()->whereNotNull('total_work_experience_years')->avg('total_work_experience_years') ?? 0,
            1
        );
        $avgSalary = round(
            $query()->whereNotNull('expected_salary')->avg('expected_salary') ?? 0,
            0
        );

        return [
            'total_applicants'  => $total,
            'recent_count'      => $recentCount,
            'hire_rate'         => $hireRate,
            'rejection_rate'    => $rejectedRate,
            'avg_experience'    => $avgExperience,
            'avg_salary'        => $avgSalary,
            'by_status'         => $byStatus,
            'by_position'       => $byPosition,
            'monthly_trend'     => $monthlyTrend,
            'by_source'         => $bySource,
            'by_gender'         => $byGender,
            'by_education'      => $byEducation,
            'by_location'       => $byLocation,
        ];
    }
}
