<?php

namespace App\Http\Controllers;

/**
 * @OA\Info(
 *     title="ERP System API",
 *     version="1.0.0",
 *     description="
 * ## نظام ERP متكامل — Multi-Tenant SaaS
 *
 * ### المصادقة
 * كل الـ endpoints (عدا Login و Register) محتاجة **Bearer Token**.
 * 1. ابعت POST /api/auth/login
 * 2. خد الـ `token` من الـ response
 * 3. حطه في كل request: `Authorization: Bearer {token}`
 *
 * ### Multi-Tenancy
 * كل بيانات كل شركة معزولة تماماً.
 * الـ token بيحدد تلقائياً الشركة اللي بيتعامل معها.
 *
 * ### Rate Limiting
 * - Login: 10 requests/minute
 * - Authenticated routes: 60 requests/minute
 * - Super Admin: 120 requests/minute
 * ",
 *     @OA\Contact(email="support@erp-system.com"),
 *     @OA\License(name="MIT")
 * )
 *
 * @OA\Server(
 *     url=L5_SWAGGER_CONST_HOST,
 *     description="API Server"
 * )
 *
 * @OA\SecurityScheme(
 *     securityScheme="bearerAuth",
 *     type="http",
 *     scheme="bearer",
 *     bearerFormat="Sanctum Token",
 *     description="أدخل الـ token اللي اتبعتلك من /api/auth/login"
 * )
 *
 * @OA\Tag(name="Auth", description="تسجيل الدخول والتسجيل")
 * @OA\Tag(name="Sales", description="الفواتير والمبيعات")
 * @OA\Tag(name="Products", description="المنتجات والمخزون")
 * @OA\Tag(name="Customers", description="العملاء")
 * @OA\Tag(name="Suppliers", description="الموردين")
 * @OA\Tag(name="Purchases", description="أوامر الشراء")
 * @OA\Tag(name="HR", description="الموارد البشرية")
 * @OA\Tag(name="Accounting", description="المحاسبة وشجرة الحسابات")
 * @OA\Tag(name="Reports", description="التقارير المالية")
 * @OA\Tag(name="CRM", description="إدارة علاقات العملاء")
 * @OA\Tag(name="Projects", description="إدارة المشاريع")
 * @OA\Tag(name="Helpdesk", description="الدعم الفني والتذاكر")
 * @OA\Tag(name="Notifications", description="الإشعارات")
 * @OA\Tag(name="Settings", description="إعدادات الشركة")
 * @OA\Tag(name="Super Admin", description="إدارة النظام — للـ Super Admin فقط")
 */
abstract class Controller
{
    //
}
