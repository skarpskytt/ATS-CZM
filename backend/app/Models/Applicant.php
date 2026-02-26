<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Applicant extends Model
{
    use HasFactory;

    protected $fillable = [
        'position_applied_for',
        'last_name',
        'first_name',
        'middle_name',
        'permanent_address',
        'gender',
        'civil_status',
        'birthdate',
        'age',
        'highest_education_level',
        'bachelors_degree_course',
        'year_graduated',
        'last_school_attended',
        'prc_license',
        'total_work_experience_years',
        'contact_number',
        'email_address',
        'expected_salary',
        'preferred_work_location',
        'cv_path',
        'vacancy_source',
        'status',
    ];

    protected $casts = [
        'birthdate' => 'date',
        'expected_salary' => 'decimal:2',
        'total_work_experience_years' => 'decimal:1',
    ];

    public function notes()
    {
        return $this->hasMany(ApplicantNote::class);
    }
}
