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
        Schema::table('appraisals', function (Blueprint $table) {
            // إذا كانت الأعمدة موجودة، ما تضيفها
            if (!Schema::hasColumn('appraisals', 'template_id')) {
                $table->foreignId('template_id')->nullable()->constrained('appraisal_templates')->cascadeOnDelete();
            }
            if (!Schema::hasColumn('appraisals', 'criteria_scores')) {
                $table->json('criteria_scores')->nullable();
            }
            if (!Schema::hasColumn('appraisals', 'linked_promotion')) {
                $table->boolean('linked_promotion')->default(false);
            }
            if (!Schema::hasColumn('appraisals', 'linked_raise')) {
                $table->decimal('linked_raise', 5, 2)->nullable();
            }
            if (!Schema::hasColumn('appraisals', 'approval_chain')) {
                $table->json('approval_chain')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appraisals', function (Blueprint $table) {
            $table->dropForeignIdFor('appraisal_templates', 'template_id');
            $table->dropColumn([
                'template_id',
                'criteria_scores',
                'linked_promotion',
                'linked_raise',
                'approval_chain'
            ]);
        });
    }
};