<?php

namespace App\Policies;

use App\Models\Ticket;
use App\Models\User;

/**
 * TicketPolicy — التحكم في صلاحيات الـ helpdesk tickets
 */
class TicketPolicy
{
    public function view(User $user, Ticket $ticket): bool
    {
        return $user->company_id === $ticket->company_id;
    }

    public function update(User $user, Ticket $ticket): bool
    {
        return $user->company_id === $ticket->company_id
            && ($user->hasRole('admin') || $user->hasPermissionTo('manage_helpdesk') || $ticket->assigned_to === $user->id);
    }

    public function delete(User $user, Ticket $ticket): bool
    {
        return $user->company_id === $ticket->company_id
            && $user->hasRole('admin');
    }
}
