<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class KnowledgeArticle extends Model {
    protected $fillable = ['company_id','title','content','category','is_published','views'];
    protected $casts = ['is_published'=>'boolean','views'=>'integer'];
}
