<?php

use App\Http\Controllers\ApplicantController;
use App\Http\Controllers\ApplicantNoteController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PositionController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::post('login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
Route::post('reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');
Route::post('public/applicants', [ApplicantController::class, 'storePublic'])->middleware('throttle:20,1');
Route::get('positions', [PositionController::class, 'publicIndex']);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('me', [AuthController::class, 'me']);

    // Applicants - all roles can read & add notes
    Route::get('applicants', [ApplicantController::class, 'index']);
    Route::get('applicants/{applicant}', [ApplicantController::class, 'show']);
    Route::get('applicants/{applicant}/cv', [ApplicantController::class, 'cvDownload']);
    Route::get('applicants/{applicant}/notes', [ApplicantNoteController::class, 'index']);
    Route::post('applicants/{applicant}/notes', [ApplicantNoteController::class, 'store']);

    // create / edit - dynamic permission: canEdit
    Route::post('applicants', [ApplicantController::class, 'store'])
        ->middleware('perm:canEdit');
    Route::put('applicants/{applicant}', [ApplicantController::class, 'update'])
        ->middleware('perm:canEdit');
    Route::patch('applicants/{applicant}', [ApplicantController::class, 'update'])
        ->middleware('perm:canEdit');

    // delete - dynamic permission: canDelete
    Route::delete('applicants/{applicant}', [ApplicantController::class, 'destroy'])
        ->middleware('perm:canDelete');
    Route::delete('applicants', [ApplicantController::class, 'bulkDestroy'])
        ->middleware('perm:canDelete');

    // Analytics - dynamic permission: canViewAnalytics
    Route::get('dashboard/overview', [DashboardController::class, 'overview'])
        ->middleware('perm:canViewAnalytics');

    // Positions - dynamic permission: canManagePositions
    Route::get('positions/all', [PositionController::class, 'all']);
    Route::get('positions/admin', [PositionController::class, 'index']);
    Route::post('positions', [PositionController::class, 'store'])
        ->middleware('perm:canManagePositions');
    Route::put('positions/{position}', [PositionController::class, 'update'])
        ->middleware('perm:canManagePositions');
    Route::patch('positions/{position}', [PositionController::class, 'update'])
        ->middleware('perm:canManagePositions');
    Route::delete('positions/{position}', [PositionController::class, 'destroy'])
        ->middleware('perm:canManagePositions');

    // User management - dynamic permission: canManageUsers
    Route::get('users', [UserController::class, 'index'])
        ->middleware('perm:canManageUsers');
    Route::post('users', [UserController::class, 'store'])
        ->middleware('perm:canManageUsers');
    Route::put('users/{user}', [UserController::class, 'update'])
        ->middleware('perm:canManageUsers');
    Route::patch('users/{user}', [UserController::class, 'update'])
        ->middleware('perm:canManageUsers');
    Route::delete('users/{user}', [UserController::class, 'destroy'])
        ->middleware('perm:canManageUsers');

    // Settings / Permissions
    Route::get('settings/permissions', [SettingsController::class, 'getPermissions']);
    Route::put('settings/permissions', [SettingsController::class, 'updatePermissions'])
        ->middleware('role:admin');

    // Audit Logs - admin only
    Route::get('audit-logs', [AuditLogController::class, 'index'])
        ->middleware('role:admin');
});