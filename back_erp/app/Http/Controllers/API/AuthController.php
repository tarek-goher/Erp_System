<?php

namespace App\Http\Controllers\API;

use App\Models\User;
use App\Services\AccountService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * AuthController
 * المسارات: /api/auth/*
 *
 * Fix #4:
 *  - register(): كان بيعمل User بدون is_active=true، فالمستخدم الجديد
 *    كان بيتحجب فوراً عند login بـ "Your account is deactivated".
 *  - register(): المستخدم بيتسجل بدون company_id.
 *  - login(): مكانش بيحدّث last_login_at بعد الـ login الناجح.
 */
class AuthController extends BaseController
{
    // AppServiceProvider بيحقن AccountService
    public function __construct(private AccountService $accountService) {}

    /** POST /api/auth/register */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'       => 'required|string|max:100',
            'email'      => 'required|email|unique:users',
            'password'   => 'required|min:8|confirmed',
            'phone'      => 'nullable|string|max:20',
            'company_id' => 'nullable|integer|exists:companies,id',
        ]);

        // Fix #4a: إضافة is_active=true صراحةً عشان المستخدم الجديد
        //          ميتحجبش فوراً عند أول login.
        $user = User::create([
            'name'       => $data['name'],
            'email'      => $data['email'],
            'password'   => Hash::make($data['password']),
            'phone'      => $data['phone'] ?? null,
            // Fix #4b: تسجيل company_id لو موجود في الـ request
            'company_id' => $data['company_id'] ?? null,
            // Fix #4a: تأكيد تفعيل الحساب
            'is_active'  => true,
        ]);

        $token = $user->createToken('api-token')->plainTextToken;

        return $this->created([
            'user'  => $user,
            'token' => $token,
        ], 'Registration successful');
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

        // Fix #4c: تحديث last_login_at عند كل login ناجح
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
