<?php

use App\Http\Controllers\Api\SyncCaisseController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');



// PHASE 3.5 — C2 : ces routes étaient PUBLIQUES et `syncDataVente` acceptait un
// `entity_id` arbitraire : n'importe qui pouvait injecter des ventes et modifier
// les stocks de n'importe quel store. Le middleware `caisse.token` authentifie
// désormais la caisse par le jeton de son store et fixe le contexte tenant ;
// le contrôleur contraint ensuite `entity_id` aux entités de ce store.
Route::middleware('caisse.token')->prefix('sync-caisse')->group(function () {
    Route::get('/getetab', [SyncCaisseController::class, 'getEtab']);
    Route::post('/', [SyncCaisseController::class, 'syncDataVente']);
});
