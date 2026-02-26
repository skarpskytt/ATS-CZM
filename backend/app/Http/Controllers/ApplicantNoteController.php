<?php

namespace App\Http\Controllers;

use App\Models\Applicant;
use App\Models\ApplicantNote;
use Illuminate\Http\Request;

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

        $note = ApplicantNote::create([
            'applicant_id' => $applicant->id,
            'user_id' => $request->user()->id,
            'note' => $data['note'],
        ]);

        return response()->json($note->load('user'), 201);
    }
}
