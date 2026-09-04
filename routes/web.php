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
use App\Http\Controllers\Store\StoreRegistrationController;
use App\Http\Controllers\Store\StoreAuthController;
use App\Http\Controllers\Store\StoreDashboardController;
use App\Http\Controllers\Store\StoreEmployeeController;
use App\Http\Controllers\SuperAdmin\SuperAdminAuthController;
use App\Http\Controllers\SuperAdmin\StoreManagementController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ============================================
// AUTHENTIFICATION (publiques)
// ============================================

// ============================================
// AUTHENTIFICATION BOUTIQUE (self-service, guard "store")
// ============================================

Route::middleware('guest:store')->group(function () {
    Route::get('/register', [StoreRegistrationController::class, 'create'])->name('store.register');
    Route::post('/register', [StoreRegistrationController::class, 'store'])->name('store.register.submit');
    Route::get('/store/login', [StoreAuthController::class, 'create'])->name('store.login');
    Route::post('/store/login', [StoreAuthController::class, 'store'])->name('store.login.submit');
});

// ============================================
// SUPER ADMIN (guard "super_admin")
// ============================================

Route::middleware('guest:super_admin')->group(function () {
    Route::get('/super-admin/login', [SuperAdminAuthController::class, 'create'])->name('superadmin.login');
    Route::post('/super-admin/login', [SuperAdminAuthController::class, 'store'])->name('superadmin.login.submit');
});

// ============================================
// AUTHENTIFICATION EMPLOYÉS (par Store slug) — DOIT venir après les routes statiques
// ============================================

Route::middleware('guest')->group(function () {
    // Login d'employés avec slug du store (paramétrique)
    Route::get('/{slug}/login', [AuthController::class, 'showLogin'])->name('login')->where('slug', '(?!(?:store|super-admin|register|login)(?:/|$))[a-z0-9\-]+');
    Route::post('/{slug}/login', [AuthController::class, 'login'])->where('slug', '(?!(?:store|super-admin|register|login)(?:/|$))[a-z0-9\-]+');

    // Fallback: redirection générique
    Route::get('/login', function () {
        return redirect('/labo-maeva-cayenne-store/login');
    })->name('login.fallback');
});

// ============================================
// EMPLOYÉ ROUTES AVEC SLUG ({slug}/...)
// Toutes les routes de l'employé sont préfixées par le slug du store
// ============================================

