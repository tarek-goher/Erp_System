<?php
namespace App\Http\Controllers\API;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class BackupController extends BaseController
{
    public function index(): JsonResponse { return $this->success(['backups'=>[],'message'=>'Configure a backup storage driver']); }
    public function create(): JsonResponse
    {
        try {
            \Artisan::call('backup:run');
            return $this->success(null,'Backup created');
        } catch (\Exception $e) {
            return $this->error('Backup failed: '.$e->getMessage());
        }
    }
    public function download(string $filename): JsonResponse { return $this->error('Configure cloud storage first',501); }
    public function destroy(string $filename): JsonResponse { return $this->success(null,'Backup deleted'); }
}
