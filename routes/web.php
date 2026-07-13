<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\IngredientController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\ProductionController;
use App\Http\Controllers\ExpeditionController;
use App\Http\Controllers\ReceptionController;
use App\Http\Controllers\CommandeUrgenteController;
use App\Http\Controllers\ReturnController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\HaccpController;
use App\Http\Controllers\NonConformiteController;
use App\Http\Controllers\ReportingController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\StockMovementController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\FactureController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ============================================
// AUTHENTIFICATION (publiques)
// ============================================

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
});

Route::middleware('auth')->post('/logout', [AuthController::class, 'logout'])->name('logout');

// Broadcasting : géré via bootstrap/app.php -> withRouting(channels: ...)

// ============================================
// DASHBOARD (auth)
// ============================================

Route::middleware('auth')->get('/', [DashboardController::class, 'index'])->name('dashboard');

// ============================================
// PRODUITS / INGRÉDIENTS / CATÉGORIES / RECETTES
// ============================================

Route::middleware('auth')->prefix('products')->name('products.')->group(function () {
    Route::get('/', [ProductController::class, 'index'])->name('index');
    Route::post('/', [ProductController::class, 'store'])->middleware('role:ADMIN,RESP_LABO')->name('store');
    Route::put('/{product}', [ProductController::class, 'update'])->middleware('role:ADMIN,RESP_LABO')->name('update');
    Route::delete('/{product}', [ProductController::class, 'destroy'])->middleware('role:ADMIN,RESP_LABO')->name('destroy');
    Route::get('/{product}/recipe', [ProductController::class, 'recipe'])->name('recipe');
    Route::put('/{product}/recipe', [ProductController::class, 'updateRecipe'])->middleware('role:ADMIN,RESP_LABO')->name('recipe.update');
});

Route::middleware('auth')->prefix('categories')->name('categories.')->group(function () {
    Route::post('/', [CategoryController::class, 'store'])->middleware('role:ADMIN,RESP_LABO')->name('store');
    Route::put('/{category}', [CategoryController::class, 'update'])->middleware('role:ADMIN,RESP_LABO')->name('update');
    Route::delete('/{category}', [CategoryController::class, 'destroy'])->middleware('role:ADMIN,RESP_LABO')->name('destroy');
});

Route::middleware('auth')->prefix('ingredients')->name('ingredients.')->group(function () {
    Route::post('/', [IngredientController::class, 'store'])->middleware('role:ADMIN,RESP_LABO')->name('store');
    Route::put('/{ingredient}', [IngredientController::class, 'update'])->middleware('role:ADMIN,RESP_LABO')->name('update');
    Route::delete('/{ingredient}', [IngredientController::class, 'destroy'])->middleware('role:ADMIN,RESP_LABO')->name('destroy');
});

// ============================================
// STOCKS (INVENTORY)
// ============================================

Route::middleware('auth')->prefix('inventory')->name('inventory.')->group(function () {
    Route::get('/', [InventoryController::class, 'index'])->name('index');
    Route::get('/lots', [InventoryController::class, 'lotsIndex'])->name('lots.index');
    Route::put('/adjust-batch', [InventoryController::class, 'adjustBatch'])->middleware('role:ADMIN,RESP_LABO')->name('adjust-batch');
    Route::put('/{ingredient}', [InventoryController::class, 'update'])->middleware('role:ADMIN,RESP_LABO')->name('update');
    Route::post('/create-ingredient', [InventoryController::class, 'createIngredientWithStock'])->middleware('role:ADMIN,RESP_LABO')->name('create.ingredient');

    // Mouvements de stock (DLC + FIFO)
    Route::middleware('role:ADMIN,RESP_LABO,RESP_BOUTIQUE,EMPLOYE_VENTE')->prefix('movements')->name('movements.')->group(function () {
        Route::get('/', [StockMovementController::class, 'index'])->name('index');
        Route::post('/entree', [StockMovementController::class, 'store'])->name('entree.store')->middleware('role:ADMIN,RESP_LABO');
        Route::post('/ajustement', [StockMovementController::class, 'ajustement'])->name('ajustement.store')->middleware('role:ADMIN,RESP_LABO');
        Route::get('/alerts', [StockMovementController::class, 'getAlerts'])->name('alerts');
        Route::get('/balances/{ingredient}', [StockMovementController::class, 'getBalances'])->name('balances');
        Route::post('/preview-consume', [StockMovementController::class, 'previewConsumption'])->name('preview-consume');
    });
});

