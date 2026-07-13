<?php

use App\Http\Controllers\Api\SyncCaisseController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');



Route::prefix('sync-caisse')->group(function () {
    Route::get('/getetab', [SyncCaisseController::class, 'getEtab']);
    Route::post('/', [SyncCaisseController::class, 'syncDataVente']);
});
