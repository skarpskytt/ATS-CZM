<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Update status values in applicants table
        DB::table('applicants')
            ->where('status', 'submitted')
            ->update(['status' => 'new']);

        DB::table('applicants')
            ->where('status', 'under_review')
            ->update(['status' => 'reviewed']);
    }

    public function down(): void
    {
        // Revert status values back to original
        DB::table('applicants')
            ->where('status', 'new')
            ->update(['status' => 'submitted']);

        DB::table('applicants')
            ->where('status', 'reviewed')
            ->update(['status' => 'under_review']);
    }
};