// ============================================
// STOCK BOULANGERIE (produits finis)
// ============================================

Route::middleware('auth')->prefix('stock')->name('stock.')->group(function () {
    Route::get('/', [StockController::class, 'index'])->name('index');
    Route::post('/adjust', [StockController::class, 'adjust'])->middleware('role:ADMIN,RESP_BOUTIQUE')->name('adjust');
    Route::get('/movements', [StockController::class, 'movements'])->name('movements');
});

// ============================================
// PRODUCTION
// ============================================

Route::middleware('auth')->prefix('production')->name('production.')->group(function () {
    Route::get('/', [ProductionController::class, 'index'])->name('index');
    Route::post('/', [ProductionController::class, 'store'])->middleware('role:ADMIN,RESP_LABO,EMPLOYE_LABO')->name('store');
    Route::put('/{production}', [ProductionController::class, 'update'])->middleware('role:ADMIN,RESP_LABO')->name('update');
    Route::delete('/{production}', [ProductionController::class, 'destroy'])->middleware('role:ADMIN,RESP_LABO')->name('destroy');
    Route::post('/batch', [ProductionController::class, 'batch'])->middleware('role:ADMIN,RESP_LABO,EMPLOYE_LABO')->name('batch');
    Route::post('/distribuer', [ProductionController::class, 'distribuer'])->middleware('role:ADMIN,RESP_LABO')->name('distribuer');
});

// ============================================
// EXPÉDITIONS
// ============================================

Route::middleware('auth')->prefix('expeditions')->name('expeditions.')->group(function () {
    Route::get('/', [ExpeditionController::class, 'index'])->name('index');
    Route::get('/{expedition}', [ExpeditionController::class, 'show'])->name('show');
    Route::post('/', [ExpeditionController::class, 'store'])->middleware('role:ADMIN,RESP_LABO')->name('store');
    Route::put('/{expedition}/status', [ExpeditionController::class, 'updateStatus'])->middleware('role:ADMIN,RESP_LABO')->name('status');
});

// ============================================
// RÉCEPTIONS
// ============================================

Route::middleware('auth')->prefix('receptions')->name('receptions.')->group(function () {
    Route::get('/', [ReceptionController::class, 'index'])->name('index');
    Route::post('/{reception}/confirm', [ReceptionController::class, 'confirm'])->middleware('role:ADMIN,RESP_BOUTIQUE,EMPLOYE_VENTE')->name('confirm');
});

// ============================================
// COMMANDES URGENTES (F4 — Réassort jour même)
// ============================================

Route::middleware('auth')->prefix('commandes-urgentes')->name('commandes-urgentes.')->group(function () {
    // Index : listing (filtrage automatique par rôle dans le contrôleur)
    Route::get('/', [CommandeUrgenteController::class, 'index'])->name('index');

    // Création (formulaire) — boutiques + admin
    Route::get('/create', [CommandeUrgenteController::class, 'create'])
        ->middleware('role:RESP_BOUTIQUE,EMPLOYE_VENTE,ADMIN')
        ->name('create');

    // Création (POST) — boutiques + admin
    Route::post('/', [CommandeUrgenteController::class, 'store'])
        ->middleware('role:RESP_BOUTIQUE,EMPLOYE_VENTE,ADMIN')
        ->name('store');

    // Actions labo
    Route::post('/{commande}/take', [CommandeUrgenteController::class, 'take'])
        ->middleware('role:RESP_LABO,EMPLOYE_LABO,ADMIN')
        ->name('take');

    Route::post('/{commande}/status', [CommandeUrgenteController::class, 'updateStatus'])
        ->middleware('role:RESP_LABO,EMPLOYE_LABO,ADMIN')
        ->name('status');

    // Création BL depuis commande urgente
    Route::get('/{commande}/create-bl', [CommandeUrgenteController::class, 'createBl'])
        ->middleware('role:RESP_LABO,EMPLOYE_LABO,ADMIN')
        ->name('create-bl');

    // Détail d'une commande urgente
    Route::get('/{commande}', [CommandeUrgenteController::class, 'show'])
        ->middleware('role:RESP_BOUTIQUE,EMPLOYE_VENTE,RESP_LABO,EMPLOYE_LABO,ADMIN')
        ->name('show');
});

