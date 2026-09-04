<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('name');
        });

        // Générer les slugs basés sur le nom du store
        \App\Models\Store::all()->each(function ($store) {
            $store->update([
                'slug' => \Illuminate\Support\Str::slug($store->name) . '-store',
            ]);
        });

        // Ajouter la contrainte unique
        Schema::table('stores', function (Blueprint $table) {
            $table->unique('slug');
        });
    }

    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->dropColumn('slug');
        });
    }
};
