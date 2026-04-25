<?php

namespace App\Observers;

use App\Models\Project;
use App\Services\IntegrationService;

class ProjectObserver
{
    protected $integrationService;

    public function __construct(IntegrationService $integrationService)
    {
        $this->integrationService = $integrationService;
    }

    public function updated(Project $project)
    {
        if ($project->isDirty('status') && $project->status === 'completed') {
            $this->integrationService->generateProjectInvoice($project);
        }
    }
}
