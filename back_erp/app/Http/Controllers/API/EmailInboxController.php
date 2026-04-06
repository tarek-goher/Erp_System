<?php
namespace App\Http\Controllers\API;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class EmailInboxController extends BaseController
{
    public function inbox(): JsonResponse
    {
        // TODO: Connect to IMAP using IMAP_* env vars
        return $this->success(['messages'=>[],'message'=>'Configure IMAP settings to enable email inbox']);
    }
    public function show(string $uid): JsonResponse { return $this->success(null); }
    public function folders(): JsonResponse { return $this->success(['folders'=>['INBOX','Sent','Drafts','Trash']]); }
}
