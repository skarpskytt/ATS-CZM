<?php

namespace App\Http\Controllers;

use App\Models\Applicant;
use App\Models\ApplicantNote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\HTML;

class ApplicantNoteController extends Controller
{
    public function index(Applicant $applicant)
    {
        return $applicant->notes()->with('user')->latest()->get();
    }

    public function store(Request $request, Applicant $applicant)
    {
        $data = $request->validate([
            'note' => ['required', 'string', 'max:4000'],
        ]);

        // Sanitize note to prevent XSS attacks
        $sanitizedNote = strip_tags($data['note'], '<p><br><strong><em><ul><ol><li>');

        $note = ApplicantNote::create([
            'applicant_id' => $applicant->id,
            'user_id' => $request->user()->id,
            'note' => $sanitizedNote,
        ]);

        return response()->json($note->load('user'), 201);
    }
}
