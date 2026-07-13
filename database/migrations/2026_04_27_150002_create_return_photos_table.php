<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('return_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('return_id')->constrained('product_returns')->onDelete('cascade');
            $table->foreignId('return_line_id')->nullable()->constrained('return_lines')->onDelete('cascade')->comment('Null = photo globale du retour');
            $table->string('photo_path', 255)->comment('Chemin: storage/app/public/return_photos/...');
            $table->foreignId('uploaded_by')->constrained('users');
            $table->timestamps();

            // Index
            $table->index('return_id');
            $table->index('return_line_id');
            $table->index('uploaded_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('return_photos');
    }
};
