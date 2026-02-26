<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('applicants', function (Blueprint $table): void {
            $table->id();
            $table->string('position_applied_for');
            $table->string('last_name');
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->text('permanent_address');
            $table->string('gender', 50);
            $table->string('civil_status', 50);
            $table->date('birthdate');
            $table->unsignedTinyInteger('age');
            $table->string('highest_education_level', 50);
            $table->string('bachelors_degree_course')->nullable();
            $table->unsignedSmallInteger('year_graduated')->nullable();
            $table->string('last_school_attended');
            $table->string('prc_license')->nullable();
            $table->decimal('total_work_experience_years', 4, 1)->nullable();
            $table->string('contact_number', 32);
            $table->string('email_address');
            $table->decimal('expected_salary', 12, 2)->nullable();
            $table->string('preferred_work_location');
            $table->string('cv_path')->nullable();
            $table->string('vacancy_source')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applicants');
    }
};
