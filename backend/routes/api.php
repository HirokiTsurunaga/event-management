<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\RegistrationController;
use App\Http\Controllers\Api\CheckInController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// 認証不要のAPI
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// パブリックなイベント関連API
Route::get('/events', [EventController::class, 'index']);
Route::get('/events/{event}', [EventController::class, 'show']);

// 認証が必要なAPI
Route::middleware('auth:sanctum')->group(function () {
    // ユーザー関連
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // イベント管理（管理者用）
    Route::post('/events', [EventController::class, 'store']);
    Route::put('/events/{event}', [EventController::class, 'update']);
    Route::delete('/events/{event}', [EventController::class, 'destroy']);
    
    // イベント参加登録
    Route::post('/events/{event}/register', [RegistrationController::class, 'register']);
    Route::delete('/events/{event}/cancel', [RegistrationController::class, 'cancel']);
    Route::get('/my-registrations', [RegistrationController::class, 'myRegistrations']);
    
    // チェックイン
    Route::post('/events/{event}/checkin', [CheckInController::class, 'checkIn']);
    Route::get('/events/{event}/attendees', [CheckInController::class, 'getAttendees']);

    // 参加登録ルート
    Route::get('/registrations', [RegistrationController::class, 'index']);
    Route::post('/registrations', [RegistrationController::class, 'store']);
    Route::get('/registrations/{id}', [RegistrationController::class, 'show']);
    Route::post('/registrations/{id}/cancel', [RegistrationController::class, 'cancel']);
    
    // イベント参加者管理ルート (管理者のみ)
    Route::get('/events/{eventId}/participants', [RegistrationController::class, 'getEventParticipants']);
    Route::patch('/registrations/{id}/status', [RegistrationController::class, 'updateStatus']);
}); 