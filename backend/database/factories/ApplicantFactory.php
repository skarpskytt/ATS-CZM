<?php

namespace Database\Factories;

use App\Models\Applicant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Applicant>
 */
class ApplicantFactory extends Factory
{
    protected $model = Applicant::class;

    public function definition(): array
    {
        $educationLevels = ['Elementary', 'High School', 'Senior High', 'Vocational', 'College', 'Post Grad'];

        return [
            'position_applied_for' => $this->faker->jobTitle(),
            'last_name' => $this->faker->lastName(),
            'first_name' => $this->faker->firstName(),
            'middle_name' => $this->faker->optional()->firstName(),
            'permanent_address' => $this->faker->address(),
            'gender' => $this->faker->randomElement(['Male', 'Female', 'Other']),
            'civil_status' => $this->faker->randomElement(['Single', 'Married', 'Separated', 'Widowed']),
            'birthdate' => $this->faker->dateTimeBetween('-55 years', '-18 years')->format('Y-m-d'),
            'age' => $this->faker->numberBetween(18, 60),
            'highest_education_level' => $this->faker->randomElement($educationLevels),
            'bachelors_degree_course' => $this->faker->optional()->words(3, true),
            'year_graduated' => $this->faker->optional()->numberBetween(1990, (int) date('Y')),
            'last_school_attended' => $this->faker->company() . ' University',
            'prc_license' => $this->faker->optional()->bothify('PRC-#######'),
            'total_work_experience_years' => $this->faker->randomFloat(1, 0, 25),
            'contact_number' => $this->faker->phoneNumber(),
            'email_address' => $this->faker->unique()->safeEmail(),
            'expected_salary' => $this->faker->optional()->randomFloat(2, 15000, 120000),
            'preferred_work_location' => $this->faker->city(),
            'cv_path' => null,
            'vacancy_source' => $this->faker->randomElement(['Facebook', 'LinkedIn', 'Referral', 'Website', 'Job Fair']),
            'status' => $this->faker->randomElement(['submitted', 'under_review', 'shortlisted', 'rejected', 'hired']),
        ];
    }
}
