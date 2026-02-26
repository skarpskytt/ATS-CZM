<?php

use App\Http\Controllers\ApplicantController;
use App\Http\Controllers\ApplicantNoteController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PositionController;
use Illuminate\Support\Facades\Route;

Route::post('login', [AuthController::class, 'login']);
Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('reset-password', [AuthController::class, 'resetPassword']);
Route::post('public/applicants', [ApplicantController::class, 'storePublic']);
Route::get('positions', [PositionController::class, 'publicIndex']);

Route::middleware('auth:sanctum')->group(function (): void {
	Route::post('logout', [AuthController::class, 'logout']);
	Route::get('me', [AuthController::class, 'me']);

	Route::apiResource('applicants', ApplicantController::class);
	Route::get('applicants/{applicant}/notes', [ApplicantNoteController::class, 'index']);
	Route::post('applicants/{applicant}/notes', [ApplicantNoteController::class, 'store']);

	Route::get('dashboard/overview', [DashboardController::class, 'overview']);
	Route::apiResource('positions', PositionController::class);
});