// `slug.store` (Phase 3.5) : vérifie que le slug de l'URL correspond bien au
// store de l'employé connecté. Sans lui, un employé du store A pouvait naviguer
// sous le slug du store B. L'ADMIN interne en est exempté (rôle plateforme).
Route::middleware(['auth:web', 'slug.store'])->prefix('/{slug}')->where(['slug' => '(?!(?:store|super-admin|register|login)(?:/|$))[a-z0-9\-]+'])->group(function () {
    // Logout
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    // ============================================
    // DASHBOARD (GET / et GET /dashboard)
    // ============================================
    Route::get('/', [DashboardController::class, 'index'])->name('employee.dashboard');
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('employee.dashboard.explicit');

    // ============================================
    // PRODUITS / INGRÉDIENTS / CATÉGORIES / RECETTES
    // ============================================

    Route::prefix('products')->name('products.')->group(function () {
        Route::get('/', [ProductController::class, 'index'])->name('index');
        Route::post('/', [ProductController::class, 'store'])->middleware('role:ADMIN,RESP_LABO')->name('store');
        Route::put('/{product}', [ProductController::class, 'update'])->middleware('role:ADMIN,RESP_LABO')->name('update');
        Route::delete('/{product}', [ProductController::class, 'destroy'])->middleware('role:ADMIN,RESP_LABO')->name('destroy');
        Route::get('/{product}/recipe', [ProductController::class, 'recipe'])->name('recipe');
        Route::put('/{product}/recipe', [ProductController::class, 'updateRecipe'])->middleware('role:ADMIN,RESP_LABO')->name('recipe.update');
    });

    Route::prefix('categories')->name('categories.')->group(function () {
        Route::post('/', [CategoryController::class, 'store'])->middleware('role:ADMIN,RESP_LABO')->name('store');
        Route::put('/{category}', [CategoryController::class, 'update'])->middleware('role:ADMIN,RESP_LABO')->name('update');
        Route::delete('/{category}', [CategoryController::class, 'destroy'])->middleware('role:ADMIN,RESP_LABO')->name('destroy');
    });

    Route::prefix('ingredients')->name('ingredients.')->group(function () {
        Route::post('/', [IngredientController::class, 'store'])->middleware('role:ADMIN,RESP_LABO')->name('store');
        Route::put('/{ingredient}', [IngredientController::class, 'update'])->middleware('role:ADMIN,RESP_LABO')->name('update');
        Route::delete('/{ingredient}', [IngredientController::class, 'destroy'])->middleware('role:ADMIN,RESP_LABO')->name('destroy');
    });

    // ============================================
    // STOCKS (INVENTORY)
    // ============================================

    Route::prefix('inventory')->name('inventory.')->group(function () {
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

    Route::prefix('stock')->name('stock.')->group(function () {
        Route::get('/', [StockController::class, 'index'])->name('index');
        Route::post('/adjust', [StockController::class, 'adjust'])->middleware('role:ADMIN,RESP_BOUTIQUE')->name('adjust');
        Route::get('/movements', [StockController::class, 'movements'])->name('movements');
    });

    // ============================================
    // PRODUCTION
    // ============================================

    Route::prefix('production')->name('production.')->group(function () {
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

    Route::middleware('store.guard')->prefix('expeditions')->name('expeditions.')->group(function () {
        Route::get('/', [ExpeditionController::class, 'index'])->name('index');
        Route::get('/{expedition}', [ExpeditionController::class, 'show'])->name('show');
        Route::post('/', [ExpeditionController::class, 'store'])->middleware('role:ADMIN,RESP_LABO')->name('store');
        Route::put('/{expedition}/status', [ExpeditionController::class, 'updateStatus'])->middleware('role:ADMIN,RESP_LABO')->name('status');
    });

    // ============================================
    // RÉCEPTIONS
    // ============================================

    Route::middleware('store.guard')->prefix('receptions')->name('receptions.')->group(function () {
        Route::get('/', [ReceptionController::class, 'index'])->name('index');
        Route::post('/{reception}/confirm', [ReceptionController::class, 'confirm'])->middleware('role:ADMIN,RESP_BOUTIQUE,EMPLOYE_VENTE')->name('confirm');
    });

    // ============================================
    // COMMANDES URGENTES (F4 — Réassort jour même)
    // ============================================

    Route::prefix('commandes-urgentes')->name('commandes-urgentes.')->group(function () {
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

    Route::middleware('store.guard')->prefix('returns')->name('returns.')->group(function () {
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

    Route::middleware('store.guard')->prefix('sales')->name('sales.')->group(function () {
        Route::get('/', [SaleController::class, 'index'])->name('index');
        Route::post('/', [SaleController::class, 'store'])->middleware('role:ADMIN,RESP_BOUTIQUE,EMPLOYE_VENTE')->name('store');
    });

    // ============================================
    // HACCP
    // ============================================

    Route::prefix('haccp')->name('haccp.')->group(function () {
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

    Route::middleware('store.guard')->prefix('nonconformites')->name('nonconformites.')->group(function () {
        Route::get('/', [NonConformiteController::class, 'index'])->name('index');
        Route::post('/', [NonConformiteController::class, 'store'])->name('store');
        Route::put('/{nc}', [NonConformiteController::class, 'update'])->middleware('role:ADMIN,RESP_LABO,RESP_BOUTIQUE')->name('update');
    });

    // ============================================
    // REPORTING (ADMIN + DIRECTION)
    // ============================================

    Route::middleware('role:ADMIN,DIRECTION')->get('/reporting', [ReportingController::class, 'index'])->name('reporting.index');

    // ============================================
    // ADMIN (Admin interne seulement)
    // ============================================

    // `role:ADMIN` (correctif P0 escalade de privilèges) : ce groupe gère la
    // création/suppression d'utilisateurs et d'entités globales. Avant ce
    // middleware, seul le GUARD était vérifié (web vs store) dans
    // AdminController, jamais le RÔLE — n'importe quel employé (EMPLOYE_VENTE,
    // etc.) pouvait créer un compte ADMIN ou modifier/supprimer un utilisateur
    // de n'importe quel store.
    Route::middleware('role:ADMIN')->prefix('admin')->name('admin.')->group(function () {
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
    Route::prefix('factures')->name('factures.')->group(function () {
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
});

// ============================================
// STORE ADMIN (guard "store", /store/* routes)
// ============================================

Route::middleware('auth:store')->group(function () {
    Route::post('/store/logout', [StoreAuthController::class, 'destroy'])->name('store.logout');

    // `role:STORE_ADMIN` = fail-closed. Aujourd'hui tous les store_users sont
    // STORE_ADMIN (enum à une seule valeur), donc aucun changement fonctionnel.
    // Mais dès qu'un rôle employé boutique sera ajouté à StoreUserRole, il sera
    // refusé par défaut sur TOUT l'espace /store/* : il faudra ouvrir chaque
    // route explicitement au lieu de découvrir un accès non voulu.
    Route::middleware(['store.active', 'store.guard', 'role:STORE_ADMIN'])->group(function () {
        Route::get('/store/dashboard', [StoreDashboardController::class, 'index'])->name('store.dashboard');

        // ============================================
        // STORE EMPLOYEE MANAGEMENT (Admin section)
        // ============================================
        Route::prefix('store/admin')->name('store.admin.')->group(function () {
            // Espace Store Admin — interface Admin/Index CLOISONNÉE : le store
            // admin (guard "store") ne voit que son propre store (ses employés,
            // onglet Utilisateurs uniquement). Pas d'entités globales ni de
            // paramètres de facturation (réservés à l'admin interne).
            Route::get('/', [AdminController::class, 'index'])->name('index');

            // Gestion des utilisateurs (employés du store — scopé par store_id côté contrôleur)
            Route::post('/users', [AdminController::class, 'storeUser'])->name('users.store');
            Route::put('/users/{user}', [AdminController::class, 'updateUser'])->name('users.update');
            Route::delete('/users/{user}', [AdminController::class, 'destroyUser'])->name('users.destroy');

            // Employee Management — l'URL /store/admin/employees affiche la même
            // interface cloisonnée.
            Route::prefix('employees')->name('employees.')->group(function () {
                Route::get('/', [AdminController::class, 'index'])->name('index');
                Route::get('/create', [StoreEmployeeController::class, 'create'])->name('create');
                Route::post('/', [StoreEmployeeController::class, 'store'])->name('store');
                Route::get('/{employee}/edit', [StoreEmployeeController::class, 'edit'])->name('edit');
                Route::put('/{employee}', [StoreEmployeeController::class, 'update'])->name('update');
                Route::delete('/{employee}', [StoreEmployeeController::class, 'destroy'])->name('destroy');
                Route::post('/{employee}/toggle-active', [StoreEmployeeController::class, 'toggleActive'])->name('toggle-active');
            });

            // Settings (store info, logo, etc.)
            Route::prefix('settings')->name('settings.')->group(function () {
                Route::get('/', function () {
                    return Inertia::render('Store/Admin/Settings');
                })->name('index');
            });
        });

        // Keep backward compatibility - old route path
        Route::prefix('store/employees')->name('store.employees.')->group(function () {
            Route::get('/', [StoreEmployeeController::class, 'index'])->name('index');
            Route::get('/create', [StoreEmployeeController::class, 'create'])->name('create');
            Route::post('/', [StoreEmployeeController::class, 'store'])->name('store');
            Route::get('/{employee}/edit', [StoreEmployeeController::class, 'edit'])->name('edit');
            Route::put('/{employee}', [StoreEmployeeController::class, 'update'])->name('update');
            Route::delete('/{employee}', [StoreEmployeeController::class, 'destroy'])->name('destroy');
            Route::post('/{employee}/toggle-active', [StoreEmployeeController::class, 'toggleActive'])->name('toggle-active');
        });

        // ============================================
        // STORE CRM ROUTES (/store/*)
        // ============================================

        // Production (CRUD)
        Route::get('/store/production', [ProductionController::class, 'index'])->name('store.production');
        Route::post('/store/production', [ProductionController::class, 'store'])->name('store.production.store');
        Route::put('/store/production/{production}', [ProductionController::class, 'update'])->name('store.production.update');
        Route::delete('/store/production/{production}', [ProductionController::class, 'destroy'])->name('store.production.destroy');

        // Products (CRUD)
        Route::get('/store/products', [ProductController::class, 'index'])->name('store.products');
        Route::post('/store/products', [ProductController::class, 'store'])->name('store.products.store');
        Route::put('/store/products/{product}', [ProductController::class, 'update'])->name('store.products.update');
        Route::delete('/store/products/{product}', [ProductController::class, 'destroy'])->name('store.products.destroy');
        Route::get('/store/products/{product}/recipe', [ProductController::class, 'recipe'])->name('store.products.recipe');
        Route::put('/store/products/{product}/recipe', [ProductController::class, 'updateRecipe'])->name('store.products.recipe.update');

        // Stocks (READ + ADJUST)
        Route::get('/store/stocks', [StockController::class, 'index'])->name('store.stocks');
        Route::post('/store/stocks/adjust', [StockController::class, 'adjust'])->name('store.stocks.adjust');
        Route::get('/store/stocks/movements', [StockController::class, 'movements'])->name('store.stocks.movements');

        // Inventory (CRUD + movements)
        Route::get('/store/inventory', [InventoryController::class, 'index'])->name('store.inventory');
        Route::get('/store/inventory/lots', [InventoryController::class, 'lotsIndex'])->name('store.inventory.lots');
        Route::put('/store/inventory/{ingredient}', [InventoryController::class, 'update'])->name('store.inventory.update');
        Route::put('/store/inventory/adjust-batch', [InventoryController::class, 'adjustBatch'])->name('store.inventory.adjust-batch');
        Route::post('/store/inventory/create-ingredient', [InventoryController::class, 'createIngredientWithStock'])->name('store.inventory.create-ingredient');
        Route::get('/store/inventory/movements', [StockMovementController::class, 'index'])->name('store.inventory.movements');
        Route::post('/store/inventory/movements/entree', [StockMovementController::class, 'store'])->name('store.inventory.movements.entree');
        Route::post('/store/inventory/movements/ajustement', [StockMovementController::class, 'ajustement'])->name('store.inventory.movements.ajustement');
        Route::get('/store/inventory/movements/alerts', [StockMovementController::class, 'getAlerts'])->name('store.inventory.movements.alerts');
        Route::get('/store/inventory/movements/balances/{ingredient}', [StockMovementController::class, 'getBalances'])->name('store.inventory.movements.balances');
        Route::post('/store/inventory/movements/preview-consume', [StockMovementController::class, 'previewConsumption'])->name('store.inventory.movements.preview-consume');

        // HACCP (CRUD)
        Route::get('/store/haccp', [HaccpController::class, 'index'])->name('store.haccp');
        Route::get('/store/haccp/temperatures', [HaccpController::class, 'temperatures'])->name('store.haccp.temperatures');
        Route::post('/store/haccp/temperatures', [HaccpController::class, 'storeTemperature'])->name('store.haccp.temperatures.store');
        Route::get('/store/haccp/nettoyage', [HaccpController::class, 'nettoyage'])->name('store.haccp.nettoyage');
        Route::post('/store/haccp/nettoyage', [HaccpController::class, 'storeNettoyage'])->name('store.haccp.nettoyage.store');
        Route::put('/store/haccp/nettoyage/{nettoyage}', [HaccpController::class, 'updateNettoyage'])->name('store.haccp.nettoyage.update');
        Route::get('/store/haccp/receptions-fournisseurs', [HaccpController::class, 'receptionsFournisseurs'])->name('store.haccp.receptions-fournisseurs');
        Route::post('/store/haccp/receptions-fournisseurs', [HaccpController::class, 'storeReceptionFournisseur'])->name('store.haccp.receptions-fournisseurs.store');

        // Facturation (READ + actions)
        Route::get('/store/facturation', [FactureController::class, 'index'])->name('store.facturation');
        Route::get('/store/facturation/create', [FactureController::class, 'create'])->name('store.facturation.create');
        Route::post('/store/facturation', [FactureController::class, 'store'])->name('store.facturation.store');
        Route::get('/store/facturation/{facture}', [FactureController::class, 'show'])->name('store.facturation.show');
        Route::get('/store/facturation/{facture}/pdf', [FactureController::class, 'pdf'])->name('store.facturation.pdf');
        Route::put('/store/facturation/{facture}/validate', [FactureController::class, 'validateFacture'])->name('store.facturation.validate');
        Route::put('/store/facturation/{facture}/pay', [FactureController::class, 'pay'])->name('store.facturation.pay');
        Route::put('/store/facturation/{facture}/cancel', [FactureController::class, 'cancel'])->name('store.facturation.cancel');
        Route::delete('/store/facturation/{facture}', [FactureController::class, 'destroy'])->name('store.facturation.destroy');

        // Reporting (READ)
        Route::get('/store/reporting', [ReportingController::class, 'index'])->name('store.reporting');

        // Receptions (READ + confirm)
        Route::get('/store/receptions', [ReceptionController::class, 'index'])->name('store.receptions');
        Route::post('/store/receptions/{reception}/confirm', [ReceptionController::class, 'confirm'])->name('store.receptions.confirm');

        // Returns (CRUD)
        Route::get('/store/returns', [ReturnController::class, 'index'])->name('store.returns');
        Route::get('/store/returns/create', [ReturnController::class, 'create'])->name('store.returns.create');
        Route::post('/store/returns', [ReturnController::class, 'store'])->name('store.returns.store');
        Route::get('/store/returns/{productReturn}', [ReturnController::class, 'show'])->name('store.returns.show');
        Route::get('/store/returns/{productReturn}/edit', [ReturnController::class, 'edit'])->name('store.returns.edit');
        Route::put('/store/returns/{productReturn}', [ReturnController::class, 'update'])->name('store.returns.update');
        Route::post('/store/returns/saisir-19h', [ReturnController::class, 'saisir19h'])->name('store.returns.saisir19h');
        Route::post('/store/returns/{productReturn}/send', [ReturnController::class, 'send'])->name('store.returns.send');
        Route::post('/store/returns/{productReturn}/confirm', [ReturnController::class, 'confirm'])->name('store.returns.confirm');
        Route::post('/store/returns/{productReturn}/reject', [ReturnController::class, 'reject'])->name('store.returns.reject');
        Route::post('/store/returns/{productReturn}/process', [ReturnController::class, 'process'])->name('store.returns.process');
        Route::post('/store/returns/{productReturn}/photos', [ReturnController::class, 'addPhoto'])->name('store.returns.photos.store');
        Route::delete('/store/returns/photos/{photo}', [ReturnController::class, 'deletePhoto'])->name('store.returns.photos.destroy');
        Route::delete('/store/returns/{productReturn}', [ReturnController::class, 'cancel'])->name('store.returns.destroy');

        // Expeditions (CRUD)
        Route::get('/store/expeditions', [ExpeditionController::class, 'index'])->name('store.expeditions');
        Route::get('/store/expeditions/{expedition}', [ExpeditionController::class, 'show'])->name('store.expeditions.show');
        Route::post('/store/expeditions', [ExpeditionController::class, 'store'])->name('store.expeditions.store');
        Route::put('/store/expeditions/{expedition}/status', [ExpeditionController::class, 'updateStatus'])->name('store.expeditions.status');

        // Sales (CRUD)
        Route::get('/store/sales', [SaleController::class, 'index'])->name('store.sales');
        Route::post('/store/sales', [SaleController::class, 'store'])->name('store.sales.store');

        // Non-conformités (CRUD)
        Route::get('/store/nonconformites', [NonConformiteController::class, 'index'])->name('store.nonconformites');
        Route::post('/store/nonconformites', [NonConformiteController::class, 'store'])->name('store.nonconformites.store');
        Route::put('/store/nonconformites/{nc}', [NonConformiteController::class, 'update'])->name('store.nonconformites.update');
    });
});

// ============================================
// SUPER ADMIN (guard "super_admin", indépendant des tables users/store_users)
// ============================================

Route::middleware('auth:super_admin')->group(function () {
    Route::post('/super-admin/logout', [SuperAdminAuthController::class, 'destroy'])->name('superadmin.logout');

    // Gestion des boutiques (validation des inscriptions, suspension/réactivation)
    Route::prefix('super-admin/stores')->name('superadmin.stores.')->group(function () {
        Route::get('/', [StoreManagementController::class, 'index'])->name('index');
        Route::post('/{store}/approve', [StoreManagementController::class, 'approve'])->name('approve');
        Route::post('/{store}/reject', [StoreManagementController::class, 'reject'])->name('reject');
        Route::post('/{store}/suspend', [StoreManagementController::class, 'suspend'])->name('suspend');
        Route::post('/{store}/reactivate', [StoreManagementController::class, 'reactivate'])->name('reactivate');
    });
});
