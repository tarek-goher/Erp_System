<?php

namespace App\Http\Controllers\API;

use App\Models\User;
use App\Models\Company;
use App\Services\AccountService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

/**
 * AuthController
 * المسارات: /api/auth/*
 */
class AuthController extends BaseController
{
    public function __construct(private AccountService $accountService) {}

    /** POST /api/auth/register */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'         => 'required|string|max:100',
            'email'        => 'required|email|unique:users',
            'password'     => 'required|min:8|confirmed',
            'phone'        => 'nullable|string|max:20',
            'company_name' => 'nullable|string|max:200',
            'plan'         => 'nullable|string|in:starter,professional,enterprise',
            'country'      => 'nullable|string',
            'company_id'   => 'nullable|integer|exists:companies,id',
        ]);

        try {
            return DB::transaction(function () use ($data) {
                $companyId = $data['company_id'] ?? null;

                if (!empty($data['company_name'])) {
                    $company = Company::create([
                        'name'              => $data['company_name'],
                        'email'             => $data['email'],
                        'phone'             => $data['phone'] ?? null,
                        'subscription_plan' => $data['plan'] ?? 'starter',
                        'country'           => $data['country'] ?? 'Egypt',
                        'status'            => 'active',
                    ]);
                    $companyId = $company->id;

                    $this->accountService->seedDefaultsForCompany($companyId);
                }

                $user = User::create([
                    'name'       => $data['name'],
                    'email'      => $data['email'],
                    'password'   => Hash::make($data['password']),
                    'phone'      => $data['phone'] ?? null,
                    'company_id' => $companyId,
                    'is_active'  => true,
                ]);

                if (!empty($data['company_name'])) {
                    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
                    $user->assignRole($adminRole);
                }

                $token = $user->createToken('api-token')->plainTextToken;

                return $this->created([
                    'user'    => $user->load('roles:id,name'),
                    'company' => $user->company,
                    'token'   => $token,
                ], 'Registration successful');
            });
        } catch (\Exception $e) {
            Log::error('Registration Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'data'  => $request->all(),
            ]);
            return $this->error('حدث خطأ أثناء التسجيل: ' . $e->getMessage(), 500);
        }
    }

    /** POST /api/auth/login */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::with('company')
            ->where('email', $request->email)
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        if (!$user->is_active) {
            return $this->error('Your account is deactivated.', 403);
        }

        if ($user->company && $user->company->status === 'suspended') {
            return $this->error('Your company account is suspended.', 403);
        }

        $user->update(['last_login_at' => now()]);

        $token = $user->createToken('api-token')->plainTextToken;

        return $this->success([
            'user'  => $user->load('roles:id,name'),
            'token' => $token,
        ], 'Login successful');
    }

    /** POST /api/auth/logout */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return $this->success(null, 'Logged out successfully');
    }

    /** GET /api/auth/me */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('company', 'roles:id,name', 'roles.permissions:id,name');
        return $this->success($user);
    }

    /** PUT /api/auth/me */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'name'  => 'sometimes|string|max:100',
            'phone' => 'nullable|string|max:20',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
        ]);
        $user->update($data);
        return $this->success($user, 'Profile updated');
    }

    /** POST /api/auth/change-password */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required',
            'password'         => 'required|min:8|confirmed',
        ]);

        $user = $request->user();
        if (!Hash::check($request->current_password, $user->password)) {
            return $this->error('Current password is incorrect', 422);
        }

        $user->update(['password' => Hash::make($request->password)]);
        $user->tokens()->delete();
        $token = $user->createToken('api-token')->plainTextToken;

        return $this->success(['token' => $token], 'Password changed successfully');
    }
}