// ============================================
// RETOURS PRODUITS
// ============================================

Route::middleware('auth')->prefix('returns')->name('returns.')->group(function () {
    // Index : tous les rôles concernés (filtrage interne)
    Route::get('/', [ReturnController::class, 'index'])->name('index');

    // Création : boutiques + admin
    Route::get('/create', [ReturnController::class, 'create'])
        ->middleware('role:RESP_BOUTIQUE,EMPLOYE_VENTE,ADMIN')
        ->name('create');
    Route::post('/', [ReturnController::class, 'store'])
        ->middleware('role:RESP_BOUTIQUE,EMPLOYE_VENTE,ADMIN')
        ->name('store');

    // Saisie 19h (invendus) + déclencheur automatique retour Type B
    Route::post('/saisir-19h', [ReturnController::class, 'saisir19h'])
        ->middleware('role:RESP_BOUTIQUE,EMPLOYE_VENTE,ADMIN')
        ->name('saisir19h');

    // Détail et actions
    Route::get('/{productReturn}', [ReturnController::class, 'show'])->name('show');
    Route::get('/{productReturn}/edit', [ReturnController::class, 'edit'])->name('edit');
    Route::put('/{productReturn}', [ReturnController::class, 'update'])->name('update');
    Route::post('/{productReturn}/send', [ReturnController::class, 'send'])
        ->middleware('role:RESP_BOUTIQUE,EMPLOYE_VENTE,ADMIN')
        ->name('send');
    Route::post('/{productReturn}/confirm', [ReturnController::class, 'confirm'])
        ->middleware('role:ADMIN,RESP_LABO')
        ->name('confirm');
    Route::post('/{productReturn}/reject', [ReturnController::class, 'reject'])
        ->middleware('role:ADMIN,RESP_LABO')
        ->name('reject');
    Route::post('/{productReturn}/process', [ReturnController::class, 'process'])
        ->middleware('role:ADMIN,RESP_LABO')
        ->name('process');

    // Photos
    Route::post('/{productReturn}/photos', [ReturnController::class, 'addPhoto'])
        ->middleware('role:RESP_BOUTIQUE,EMPLOYE_VENTE,ADMIN,RESP_LABO')
        ->name('photos.store');
    Route::delete('/photos/{photo}', [ReturnController::class, 'deletePhoto'])
        ->middleware('role:RESP_BOUTIQUE,EMPLOYE_VENTE,ADMIN,RESP_LABO')
        ->name('photos.destroy');

    // Annulation (brouillon seulement)
    Route::delete('/{productReturn}', [ReturnController::class, 'cancel'])
        ->middleware('role:RESP_BOUTIQUE,EMPLOYE_VENTE,ADMIN')
        ->name('destroy');
});

// ============================================
// VENTES & INVENDUS
// ============================================

Route::middleware('auth')->prefix('sales')->name('sales.')->group(function () {
    Route::get('/', [SaleController::class, 'index'])->name('index');
    Route::post('/', [SaleController::class, 'store'])->middleware('role:ADMIN,RESP_BOUTIQUE,EMPLOYE_VENTE')->name('store');
});

// ============================================
// HACCP
// ============================================

Route::middleware('auth')->prefix('haccp')->name('haccp.')->group(function () {
    Route::get('/', [HaccpController::class, 'index'])->name('index');
    Route::get('/temperatures', [HaccpController::class, 'temperatures'])->name('temperatures');
    Route::post('/temperatures', [HaccpController::class, 'storeTemperature'])->name('temperatures.store');
    Route::get('/nettoyage', [HaccpController::class, 'nettoyage'])->name('nettoyage');
    Route::post('/nettoyage', [HaccpController::class, 'storeNettoyage'])->name('nettoyage.store');
    Route::put('/nettoyage/{nettoyage}', [HaccpController::class, 'updateNettoyage'])->name('nettoyage.update');
    Route::get('/receptions-fournisseurs', [HaccpController::class, 'receptionsFournisseurs'])->name('receptions-fournisseurs');
    Route::post('/receptions-fournisseurs', [HaccpController::class, 'storeReceptionFournisseur'])->name('receptions-fournisseurs.store');
});

// ============================================
// NON-CONFORMITÉS
// ============================================

