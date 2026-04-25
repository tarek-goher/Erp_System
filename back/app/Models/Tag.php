<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

/**
 * Tag — الوسوم (Tags)
 *
 * ضعه في: app/Models/Tag.php
 */
class Tag extends Model
{
    use BelongsToCompany;

    protected $fillable = ['company_id', 'name', 'color'];

    public function tickets()
    {
        return $this->belongsToMany(Ticket::class, 'ticket_tags');
    }
}
