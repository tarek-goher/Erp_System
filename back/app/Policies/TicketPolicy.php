<?php

namespace App\Policies;

use App\Models\Ticket;
use App\Models\User;

class TicketPolicy
{
    public function view(User $user, Ticket $ticket): bool
    {
        // الموظف يشوف تذكرته، والـ agent/admin يشوف تذاكر شركته
        return $user->company_id === $ticket->company_id
            || $ticket->requester_id === $user->id;
    }

    public function update(User $user, Ticket $ticket): bool
    {
        return $user->company_id === $ticket->company_id
            && ($user->hasRole('admin')
                || $user->hasRole('manager')
                || $user->hasRole('super-admin')
                || $user->hasPermissionTo('manage-helpdesk')
                || $ticket->assigned_to === $user->id);
    }

    public function delete(User $user, Ticket $ticket): bool
    {
        return $user->company_id === $ticket->company_id
            && $user->hasRole('admin');
    }
}
