<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Applicant;
use App\Models\User;
use App\Notifications\ApplicantStatusUpdated;
use App\Notifications\ApplicantSubmitted;
use App\Notifications\ApplicantSubmissionReceived;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ApplicantController extends Controller
{
    public function index(Request $request)
    {
        $query = Applicant::query();

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email_address', 'like', "%{$search}%")
                    ->orWhere('contact_number', 'like', "%{$search}%")
                    ->orWhere('position_applied_for', 'like', "%{$search}%")
                    ->orWhere('permanent_address', 'like', "%{$search}%");
            });
        }

        // Single status (legacy) or multi-status via comma-separated string
        if ($request->filled('status')) {
            $statuses = array_filter(array_map('trim', explode(',', $request->string('status'))));
            if (count($statuses) === 1) {
                $query->where('status', $statuses[0]);
            } elseif (count($statuses) > 1) {
                $query->whereIn('status', $statuses);
            }
        }

        if ($request->filled('position')) {
            $query->where('position_applied_for', $request->string('position'));
        }

        if ($request->filled('gender')) {
            $query->where('gender', $request->string('gender'));
        }

        if ($request->filled('education')) {
            $query->where('highest_education_level', $request->string('education'));
        }

        if ($request->filled('vacancy_source')) {
            $query->where('vacancy_source', $request->string('vacancy_source'));
        }

        if ($request->filled('location')) {
            $query->where('preferred_work_location', 'like', '%' . $request->string('location') . '%');
        }

        if ($request->filled('salary_min')) {
            $query->where('expected_salary', '>=', (float) $request->input('salary_min'));
        }

        if ($request->filled('salary_max')) {
            $query->where('expected_salary', '<=', (float) $request->input('salary_max'));
        }

        if ($request->filled('experience_min')) {
            $query->where('total_work_experience_years', '>=', (float) $request->input('experience_min'));
        }

        if ($request->filled('experience_max')) {
            $query->where('total_work_experience_years', '<=', (float) $request->input('experience_max'));
        }

        if ($request->filled('age_min')) {
            $query->where('age', '>=', (int) $request->input('age_min'));
        }

        if ($request->filled('age_max')) {
            $query->where('age', '<=', (int) $request->input('age_max'));
        }

        $startDate = $request->date('start_date');
        if ($startDate) {
            $query->whereDate('created_at', '>=', $startDate);
        }

        $endDate = $request->date('end_date');
        if ($endDate) {
            $query->whereDate('created_at', '<=', $endDate);
        }

        $sort      = $request->input('sort', 'status');
        $direction = $request->input('direction', 'asc');
        $allowedSorts      = ['created_at', 'last_name', 'first_name', 'status', 'expected_salary', 'total_work_experience_years', 'age'];
        $allowedDirections = ['asc', 'desc'];

        if (!in_array($sort, $allowedSorts, true)) {
            $sort = 'status';
        }

        if (!in_array($direction, $allowedDirections, true)) {
            $direction = 'asc';
        }

        if ($sort === 'status') {
            $statusOrder = "CASE status
                WHEN 'new' THEN 1
                WHEN 'reviewed' THEN 2
                WHEN 'shortlisted' THEN 3
                WHEN 'interview_scheduled' THEN 4
                WHEN 'offer_extended' THEN 5
                WHEN 'hired' THEN 6
                WHEN 'rejected' THEN 7
                WHEN 'withdrawn' THEN 8
                ELSE 9
            END";

            return $query
                ->orderByRaw($statusOrder . ' ' . $direction)
                ->orderBy('created_at', 'desc')
                ->paginate($request->integer('per_page', 20));
        }

        return $query->orderBy($sort, $direction)->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $applicant = $this->createApplicant($request, false);

        AuditLog::log('create', 'applicant', $applicant->id,
            $applicant->last_name . ', ' . $applicant->first_name,
            "Created applicant '{$applicant->last_name}, {$applicant->first_name}'");

        return response()->json($applicant, 201);
    }

    public function storePublic(Request $request)
    {
        $applicant = $this->createApplicant($request, true);

        return response()->json($applicant, 201);
    }

    public function show(Applicant $applicant)
    {
        return $applicant;
    }

    public function update(Request $request, Applicant $applicant)
    {
        $previousStatus = $applicant->status;
        $data = $this->validateApplicant($request, true);

        if ($request->hasFile('upload_cv')) {
            if ($applicant->cv_path) {
                Storage::disk('public')->delete($applicant->cv_path);
            }

            $data['cv_path'] = $request->file('upload_cv')->store('cvs', 'public');
        }

        unset($data['upload_cv']);

        $applicant->update($data);

        $fullName = $applicant->last_name . ', ' . $applicant->first_name;

        if ($previousStatus !== $applicant->status) {
            AuditLog::log('status_change', 'applicant', $applicant->id, $fullName,
                "Status changed: {$previousStatus} → {$applicant->status} for '{$fullName}'");

            if ($applicant->email_address) {
                Notification::route('mail', $applicant->email_address)
                    ->notify(new ApplicantStatusUpdated($applicant));
            }
        } else {
            AuditLog::log('update', 'applicant', $applicant->id, $fullName,
                "Updated applicant '{$fullName}'");
        }

        return $applicant;
    }

    public function destroy(Applicant $applicant)
    {
        $fullName = $applicant->last_name . ', ' . $applicant->first_name;
        $applicantId = $applicant->id;

        if ($applicant->cv_path) {
            Storage::disk('public')->delete($applicant->cv_path);
        }

        $applicant->delete();

        AuditLog::log('delete', 'applicant', $applicantId, $fullName,
            "Deleted applicant '{$fullName}'");

        return response()->noContent();
    }

    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids'   => ['required', 'array', 'min:1', 'max:200'],
            'ids.*' => ['integer', 'exists:applicants,id'],
        ]);

        $applicants = Applicant::whereIn('id', $request->input('ids'))->get();

        foreach ($applicants as $applicant) {
            if ($applicant->cv_path) {
                Storage::disk('public')->delete($applicant->cv_path);
            }
            $fullName = $applicant->last_name . ', ' . $applicant->first_name;
            $applicant->delete();
            AuditLog::log('delete', 'applicant', $applicant->id, $fullName,
                "Bulk-deleted applicant '{$fullName}'");
        }

        return response()->json(['deleted' => $applicants->count()]);
    }

    public function cvDownload(Applicant $applicant)
    {
        if (!$applicant->cv_path) {
            return response()->json(['message' => 'No CV uploaded for this applicant.'], 404);
        }

        if (!Storage::disk('public')->exists($applicant->cv_path)) {
            return response()->json(['message' => 'CV file not found on storage.'], 404);
        }

        $fullPath  = Storage::disk('public')->path($applicant->cv_path);
        $mimeType  = Storage::disk('public')->mimeType($applicant->cv_path);
        $extension = pathinfo($applicant->cv_path, PATHINFO_EXTENSION);
        $filename  = $applicant->last_name . '_' . $applicant->first_name . '_CV.' . $extension;

        return response()->file($fullPath, [
            'Content-Type'        => $mimeType,
            'Content-Disposition' => 'inline; filename="' . $filename . '"',
        ]);
    }

    private function validateApplicant(Request $request, bool $isUpdate = false): array
    {
        $required = $isUpdate ? 'sometimes|required' : 'required';

        return $request->validate([
            'position_applied_for' => [$required, 'string', 'max:255'],
            'last_name' => [$required, 'string', 'max:255'],
            'first_name' => [$required, 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'permanent_address' => [$required, 'string', 'max:2000'],
            'gender' => [$required, 'string', 'max:50'],
            'civil_status' => [$required, 'string', 'max:50'],
            'birthdate' => [$required, 'date'],
            'highest_education_level' => [$required, 'string', 'max:50'],
            'bachelors_degree_course' => ['nullable', 'string', 'max:255'],
            'year_graduated' => ['nullable', 'integer', 'min:1900', 'max:2100'],
            'last_school_attended' => [$required, 'string', 'max:255'],
            'prc_license' => ['nullable', 'string', 'max:255'],
            'total_work_experience_years' => ['nullable', 'numeric', 'min:0', 'max:60'],
            'contact_number' => [$required, 'string', 'max:32'],
            'email_address' => [$required, 'email', 'max:255'],
            'expected_salary' => ['nullable', 'numeric', 'min:0'],
            'preferred_work_location' => [$required, 'string', 'max:255'],
            'upload_cv' => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:5120'],
            'vacancy_source' => ['nullable', 'string', 'max:255'],
            'status' => $isUpdate
                ? ['sometimes', 'string', Rule::in($this->allowedStatuses())]
                : ['prohibited'],
        ]);
    }

    private function createApplicant(Request $request, bool $sendNotifications): Applicant
    {
        $data = $this->validateApplicant($request);
        $data['status'] = 'new';
        $data['age'] = \Carbon\Carbon::parse($data['birthdate'])->age;

        if ($request->hasFile('upload_cv')) {
            $data['cv_path'] = $request->file('upload_cv')->store('cvs', 'public');
        }

        unset($data['upload_cv']);

        $applicant = Applicant::create($data);

        if ($sendNotifications) {
            $recipients = User::query()
                ->whereIn('role', ['admin', 'recruiter'])
                ->get();

            if ($recipients->isNotEmpty()) {
                Notification::send($recipients, new ApplicantSubmitted($applicant));
            }

            if ($applicant->email_address) {
                Notification::route('mail', $applicant->email_address)
                    ->notify(new ApplicantSubmissionReceived($applicant));
            }
        }

        return $applicant;
    }

    private function allowedStatuses(): array
    {
        return [
            'new',
            'reviewed',
            'shortlisted',
            'interview_scheduled',
            'offer_extended',
            'hired',
            'rejected',
            'withdrawn',
        ];
    }
}
