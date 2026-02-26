<?php

namespace App\Http\Controllers;

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
                    ->orWhere('position_applied_for', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('position')) {
            $query->where('position_applied_for', $request->string('position'));
        }

        $startDate = $request->date('start_date');
        if ($startDate) {
            $query->whereDate('created_at', '>=', $startDate);
        }

        $endDate = $request->date('end_date');
        if ($endDate) {
            $query->whereDate('created_at', '<=', $endDate);
        }

        $sort = $request->string('sort', 'created_at');
        $direction = $request->string('direction', 'desc');
        $allowedSorts = ['created_at', 'last_name', 'status'];
        $allowedDirections = ['asc', 'desc'];

        if (!in_array($sort, $allowedSorts, true)) {
            $sort = 'created_at';
        }

        if (!in_array($direction, $allowedDirections, true)) {
            $direction = 'desc';
        }

        return $query->orderBy($sort, $direction)->paginate(20);
    }

    public function store(Request $request)
    {
        $applicant = $this->createApplicant($request, false);

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

        if ($previousStatus !== $applicant->status && $applicant->email_address) {
            Notification::route('mail', $applicant->email_address)
                ->notify(new ApplicantStatusUpdated($applicant));
        }

        return $applicant;
    }

    public function destroy(Applicant $applicant)
    {
        if ($applicant->cv_path) {
            Storage::disk('public')->delete($applicant->cv_path);
        }

        $applicant->delete();

        return response()->noContent();
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
            'age' => [$required, 'integer', 'min:0', 'max:120'],
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
        $data['status'] = 'submitted';

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
            'submitted',
            'under_review',
            'shortlisted',
            'interview_scheduled',
            'offer_extended',
            'hired',
            'rejected',
            'withdrawn',
        ];
    }
}
