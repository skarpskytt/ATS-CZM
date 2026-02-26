<?php

namespace Database\Seeders;

use App\Models\Applicant;
use App\Models\Position;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'role' => 'admin',
        ]);

        User::factory()->create([
            'name' => 'Recruiter User',
            'email' => 'recruiter@example.com',
            'role' => 'recruiter',
        ]);

        Position::query()->create([
            'title' => 'Frontend Developer',
            'description' => 'Build and maintain web interfaces using React.',
            'location' => 'On-site - Manila',
            'salary_min' => 35000,
            'salary_max' => 60000,
            'is_active' => true,
        ]);

        Position::query()->create([
            'title' => 'Backend Developer',
            'description' => 'Develop APIs and maintain backend services.',
            'location' => 'Hybrid - Cebu',
            'salary_min' => 40000,
            'salary_max' => 70000,
            'is_active' => true,
        ]);

        Position::query()->create([
            'title' => 'HR Recruiter',
            'description' => 'Manage recruitment pipeline and interviews.',
            'location' => 'Remote',
            'salary_min' => 30000,
            'salary_max' => 50000,
            'is_active' => true,
        ]);

        Applicant::factory(10)->create();
    }
}
