<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// 認証ルート
Route::get('/login', function() {
    return response()->json(['message' => 'ログインが必要です'], 401);
})->name('login'); 