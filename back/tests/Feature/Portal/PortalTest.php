<?php

namespace Tests\Feature\Portal;

use App\Models\Portal\PortalUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PortalTest extends TestCase
{
    use RefreshDatabase;

    public function test_portal_user_can_register(): void
    {
        $response = $this->postJson('/api/portal/auth/register', [
            'first_name'            => 'Ahmed',
            'last_name'             => 'Hassan',
            'email'                 => 'ahmed@test.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
            'company_id'            => 1,
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['data' => ['user', 'token']]);

        $this->assertDatabaseHas('portal_users', ['email' => 'ahmed@test.com']);
    }

    public function test_portal_user_can_login(): void
    {
        $user = PortalUser::factory()->create([
            'email'      => 'login@test.com',
            'password'   => bcrypt('password123'),
            'status'     => 'active',
            'company_id' => 1,
        ]);

        $response = $this->postJson('/api/portal/auth/login', [
            'email'    => 'login@test.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['data' => ['user', 'token']]);
    }

    public function test_inactive_user_cannot_login(): void
    {
        $user = PortalUser::factory()->create([
            'email'    => 'inactive@test.com',
            'password' => bcrypt('password123'),
            'status'   => 'inactive',
        ]);

        $response = $this->postJson('/api/portal/auth/login', [
            'email'    => 'inactive@test.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)->assertJson(['success' => false]);
    }

    public function test_portal_user_can_create_ticket(): void
    {
        $user = PortalUser::factory()->create(['company_id' => 1, 'status' => 'active']);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/portal/tickets', [
                'subject'     => 'My order is delayed',
                'description' => 'I ordered 3 days ago and nothing arrived.',
                'priority'    => 'high',
            ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['data' => ['id', 'subject', 'status']]);
    }
}
