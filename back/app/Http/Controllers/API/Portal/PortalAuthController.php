<?php

namespace App\Http\Controllers\API\Portal;

use App\Http\Controllers\API\BaseController;
use App\Models\Portal\PortalUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class PortalAuthController extends BaseController
{
    /**
     * Register new customer portal user
     */
    public function register(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email|unique:portal_users',
                'password' => 'required|min:8|confirmed',
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'phone' => 'nullable|string|max:20',
                'company_id' => 'required|integer'
            ]);

            $user = PortalUser::create([
                'company_id' => $validated['company_id'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'phone' => $validated['phone'] ?? null,
                'status' => 'active',
                'email_verified_at' => now()
            ]);

            $token = $user->createToken('portal_token')->plainTextToken;

            return $this->sendResponse([
                'user' => $user,
                'token' => $token
            ], 'User registered successfully', 201);
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    /**
     * Login portal user
     */
    public function login(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email',
                'password' => 'required'
            ]);

            $user = PortalUser::where('email', $validated['email'])->first();

            if (!$user || !Hash::check($validated['password'], $user->password)) {
                return $this->sendError('Invalid credentials', [], 401);
            }

            if ($user->status !== 'active') {
                return $this->sendError('Account is not active', [], 403);
            }

            $user->update(['last_login_at' => now()]);
            $token = $user->createToken('portal_token')->plainTextToken;

            return $this->sendResponse([
                'user' => $user->only('id', 'email', 'first_name', 'last_name', 'avatar_url'),
                'token' => $token
            ], 'Login successful');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    /**
     * Logout portal user
     */
    public function logout(Request $request): JsonResponse
    {
        try {
            $request->user()->currentAccessToken()->delete();
            return $this->sendResponse([], 'Logged out successfully');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    /**
     * Get current user profile
     */
    public function getCurrentUser(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            return $this->sendResponse($user, 'User retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    /**
     * Update profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'first_name' => 'nullable|string|max:255',
                'last_name' => 'nullable|string|max:255',
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string',
                'city' => 'nullable|string',
                'state' => 'nullable|string',
                'postal_code' => 'nullable|string',
                'country' => 'nullable|string'
            ]);

            $request->user()->update($validated);

            return $this->sendResponse($request->user(), 'Profile updated successfully');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }
}
