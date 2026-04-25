<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Custom Dashboards
        Schema::create('bi_dashboards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->string('name');
            $table->string('slug')->unique();
            $table->longText('description')->nullable();
            $table->enum('visibility', ['private', 'team', 'company', 'public'])->default('company');
            $table->json('layout_config')->nullable(); // grid layout
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('refresh_interval')->default(300); // seconds
            $table->timestamps();
        });

        // Dashboard Widgets
        Schema::create('bi_widgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->foreignId('dashboard_id')->constrained('bi_dashboards')->onDelete('cascade');
            $table->string('name');
            $table->enum('widget_type', ['kpi', 'chart', 'table', 'gauge', 'heatmap', 'pivot'])->index();
            $table->json('data_source'); // query config
            $table->json('filters')->nullable();
            $table->json('display_config')->nullable(); // colors, labels, etc
            $table->integer('position_x')->default(0);
            $table->integer('position_y')->default(0);
            $table->integer('width')->default(4);
            $table->integer('height')->default(3);
            $table->boolean('is_editable')->default(true);
            $table->timestamps();
        });

        // KPI Metrics
        Schema::create('bi_kpi_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->string('metric_name')->index();
            $table->string('metric_key')->unique();
            $table->enum('data_type', ['numeric', 'percentage', 'currency', 'text']);
            $table->string('calculation_method'); // sum, average, count, custom
            $table->text('custom_query')->nullable();
            $table->json('target_values')->nullable(); // min, max, target
            $table->enum('frequency', ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'])->default('daily');
            $table->timestamps();
        });

        // KPI Data Points
        Schema::create('bi_kpi_data', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->foreignId('kpi_metric_id')->constrained('bi_kpi_metrics')->onDelete('cascade');
            $table->date('date')->index();
            $table->decimal('value', 20, 2);
            $table->decimal('target_value', 20, 2)->nullable();
            $table->decimal('previous_value', 20, 2)->nullable();
            $table->decimal('variance_percentage', 5, 2)->nullable();
            $table->enum('status', ['on_track', 'at_risk', 'off_track'])->nullable();
            $table->timestamps();
            $table->unique(['company_id', 'kpi_metric_id', 'date']);
        });

        // Custom Reports
        Schema::create('bi_custom_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->string('report_name');
            $table->string('slug')->unique();
            $table->longText('description')->nullable();
            $table->enum('report_type', ['sales', 'inventory', 'financial', 'hr', 'custom']);
            $table->json('columns')->nullable();
            $table->json('filters')->nullable();
            $table->enum('sort_by', ['asc', 'desc'])->default('desc');
            $table->enum('export_formats', ['pdf', 'excel', 'csv', 'json'])->nullable();
            $table->boolean('schedule_enabled')->default(false);
            $table->string('schedule_frequency')->nullable(); // daily, weekly, monthly
            $table->json('recipients')->nullable(); // email recipients
            $table->timestamps();
        });

        // Report Execution History
        Schema::create('bi_report_executions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->foreignId('report_id')->constrained('bi_custom_reports')->onDelete('cascade');
            $table->dateTime('executed_at');
            $table->integer('total_rows')->default(0);
            $table->string('file_path')->nullable();
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            $table->text('error_message')->nullable();
            $table->integer('execution_time_ms')->nullable();
            $table->timestamps();
        });

        // Data Drill-Down Config
        Schema::create('bi_drill_down_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->foreignId('widget_id')->constrained('bi_widgets')->onDelete('cascade');
            $table->string('drill_field');
            $table->string('target_dashboard_id')->nullable();
            $table->json('drill_parameters')->nullable();
            $table->timestamps();
        });

        // Analytics Event Tracking
        Schema::create('bi_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->string('event_type')->index(); // page_view, button_click, form_submit, etc
            $table->string('entity_type')->nullable(); // Sale, Purchase, Ticket, etc
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->string('user_agent')->nullable();
            $table->string('ip_address')->nullable();
            $table->json('metadata')->nullable();
            $table->dateTime('occurred_at')->index();
            $table->timestamps();
        });

        // Predictive Analytics Models
        Schema::create('bi_predictive_models', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->string('model_name');
            $table->enum('model_type', ['sales_forecast', 'churn_prediction', 'demand_forecast', 'anomaly_detection']);
            $table->json('training_data')->nullable();
            $table->decimal('accuracy_score', 5, 2)->nullable();
            $table->dateTime('trained_at')->nullable();
            $table->dateTime('next_training_at')->nullable();
            $table->boolean('is_active')->default(false);
            $table->timestamps();
        });

        // Predictive Results
        Schema::create('bi_predictions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->foreignId('model_id')->constrained('bi_predictive_models')->onDelete('cascade');
            $table->date('prediction_date');
            $table->decimal('predicted_value', 20, 2);
            $table->decimal('confidence_score', 5, 2);
            $table->decimal('actual_value', 20, 2)->nullable();
            $table->timestamps();
        });

        // Real-time Data Sync Queue
        Schema::create('bi_data_sync_queue', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->string('data_source'); // sales, inventory, etc
            $table->enum('status', ['pending', 'syncing', 'completed', 'failed'])->default('pending');
            $table->dateTime('last_synced_at')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
        });

        // User Preferences
        Schema::create('bi_user_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('default_dashboard_id')->nullable()->constrained('bi_dashboards')->onDelete('set null');
            $table->json('preferred_metrics')->nullable();
            $table->json('saved_filters')->nullable();
            $table->boolean('enable_auto_refresh')->default(true);
            $table->boolean('enable_notifications')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bi_user_preferences');
        Schema::dropIfExists('bi_data_sync_queue');
        Schema::dropIfExists('bi_predictions');
        Schema::dropIfExists('bi_predictive_models');
        Schema::dropIfExists('bi_events');
        Schema::dropIfExists('bi_drill_down_configs');
        Schema::dropIfExists('bi_report_executions');
        Schema::dropIfExists('bi_custom_reports');
        Schema::dropIfExists('bi_kpi_data');
        Schema::dropIfExists('bi_kpi_metrics');
        Schema::dropIfExists('bi_widgets');
        Schema::dropIfExists('bi_dashboards');
    }
};