Route::middleware('auth')->prefix('nonconformites')->name('nonconformites.')->group(function () {
    Route::get('/', [NonConformiteController::class, 'index'])->name('index');
    Route::post('/', [NonConformiteController::class, 'store'])->name('store');
    Route::put('/{nc}', [NonConformiteController::class, 'update'])->middleware('role:ADMIN,RESP_LABO,RESP_BOUTIQUE')->name('update');
});

// ============================================
// REPORTING (ADMIN + DIRECTION)
// ============================================

Route::middleware(['auth', 'role:ADMIN,DIRECTION'])->get('/reporting', [ReportingController::class, 'index'])->name('reporting.index');

// ============================================
// ADMIN (ADMIN SEUL)
// ============================================

Route::middleware(['auth', 'role:ADMIN'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [AdminController::class, 'index'])->name('index');
    Route::post('/entities', [AdminController::class, 'storeEntity'])->name('entities.store');
    Route::put('/entities/{entity}', [AdminController::class, 'updateEntity'])->name('entities.update');
    Route::post('/entities/{entity}/logo', [AdminController::class, 'uploadEntityLogo'])->name('entities.logo.upload');
    Route::delete('/entities/{entity}/logo', [AdminController::class, 'deleteEntityLogo'])->name('entities.logo.delete');
    Route::delete('/entities/{entity}', [AdminController::class, 'destroyEntity'])->name('entities.destroy');
    Route::post('/users', [AdminController::class, 'storeUser'])->name('users.store');
    Route::put('/users/{user}', [AdminController::class, 'updateUser'])->name('users.update');
    Route::delete('/users/{user}', [AdminController::class, 'destroyUser'])->name('users.destroy');

    // Recalcul des coûts de revient des produits
    Route::post('/products/recalc-costs', function () {
        $count = 0;
        foreach (\App\Models\Product::with('recipes.ingredient')->get() as $product) {
            $product->recalculerCoutRevient();
            $count++;
        }
        return back()->with('success', "Coûts de revient recalculés pour $count produits.");
    })->name('products.recalc-costs');

    // Settings facturation
    Route::prefix('facture-settings')->name('facture-settings.')->group(function () {
        Route::get('/', [AdminController::class, 'factureSettings'])->name('index');
        Route::post('/toggle-auto', [AdminController::class, 'toggleAutoGeneration'])->name('toggle-auto');
    });
});

// ============================================
// FACTURATION
// ============================================

// Génération/gestions factures (LABO + consultation boutiques)
Route::middleware('auth')->prefix('factures')->name('factures.')->group(function () {
    // Index : filtrage automatique par entité dans le contrôleur
    Route::get('/', [FactureController::class, 'index'])->name('index');

    // Consultation factures d'une boutique spécifique (historique)
    // DOIT être avant /{facture} pour éviter conflit de routes
    Route::get('/boutique/{boutique}', [FactureController::class, 'boutiqueHistory'])->name('boutique.history');

    // Création/édition : réservée LABO + ADMIN
    Route::get('/create', [FactureController::class, 'create'])
        ->middleware('role:ADMIN,RESP_LABO')
        ->name('create');
    Route::post('/', [FactureController::class, 'store'])
        ->middleware('role:ADMIN,RESP_LABO')
        ->name('store');

    // Actions sur factures spécifiques : validation/paiement/annulation/suppression = LABO+ADMIN
    // Consultation (show/pdf) = tous les rôles (filtrage dans authorizeView)
    Route::get('/{facture}', [FactureController::class, 'show'])->name('show');
    Route::get('/{facture}/pdf', [FactureController::class, 'pdf'])->name('pdf');
    Route::put('/{facture}/validate', [FactureController::class, 'validateFacture'])
        ->middleware('role:ADMIN,RESP_LABO')
        ->name('validate');
    Route::put('/{facture}/pay', [FactureController::class, 'pay'])
        ->middleware('role:ADMIN,RESP_LABO')
        ->name('pay');
    Route::put('/{facture}/cancel', [FactureController::class, 'cancel'])
        ->middleware('role:ADMIN,RESP_LABO')
        ->name('cancel');
    Route::delete('/{facture}', [FactureController::class, 'destroy'])
        ->middleware('role:ADMIN,RESP_LABO')
        ->name('destroy');
});