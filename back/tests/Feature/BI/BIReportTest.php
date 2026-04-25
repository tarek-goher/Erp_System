<?php

namespace Tests\Feature\BI;

use App\Jobs\GenerateReportJob;
use App\Models\BI\BICustomReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class BIReportTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create(['company_id' => 1]);
    }

    public function test_can_create_report(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/bi/reports', [
                'report_name' => 'Monthly Sales',
                'report_type' => 'sales',
                'columns'     => ['sale_number', 'customer_name', 'total_amount'],
                'filters'     => ['date_from' => '2026-01-01', 'date_to' => '2026-01-31'],
            ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['data' => ['id', 'report_name', 'report_type', 'slug']]);
    }

    public function test_execute_report_dispatches_job(): void
    {
        Queue::fake();

        $report = BICustomReport::factory()->create([
            'company_id'  => $this->user->company_id,
            'report_type' => 'sales',
            'columns'     => ['sale_number', 'total_amount'],
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/bi/reports/{$report->id}/execute");

        $response->assertStatus(200)
                 ->assertJsonStructure(['data' => ['execution_id', 'status', 'poll_url']]);

        Queue::assertPushed(GenerateReportJob::class);
    }

    public function test_get_kpi_metrics(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/bi/kpi-metrics');

        $response->assertStatus(200)
                 ->assertJsonStructure(['data']);
    }

    public function test_cannot_access_other_company_report(): void
    {
        $otherReport = BICustomReport::factory()->create(['company_id' => 999]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/bi/reports/{$otherReport->id}/execute");

        $response->assertStatus(200)->assertJson(['success' => false]);
    }
}
