-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 08, 2026 at 01:46 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `codesphere_erp`
--

-- --------------------------------------------------------

--
-- Table structure for table `accounts`
--

CREATE TABLE `accounts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `code` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `name_en` varchar(255) DEFAULT NULL,
  `type` enum('asset','liability','equity','revenue','expense') NOT NULL,
  `account_type` varchar(255) DEFAULT NULL,
  `tax_type` varchar(255) DEFAULT NULL,
  `normal_balance` enum('debit','credit') NOT NULL,
  `balance` decimal(14,2) NOT NULL DEFAULT 0.00,
  `parent_id` bigint(20) UNSIGNED DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `accounts`
--

INSERT INTO `accounts` (`id`, `company_id`, `code`, `name`, `name_en`, `type`, `account_type`, `tax_type`, `normal_balance`, `balance`, `parent_id`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, '1100', 'نقد بالصندوق', 'Cash in Hand', 'asset', 'cash', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:12', '2026-04-27 18:53:12'),
(2, 1, '1102', 'البنك', 'Bank Account', 'asset', 'bank', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:12', '2026-04-27 18:53:12'),
(3, 1, '1103', 'المدينون', 'Accounts Receivable', 'asset', 'receivable', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:12', '2026-04-27 18:53:12'),
(4, 1, '1200', 'المخزون', 'Inventory', 'asset', 'inventory', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:12', '2026-04-27 18:53:12'),
(5, 1, '1300', 'الأراضي والعقارات', 'Land & Buildings', 'asset', 'fixed_asset', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:12', '2026-04-27 18:53:12'),
(6, 1, '1310', 'الآلات والمعدات', 'Machinery & Equipment', 'asset', 'fixed_asset', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:12', '2026-04-27 18:53:12'),
(7, 1, '1320', 'السيارات', 'Vehicles', 'asset', 'fixed_asset', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:12', '2026-04-27 18:53:12'),
(8, 1, '1400', 'الإهلاك المتراكم - الأراضي', 'Accumulated Depreciation - Buildings', 'asset', 'accumulated_depreciation', NULL, 'credit', 0.00, NULL, 1, '2026-04-27 18:53:12', '2026-04-27 18:53:12'),
(9, 1, '1410', 'الإهلاك المتراكم - الآلات', 'Accumulated Depreciation - Machinery', 'asset', 'accumulated_depreciation', NULL, 'credit', 0.00, NULL, 1, '2026-04-27 18:53:12', '2026-04-27 18:53:12'),
(10, 1, '2100', 'الدائنون', 'Accounts Payable', 'liability', 'payable', NULL, 'credit', 0.00, NULL, 1, '2026-04-27 18:53:12', '2026-04-27 18:53:12'),
(11, 1, '2200', 'أوراق الدفع', 'Notes Payable', 'liability', 'payable', NULL, 'credit', 0.00, NULL, 1, '2026-04-27 18:53:12', '2026-04-27 18:53:12'),
(12, 1, '2300', 'ضرائب مستحقة', 'Taxes Payable', 'liability', 'tax_payable', NULL, 'credit', 0.00, NULL, 1, '2026-04-27 18:53:12', '2026-04-27 18:53:12'),
(13, 1, '2400', 'مستحقات الموظفين', 'Wages Payable', 'liability', 'payroll_payable', NULL, 'credit', 0.00, NULL, 1, '2026-04-27 18:53:12', '2026-04-27 18:53:12'),
(14, 1, '3100', 'رأس المال', 'Capital', 'equity', 'capital', NULL, 'credit', 0.00, NULL, 1, '2026-04-27 18:53:12', '2026-04-27 18:53:12'),
(15, 1, '3200', 'الأرباح المحتجزة', 'Retained Earnings', 'equity', 'retained_earnings', NULL, 'credit', 0.00, NULL, 1, '2026-04-27 18:53:12', '2026-04-27 18:53:12'),
(16, 1, '4001', 'إيرادات المبيعات', 'Sales Revenue', 'revenue', 'revenue', NULL, 'credit', 0.00, NULL, 1, '2026-04-27 18:53:12', '2026-04-27 18:53:12'),
(17, 1, '4100', 'خصومات المبيعات', 'Sales Discounts', 'revenue', 'revenue_contra', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:12', '2026-04-27 18:53:12'),
(18, 1, '4200', 'إيرادات أخرى', 'Other Income', 'revenue', 'revenue', NULL, 'credit', 0.00, NULL, 1, '2026-04-27 18:53:12', '2026-04-27 18:53:12'),
(19, 1, '5001', 'تكلفة البضاعة المباعة', 'Cost of Goods Sold', 'expense', 'cogs', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:12', '2026-04-27 18:53:12'),
(20, 1, '5003', 'مصاريف الرواتب', 'Salaries Expense', 'expense', 'expense_salary', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:12', '2026-04-27 18:53:12'),
(21, 1, '5004', 'مصاريف الكهرباء والماء', 'Utilities Expense', 'expense', 'expense', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:12', '2026-04-27 18:53:12'),
(22, 1, '5005', 'مصاريف الإهلاك', 'Depreciation Expense', 'expense', 'expense', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:12', '2026-04-27 18:53:12'),
(23, 1, '5010', 'مصاريف النقل والتوزيع', 'Transportation Expense', 'expense', 'expense', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:12', '2026-04-27 18:53:12'),
(24, 1, '5020', 'مصاريف الإعلان والتسويق', 'Advertising Expense', 'expense', 'expense', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:12', '2026-04-27 18:53:12'),
(25, 1, '5030', 'مصاريف إدارية', 'Administrative Expenses', 'expense', 'expense', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:12', '2026-04-27 18:53:12'),
(26, 1, '1104', 'أوراق القبض', 'Notes Receivable', 'asset', 'receivable', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:12', '2026-04-27 18:53:12'),
(27, 1, '1105', 'الضرائب المدفوعة مقدماً', 'Prepaid Taxes', 'asset', 'prepaid', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:12', '2026-04-27 18:53:12'),
(28, 1, '1106', 'المصاريف المدفوعة مقدماً', 'Prepaid Expenses', 'asset', 'prepaid', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:12', '2026-04-27 18:53:12'),
(29, 1, '1150', 'السلف المدفوعة للموظفين', 'Employee Advances', 'asset', 'receivable', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:12', '2026-04-27 18:53:12'),
(30, 1, '1210', 'المخزون - مواد نصف مصنعة', 'Work in Progress', 'asset', 'inventory', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:12', '2026-04-27 18:53:12'),
(31, 1, '1220', 'المخزون - منتجات تامة', 'Finished Goods', 'asset', 'inventory', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(32, 1, '1420', 'الإهلاك المتراكم - السيارات', 'Accumulated Depreciation - Vehicles', 'asset', 'accumulated_depreciation', NULL, 'credit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(33, 1, '1430', 'مخصص الديون المشكوك فيها', 'Allowance for Doubtful Accounts', 'asset', 'contra_asset', NULL, 'credit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(34, 1, '2101', 'الدائنون - موردون', 'Accounts Payable - Suppliers', 'liability', 'payable', NULL, 'credit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(35, 1, '2102', 'الدائنون - آخرون', 'Accounts Payable - Others', 'liability', 'payable', NULL, 'credit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(36, 1, '2201', 'أوراق الدفع - قصيرة الأجل', 'Notes Payable - Short Term', 'liability', 'payable', NULL, 'credit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(37, 1, '2202', 'أوراق الدفع - طويلة الأجل', 'Notes Payable - Long Term', 'liability', 'payable', NULL, 'credit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(38, 1, '2301', 'ضرائب الدخل المستحقة', 'Income Tax Payable', 'liability', 'tax_payable', NULL, 'credit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(39, 1, '2302', 'ضرائب المبيعات المستحقة', 'Sales Tax Payable', 'liability', 'tax_payable', NULL, 'credit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(40, 1, '2310', 'اشتراكات الضمان الاجتماعي', 'Social Insurance Payable', 'liability', 'payroll_payable', NULL, 'credit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(41, 1, '2401', 'راتب الموظفين المستحق', 'Accrued Salaries', 'liability', 'payroll_payable', NULL, 'credit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(42, 1, '2402', 'مكافآت الموظفين المستحقة', 'Accrued Bonuses', 'liability', 'payroll_payable', NULL, 'credit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(43, 1, '2500', 'الإيجار المستحق', 'Accrued Rent', 'liability', 'accrued_expense', NULL, 'credit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(44, 1, '2501', 'الفوائد المستحقة', 'Accrued Interest', 'liability', 'accrued_expense', NULL, 'credit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(45, 1, '3101', 'رأس المال - المالك الأول', 'Capital - Owner 1', 'equity', 'capital', NULL, 'credit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(46, 1, '3102', 'رأس المال - المالك الثاني', 'Capital - Owner 2', 'equity', 'capital', NULL, 'credit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(47, 1, '3201', 'الأرباح الموزعة', 'Dividends', 'equity', 'dividend', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(48, 1, '3300', 'الاحتياطي النظامي', 'Statutory Reserve', 'equity', 'reserve', NULL, 'credit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(49, 1, '4002', 'إيرادات المبيعات - محلي', 'Domestic Sales', 'revenue', 'revenue', NULL, 'credit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(50, 1, '4003', 'إيرادات المبيعات - تصدير', 'Export Sales', 'revenue', 'revenue', NULL, 'credit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(51, 1, '4010', 'إيرادات الخدمات', 'Service Revenue', 'revenue', 'revenue', NULL, 'credit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(52, 1, '4110', 'خصومات - تجارية', 'Trade Discounts', 'revenue', 'revenue_contra', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(53, 1, '4120', 'خصومات - نقدية', 'Cash Discounts', 'revenue', 'revenue_contra', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(54, 1, '4210', 'إيرادات الفوائد', 'Interest Income', 'revenue', 'revenue', NULL, 'credit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(55, 1, '4220', 'إيرادات الإيجار', 'Rent Income', 'revenue', 'revenue', NULL, 'credit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(56, 1, '4230', 'إيرادات العمولات', 'Commission Income', 'revenue', 'revenue', NULL, 'credit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(57, 1, '4240', 'إيرادات أرباح الأسهم', 'Dividend Income', 'revenue', 'revenue', NULL, 'credit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(58, 1, '5002', 'تكلفة المواد المستهلكة', 'Raw Materials Consumed', 'expense', 'cogs', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(59, 1, '5006', 'مصاريف الشحن والنقل', 'Shipping Expenses', 'expense', 'expense', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(60, 1, '5007', 'مصاريف التأمين', 'Insurance Expense', 'expense', 'expense', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(61, 1, '5008', 'مصاريف الصيانة والإصلاح', 'Maintenance Expense', 'expense', 'expense', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(62, 1, '5011', 'مصاريف الاتصالات', 'Telephone Expense', 'expense', 'expense', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(63, 1, '5012', 'مصاريف المكتب والأدوات', 'Office Supplies Expense', 'expense', 'expense', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(64, 1, '5013', 'مصاريف الإيجار', 'Rent Expense', 'expense', 'expense', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(65, 1, '5014', 'مصاريف الفائدة', 'Interest Expense', 'expense', 'expense', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(66, 1, '5015', 'مصاريف الضرائب', 'Tax Expense', 'expense', 'expense', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(67, 1, '5021', 'مصاريف البحث والتطوير', 'Research & Development', 'expense', 'expense', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(68, 1, '5022', 'مصاريف التدريب والتطوير', 'Training Expense', 'expense', 'expense', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(69, 1, '5031', 'مصاريف المراجعة والاستشارات', 'Audit & Consulting', 'expense', 'expense', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(70, 1, '5032', 'مصاريف قانونية', 'Legal Fees', 'expense', 'expense', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(71, 1, '5040', 'خسائر العملات الأجنبية', 'Foreign Exchange Loss', 'expense', 'other_expense', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(72, 1, '5050', 'مصاريف متنوعة', 'Miscellaneous Expense', 'expense', 'expense', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(73, 1, '6100', 'الدخل غير العادي', 'Extraordinary Income', 'revenue', 'revenue', NULL, 'credit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13'),
(74, 1, '6200', 'الخسائر غير العادية', 'Extraordinary Loss', 'expense', 'expense', NULL, 'debit', 0.00, NULL, 1, '2026-04-27 18:53:13', '2026-04-27 18:53:13');

-- --------------------------------------------------------

--
-- Table structure for table `api_keys`
--

CREATE TABLE `api_keys` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `key_hash` varchar(64) NOT NULL,
  `scopes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`scopes`)),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `applicants`
--

CREATE TABLE `applicants` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `employee_id` bigint(20) UNSIGNED DEFAULT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `job_id` bigint(20) UNSIGNED NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `cv_url` varchar(255) DEFAULT NULL,
  `cv_file_name` varchar(255) DEFAULT NULL,
  `cv_file_size` bigint(20) UNSIGNED DEFAULT NULL,
  `cover_letter` longtext DEFAULT NULL,
  `pipeline_stage` enum('Applied','Screening','Interview','Offer','Hired','Rejected') NOT NULL DEFAULT 'Applied',
  `rating` tinyint(3) UNSIGNED DEFAULT NULL,
  `notes` longtext DEFAULT NULL,
  `applied_date` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `applicant_pipeline_history`
--

CREATE TABLE `applicant_pipeline_history` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `applicant_id` bigint(20) UNSIGNED NOT NULL,
  `from_stage` varchar(255) NOT NULL,
  `to_stage` varchar(255) NOT NULL,
  `changed_by` bigint(20) UNSIGNED DEFAULT NULL,
  `changed_at` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `appraisals`
--

CREATE TABLE `appraisals` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `period` varchar(255) DEFAULT NULL,
  `review_date` date DEFAULT NULL,
  `score` decimal(5,2) DEFAULT NULL,
  `status` enum('draft','pending','approved','rejected') NOT NULL DEFAULT 'draft',
  `notes` text DEFAULT NULL,
  `criteria_scores` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`criteria_scores`)),
  `linked_promotion` tinyint(1) NOT NULL DEFAULT 0,
  `linked_raise` decimal(5,2) DEFAULT NULL,
  `approval_chain` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`approval_chain`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `appraisal_360_feedback`
--

CREATE TABLE `appraisal_360_feedback` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `appraisal_id` bigint(20) UNSIGNED NOT NULL,
  `from_employee_id` bigint(20) UNSIGNED NOT NULL,
  `relation` enum('self','peer','manager','subordinate') NOT NULL,
  `scores` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`scores`)),
  `comments` text DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `appraisal_goals`
--

CREATE TABLE `appraisal_goals` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `appraisal_id` bigint(20) UNSIGNED DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `title_ar` varchar(255) DEFAULT NULL,
  `target` decimal(10,2) NOT NULL,
  `current` decimal(10,2) NOT NULL DEFAULT 0.00,
  `unit` varchar(255) DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `status` enum('on_track','at_risk','completed','overdue') NOT NULL DEFAULT 'on_track',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `appraisal_templates`
--

CREATE TABLE `appraisal_templates` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `name_ar` varchar(255) DEFAULT NULL,
  `criteria` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`criteria`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attendances`
--

CREATE TABLE `attendances` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `leave_request_id` bigint(20) UNSIGNED DEFAULT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `date` date NOT NULL,
  `check_in` time DEFAULT NULL,
  `check_out` time DEFAULT NULL,
  `status` enum('present','absent','late','leave') NOT NULL DEFAULT 'present',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `attendances`
--

INSERT INTO `attendances` (`id`, `leave_request_id`, `company_id`, `employee_id`, `date`, `check_in`, `check_out`, `status`, `notes`, `created_at`, `updated_at`) VALUES
(1, NULL, 4, 1, '2026-05-07', '01:06:00', '01:06:00', 'present', NULL, '2026-05-07 19:06:46', '2026-05-07 19:06:49');

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `model_type` varchar(255) DEFAULT NULL,
  `model_id` bigint(20) UNSIGNED DEFAULT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `auto_assignment_rules`
--

CREATE TABLE `auto_assignment_rules` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `condition_type` enum('category','priority','keyword','source') NOT NULL,
  `condition_value` varchar(255) NOT NULL,
  `assign_to_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `assign_to_team` varchar(255) DEFAULT NULL,
  `priority` int(11) NOT NULL DEFAULT 10,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bank_accounts`
--

CREATE TABLE `bank_accounts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `bank_name` varchar(255) NOT NULL,
  `account_number` varchar(255) NOT NULL,
  `branch_code` varchar(255) DEFAULT NULL,
  `account_id` bigint(20) UNSIGNED NOT NULL,
  `currency` varchar(255) NOT NULL DEFAULT 'USD',
  `opening_balance` decimal(15,2) NOT NULL DEFAULT 0.00,
  `status` enum('active','inactive','closed') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bank_reconciliations`
--

CREATE TABLE `bank_reconciliations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `bank_account_id` bigint(20) UNSIGNED NOT NULL,
  `bank_statement_id` bigint(20) UNSIGNED NOT NULL,
  `reconciliation_date` date NOT NULL,
  `statement_balance` decimal(15,2) NOT NULL,
  `calculated_balance` decimal(15,2) NOT NULL,
  `difference` decimal(15,2) NOT NULL DEFAULT 0.00,
  `matched_count` int(11) NOT NULL DEFAULT 0,
  `unmatched_count` int(11) NOT NULL DEFAULT 0,
  `status` enum('draft','completed','posted') NOT NULL DEFAULT 'draft',
  `reconciled_by` bigint(20) UNSIGNED DEFAULT NULL,
  `reconciled_at` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bank_statements`
--

CREATE TABLE `bank_statements` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `account_id` bigint(20) UNSIGNED NOT NULL,
  `transaction_date` date NOT NULL,
  `description` text NOT NULL,
  `debit` decimal(14,2) NOT NULL DEFAULT 0.00,
  `credit` decimal(14,2) NOT NULL DEFAULT 0.00,
  `balance` decimal(14,2) NOT NULL DEFAULT 0.00,
  `reference` varchar(255) DEFAULT NULL,
  `is_reconciled` tinyint(1) NOT NULL DEFAULT 0,
  `journal_entry_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bank_statement_details`
--

CREATE TABLE `bank_statement_details` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `bank_statement_id` bigint(20) UNSIGNED NOT NULL,
  `transaction_date` date NOT NULL,
  `reference` varchar(255) DEFAULT NULL,
  `description` text NOT NULL,
  `debit` decimal(15,2) DEFAULT NULL,
  `credit` decimal(15,2) DEFAULT NULL,
  `balance` decimal(15,2) NOT NULL,
  `matched_transaction_id` bigint(20) UNSIGNED DEFAULT NULL,
  `status` enum('unmatched','matched','pending') NOT NULL DEFAULT 'unmatched',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bi_custom_reports`
--

CREATE TABLE `bi_custom_reports` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `created_by` bigint(20) UNSIGNED NOT NULL,
  `report_name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` longtext DEFAULT NULL,
  `report_type` enum('sales','inventory','financial','hr','custom') NOT NULL,
  `columns` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`columns`)),
  `filters` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`filters`)),
  `sort_by` enum('asc','desc') NOT NULL DEFAULT 'desc',
  `export_formats` enum('pdf','excel','csv','json') DEFAULT NULL,
  `schedule_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `schedule_frequency` varchar(255) DEFAULT NULL,
  `recipients` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`recipients`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bi_dashboards`
--

CREATE TABLE `bi_dashboards` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `created_by` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` longtext DEFAULT NULL,
  `visibility` enum('private','team','company','public') NOT NULL DEFAULT 'company',
  `layout_config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`layout_config`)),
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `refresh_interval` int(11) NOT NULL DEFAULT 300,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bi_data_sync_queue`
--

CREATE TABLE `bi_data_sync_queue` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `data_source` varchar(255) NOT NULL,
  `status` enum('pending','syncing','completed','failed') NOT NULL DEFAULT 'pending',
  `last_synced_at` datetime DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bi_drill_down_configs`
--

CREATE TABLE `bi_drill_down_configs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `widget_id` bigint(20) UNSIGNED NOT NULL,
  `drill_field` varchar(255) NOT NULL,
  `target_dashboard_id` varchar(255) DEFAULT NULL,
  `drill_parameters` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`drill_parameters`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bi_events`
--

CREATE TABLE `bi_events` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `event_type` varchar(255) NOT NULL,
  `entity_type` varchar(255) DEFAULT NULL,
  `entity_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `ip_address` varchar(255) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `occurred_at` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bi_kpi_data`
--

CREATE TABLE `bi_kpi_data` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `kpi_metric_id` bigint(20) UNSIGNED NOT NULL,
  `date` date NOT NULL,
  `value` decimal(20,2) NOT NULL,
  `target_value` decimal(20,2) DEFAULT NULL,
  `previous_value` decimal(20,2) DEFAULT NULL,
  `variance_percentage` decimal(5,2) DEFAULT NULL,
  `status` enum('on_track','at_risk','off_track') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bi_kpi_metrics`
--

CREATE TABLE `bi_kpi_metrics` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `metric_name` varchar(255) NOT NULL,
  `metric_key` varchar(255) NOT NULL,
  `data_type` enum('numeric','percentage','currency','text') NOT NULL,
  `calculation_method` varchar(255) NOT NULL,
  `custom_query` text DEFAULT NULL,
  `target_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`target_values`)),
  `frequency` enum('daily','weekly','monthly','quarterly','yearly') NOT NULL DEFAULT 'daily',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bi_predictions`
--

CREATE TABLE `bi_predictions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `model_id` bigint(20) UNSIGNED NOT NULL,
  `prediction_date` date NOT NULL,
  `predicted_value` decimal(20,2) NOT NULL,
  `confidence_score` decimal(5,2) NOT NULL,
  `actual_value` decimal(20,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bi_predictive_models`
--

CREATE TABLE `bi_predictive_models` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `model_name` varchar(255) NOT NULL,
  `model_type` enum('sales_forecast','churn_prediction','demand_forecast','anomaly_detection') NOT NULL,
  `training_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`training_data`)),
  `accuracy_score` decimal(5,2) DEFAULT NULL,
  `trained_at` datetime DEFAULT NULL,
  `next_training_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bi_report_executions`
--

CREATE TABLE `bi_report_executions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `report_id` bigint(20) UNSIGNED NOT NULL,
  `executed_at` datetime NOT NULL,
  `total_rows` int(11) NOT NULL DEFAULT 0,
  `file_path` varchar(255) DEFAULT NULL,
  `status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
  `error_message` text DEFAULT NULL,
  `execution_time_ms` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bi_user_preferences`
--

CREATE TABLE `bi_user_preferences` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `default_dashboard_id` bigint(20) UNSIGNED DEFAULT NULL,
  `preferred_metrics` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`preferred_metrics`)),
  `saved_filters` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`saved_filters`)),
  `enable_auto_refresh` tinyint(1) NOT NULL DEFAULT 1,
  `enable_notifications` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bi_widgets`
--

CREATE TABLE `bi_widgets` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `dashboard_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `widget_type` enum('kpi','chart','table','gauge','heatmap','pivot') NOT NULL,
  `data_source` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`data_source`)),
  `filters` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`filters`)),
  `display_config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`display_config`)),
  `position_x` int(11) NOT NULL DEFAULT 0,
  `position_y` int(11) NOT NULL DEFAULT 0,
  `width` int(11) NOT NULL DEFAULT 4,
  `height` int(11) NOT NULL DEFAULT 3,
  `is_editable` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bom_items`
--

CREATE TABLE `bom_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `component_id` bigint(20) UNSIGNED NOT NULL,
  `qty` double NOT NULL DEFAULT 1,
  `unit` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `parent_bom_id` bigint(20) UNSIGNED DEFAULT NULL,
  `level` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `branches`
--

CREATE TABLE `branches` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `manager_name` varchar(255) DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'active',
  `employees_count` int(11) NOT NULL DEFAULT 0,
  `monthly_sales` decimal(15,2) NOT NULL DEFAULT 0.00,
  `is_main` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `branches`
--

INSERT INTO `branches` (`id`, `company_id`, `name`, `code`, `address`, `phone`, `email`, `city`, `manager_name`, `status`, `employees_count`, `monthly_sales`, `is_main`, `created_at`, `updated_at`) VALUES
(3, 4, 'الدقي', '12', 'الدقي قاهره', '1010101010', NULL, 'قاهره', 'طارق', 'active', 0, 0.00, 0, '2026-05-07 20:37:49', '2026-05-07 20:37:49');

-- --------------------------------------------------------

--
-- Table structure for table `budgets`
--

CREATE TABLE `budgets` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `account_id` bigint(20) UNSIGNED NOT NULL,
  `month` int(11) NOT NULL,
  `year` int(11) NOT NULL,
  `planned_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `actual_amount` decimal(14,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `campaigns`
--

CREATE TABLE `campaigns` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('email','sms','push') NOT NULL DEFAULT 'email',
  `subject` varchar(255) DEFAULT NULL,
  `body` text NOT NULL,
  `audience` varchar(255) NOT NULL DEFAULT 'all',
  `status` enum('draft','scheduled','sent','cancelled') NOT NULL DEFAULT 'draft',
  `send_at` timestamp NULL DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT NULL,
  `sent_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `open_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `click_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `contact_list_id` bigint(20) UNSIGNED DEFAULT NULL,
  `sms_sender` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `candidates`
--

CREATE TABLE `candidates` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `job_position_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `cv_path` varchar(255) DEFAULT NULL,
  `status` enum('new','screening','interview','offer','hired','rejected') NOT NULL DEFAULT 'new',
  `interview_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `canned_responses`
--

CREATE TABLE `canned_responses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `parent_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `type` varchar(255) NOT NULL DEFAULT 'product',
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `company_id`, `parent_id`, `name`, `type`, `description`, `created_at`, `updated_at`) VALUES
(1, 4, NULL, 'lap top', 'product', NULL, '2026-04-25 18:07:50', '2026-04-25 18:07:50'),
(2, 4, NULL, 'حاسب الي', 'product', 'computer', '2026-05-07 20:10:05', '2026-05-07 20:10:05');

-- --------------------------------------------------------

--
-- Table structure for table `channel_contacts`
--

CREATE TABLE `channel_contacts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `crm_contact_id` bigint(20) UNSIGNED DEFAULT NULL,
  `channel_type` enum('whatsapp','facebook','instagram','telegram','email') NOT NULL,
  `channel_identifier` varchar(255) NOT NULL,
  `display_name` varchar(255) DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `channel_conversations`
--

CREATE TABLE `channel_conversations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `ticket_id` bigint(20) UNSIGNED DEFAULT NULL,
  `external_conversation_id` varchar(255) NOT NULL,
  `contact_phone_or_id` varchar(255) NOT NULL,
  `contact_name` varchar(255) DEFAULT NULL,
  `channels` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`channels`)),
  `status` enum('open','pending','resolved','closed') NOT NULL DEFAULT 'open',
  `assigned_agent_id` bigint(20) UNSIGNED DEFAULT NULL,
  `message_count` int(11) NOT NULL DEFAULT 0,
  `last_message_at` datetime DEFAULT NULL,
  `closed_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `channel_integrations`
--

CREATE TABLE `channel_integrations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `channel_type` enum('whatsapp','facebook','instagram','telegram','email') NOT NULL,
  `channel_name` varchar(255) NOT NULL,
  `api_credentials` text NOT NULL,
  `webhook_url` varchar(255) DEFAULT NULL,
  `webhook_token` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`settings`)),
  `last_synced_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `channel_messages`
--

CREATE TABLE `channel_messages` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `channel_integration_id` bigint(20) UNSIGNED NOT NULL,
  `ticket_id` bigint(20) UNSIGNED DEFAULT NULL,
  `contact_id` bigint(20) UNSIGNED DEFAULT NULL,
  `external_message_id` varchar(255) NOT NULL,
  `external_contact_id` varchar(255) NOT NULL,
  `contact_name` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(255) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `direction` enum('inbound','outbound') NOT NULL,
  `message_content` longtext NOT NULL,
  `media` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`media`)),
  `status` enum('pending','sent','delivered','read','failed') NOT NULL DEFAULT 'pending',
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `sent_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `read_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `channel_message_analytics`
--

CREATE TABLE `channel_message_analytics` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `channel_type` enum('whatsapp','facebook','instagram') NOT NULL,
  `date` date NOT NULL,
  `inbound_messages` int(11) NOT NULL DEFAULT 0,
  `outbound_messages` int(11) NOT NULL DEFAULT 0,
  `failed_messages` int(11) NOT NULL DEFAULT 0,
  `avg_response_time` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_conversations` int(11) NOT NULL DEFAULT 0,
  `resolved_conversations` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `companies`
--

CREATE TABLE `companies` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `company_type` varchar(255) DEFAULT NULL,
  `country` varchar(255) NOT NULL DEFAULT 'مصر',
  `currency` varchar(10) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `status` enum('active','suspended','under_review','inactive') NOT NULL DEFAULT 'under_review',
  `plan` enum('starter','professional','enterprise') NOT NULL DEFAULT 'professional',
  `subscription_plan` enum('starter','professional','enterprise') NOT NULL DEFAULT 'starter',
  `is_active` tinyint(1) NOT NULL DEFAULT 0,
  `db_name` varchar(255) DEFAULT NULL,
  `settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`settings`)),
  `trial_ends_at` timestamp NULL DEFAULT NULL,
  `subscription_ends_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `companies`
--

INSERT INTO `companies` (`id`, `name`, `company_type`, `country`, `currency`, `phone`, `website`, `email`, `address`, `logo`, `status`, `plan`, `subscription_plan`, `is_active`, `db_name`, `settings`, `trial_ends_at`, `subscription_ends_at`, `deleted_at`, `created_at`, `updated_at`) VALUES
(1, 'شركة CodeSphere التجريبية', NULL, 'مصر', NULL, '01000000000', NULL, 'demo@codesphere.io', NULL, NULL, 'active', 'professional', 'enterprise', 0, NULL, NULL, NULL, NULL, NULL, '2026-04-25 14:43:01', '2026-04-25 14:43:01'),
(2, 'tarek', NULL, 'مصر', NULL, '01146109626', NULL, 'tarek@gmail.com', NULL, NULL, 'active', 'professional', 'professional', 0, NULL, NULL, NULL, NULL, '2026-04-25 14:57:46', '2026-04-25 14:50:51', '2026-04-25 14:57:46'),
(3, 'Ceo', NULL, 'مصر', NULL, '01146109626', NULL, 'goher@gmail.com', NULL, NULL, 'active', 'professional', 'professional', 0, NULL, NULL, NULL, NULL, NULL, '2026-04-25 14:59:11', '2026-04-25 14:59:11'),
(4, 'tarek', NULL, 'مصر', NULL, '01146109626', NULL, 'taroka430@gmail.com', 'cairo', NULL, 'active', 'professional', 'professional', 0, NULL, NULL, NULL, NULL, NULL, '2026-04-25 15:23:10', '2026-05-07 20:04:24');

-- --------------------------------------------------------

--
-- Table structure for table `company_holidays`
--

CREATE TABLE `company_holidays` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `holiday_date` date NOT NULL,
  `name` varchar(255) NOT NULL,
  `name_ar` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_recurring` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `company_holidays`
--

INSERT INTO `company_holidays` (`id`, `company_id`, `holiday_date`, `name`, `name_ar`, `description`, `is_recurring`, `created_at`, `updated_at`) VALUES
(1, 4, '2026-05-22', 'eid', NULL, 'eid', 0, '2026-05-07 20:01:19', '2026-05-07 20:01:19'),
(2, 4, '2026-05-14', 'عيد الفطر', NULL, 'عيد الفطر', 0, '2026-05-07 20:05:06', '2026-05-07 20:05:06');

-- --------------------------------------------------------

--
-- Table structure for table `company_settings`
--

CREATE TABLE `company_settings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `work_start_hour` time NOT NULL DEFAULT '09:00:00',
  `work_end_hour` time NOT NULL DEFAULT '17:00:00',
  `weekend_days` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '[5,6]' CHECK (json_valid(`weekend_days`)),
  `timezone` varchar(255) NOT NULL DEFAULT 'Africa/Cairo',
  `company_name_ar` varchar(255) DEFAULT NULL,
  `company_name_en` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `favicon_url` varchar(255) DEFAULT NULL,
  `enable_sms_notifications` tinyint(1) NOT NULL DEFAULT 0,
  `enable_email_notifications` tinyint(1) NOT NULL DEFAULT 1,
  `enable_push_notifications` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `crm_activities`
--

CREATE TABLE `crm_activities` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `lead_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `type` enum('call','email','meeting','note','task') NOT NULL,
  `title` varchar(255) NOT NULL,
  `notes` text DEFAULT NULL,
  `activity_date` datetime NOT NULL,
  `is_done` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `crm_leads`
--

CREATE TABLE `crm_leads` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `contact_name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `source` varchar(255) DEFAULT NULL,
  `expected_value` decimal(14,2) NOT NULL DEFAULT 0.00,
  `stage_id` bigint(20) UNSIGNED DEFAULT NULL,
  `assigned_to` bigint(20) UNSIGNED DEFAULT NULL,
  `customer_id` bigint(20) UNSIGNED DEFAULT NULL,
  `expected_close_date` date DEFAULT NULL,
  `probability` int(11) NOT NULL DEFAULT 50,
  `notes` text DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `csat_ratings`
--

CREATE TABLE `csat_ratings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `ticket_id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `rating` tinyint(3) UNSIGNED NOT NULL,
  `comment` text DEFAULT NULL,
  `token` varchar(64) NOT NULL,
  `rated_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `currencies`
--

CREATE TABLE `currencies` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `code` varchar(10) NOT NULL,
  `name` varchar(255) NOT NULL,
  `symbol` varchar(10) DEFAULT NULL,
  `exchange_rate` decimal(12,6) NOT NULL DEFAULT 1.000000,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `currencies`
--

INSERT INTO `currencies` (`id`, `company_id`, `code`, `name`, `symbol`, `exchange_rate`, `is_default`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 4, 'USD', 'دولار أمريكي', '$', 1.000000, 0, 1, '2026-04-25 18:22:01', '2026-04-25 18:22:01');

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `tax_number` varchar(255) DEFAULT NULL,
  `credit_limit` decimal(12,2) NOT NULL DEFAULT 0.00,
  `balance` decimal(12,2) NOT NULL DEFAULT 0.00,
  `loyalty_points` int(11) NOT NULL DEFAULT 0,
  `notes` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `company_id`, `name`, `email`, `phone`, `address`, `tax_number`, `credit_limit`, `balance`, `loyalty_points`, `notes`, `is_active`, `deleted_at`, `created_at`, `updated_at`) VALUES
(1, 4, 'tarek', NULL, NULL, NULL, NULL, 0.00, 0.00, 0, NULL, 1, NULL, '2026-04-25 18:09:54', '2026-04-25 18:09:54'),
(2, 4, 'ahmed', NULL, NULL, NULL, NULL, 0.00, 0.00, 0, NULL, 1, NULL, '2026-04-27 10:10:38', '2026-04-27 10:10:38');

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL,
  `department` varchar(255) NOT NULL,
  `salary` decimal(10,2) NOT NULL DEFAULT 0.00,
  `phone` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `hire_date` date DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `avatar` varchar(255) DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `manager_id` bigint(20) UNSIGNED DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`id`, `company_id`, `name`, `role`, `department`, `salary`, `phone`, `email`, `hire_date`, `status`, `avatar`, `user_id`, `manager_id`, `deleted_at`, `created_at`, `updated_at`) VALUES
(1, 4, 'tarek', 'back end', 'devoloper', 10000.00, '01146109626', 'tarek@gmail.com', '2026-05-07', 'active', NULL, NULL, NULL, NULL, '2026-05-07 19:06:33', '2026-05-07 19:06:33');

-- --------------------------------------------------------

--
-- Table structure for table `erp_notifications`
--

CREATE TABLE `erp_notifications` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `type` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `body` text DEFAULT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  `icon` varchar(255) DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `erp_notifications`
--

INSERT INTO `erp_notifications` (`id`, `company_id`, `user_id`, `type`, `title`, `body`, `data`, `icon`, `url`, `read_at`, `created_at`, `updated_at`) VALUES
(5, 4, 9, 'success', 'فاتورة مبيعات جديدة', 'تم إنشاء فاتورة INV-20260427-0002 بقيمة 1.00 ج.م', NULL, NULL, NULL, NULL, '2026-04-27 17:04:39', '2026-04-27 17:04:39'),
(6, 4, 9, 'success', 'فاتورة مبيعات جديدة', 'تم إنشاء فاتورة INV-20260427-0003 بقيمة 10.00 ج.م', NULL, NULL, NULL, NULL, '2026-04-27 17:05:18', '2026-04-27 17:05:18'),
(7, 4, 9, 'success', 'فاتورة مبيعات جديدة', 'تم إنشاء فاتورة INV-20260427-0004 بقيمة 100,000.00 ج.م', NULL, NULL, NULL, NULL, '2026-04-27 17:14:57', '2026-04-27 17:14:57'),
(8, 4, 9, 'success', 'فاتورة مبيعات جديدة', 'تم إنشاء فاتورة INV-20260427-0005 بقيمة 1.00 ج.م', NULL, NULL, NULL, NULL, '2026-04-27 17:28:35', '2026-04-27 17:28:35'),
(9, 4, 9, 'success', 'فاتورة مبيعات جديدة', 'تم إنشاء فاتورة INV-20260427-0006 بقيمة 2.00 ج.م', NULL, NULL, NULL, NULL, '2026-04-27 17:29:19', '2026-04-27 17:29:19'),
(10, 4, 9, 'success', 'فاتورة مبيعات جديدة', 'تم إنشاء فاتورة INV-20260427-0007 بقيمة 2.00 ج.م', NULL, NULL, NULL, NULL, '2026-04-27 18:01:26', '2026-04-27 18:01:26'),
(11, 4, 9, 'success', 'فاتورة مبيعات جديدة', 'تم إنشاء فاتورة INV-20260427-0008 بقيمة 1.00 ج.م', NULL, NULL, NULL, NULL, '2026-04-27 18:02:20', '2026-04-27 18:02:20'),
(12, 4, 9, 'success', 'فاتورة مبيعات جديدة', 'تم إنشاء فاتورة INV-20260427-0009 بقيمة 2.00 ج.م', NULL, NULL, NULL, NULL, '2026-04-27 19:03:03', '2026-04-27 19:03:03'),
(13, 4, 9, 'success', 'فاتورة مبيعات جديدة', 'تم إنشاء فاتورة INV-20260428-0001 بقيمة 2.00 ج.م', NULL, NULL, NULL, NULL, '2026-04-28 13:05:09', '2026-04-28 13:05:09'),
(14, 4, 9, 'success', 'فاتورة مبيعات جديدة', 'تم إنشاء فاتورة INV-20260428-0001 بقيمة 2.00 ج.م', NULL, NULL, NULL, NULL, '2026-04-28 13:21:48', '2026-04-28 13:21:48');

-- --------------------------------------------------------

--
-- Table structure for table `escalation_rules`
--

CREATE TABLE `escalation_rules` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `trigger` varchar(255) DEFAULT NULL,
  `after_hours` int(11) DEFAULT NULL,
  `action` varchar(255) DEFAULT NULL,
  `action_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`action_data`)),
  `condition` enum('response_time','resolution_time','priority') NOT NULL,
  `threshold_hours` int(11) NOT NULL DEFAULT 24,
  `escalate_to_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `escalate_to_email` varchar(255) DEFAULT NULL,
  `notify_by` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`notify_by`)),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `field_service_details`
--

CREATE TABLE `field_service_details` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `field_service_request_id` bigint(20) UNSIGNED NOT NULL,
  `item_type` varchar(255) NOT NULL,
  `item_id` bigint(20) UNSIGNED NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `field_service_reports`
--

CREATE TABLE `field_service_reports` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `field_service_request_id` bigint(20) UNSIGNED NOT NULL,
  `technician_id` bigint(20) UNSIGNED NOT NULL,
  `summary` text NOT NULL,
  `work_done` text NOT NULL,
  `issues_found` text DEFAULT NULL,
  `recommendations` text DEFAULT NULL,
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`images`)),
  `total_amount` decimal(10,2) NOT NULL,
  `customer_signature_status` enum('pending','signed','rejected') NOT NULL DEFAULT 'pending',
  `customer_signature` text DEFAULT NULL,
  `signed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `field_service_requests`
--

CREATE TABLE `field_service_requests` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `customer_id` bigint(20) UNSIGNED NOT NULL,
  `assigned_technician_id` bigint(20) UNSIGNED DEFAULT NULL,
  `reference` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `location` geometry DEFAULT NULL,
  `scheduled_date` datetime NOT NULL,
  `actual_start` datetime DEFAULT NULL,
  `actual_end` datetime DEFAULT NULL,
  `estimated_duration` decimal(8,2) NOT NULL,
  `actual_duration` decimal(8,2) DEFAULT NULL,
  `priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `status` enum('new','assigned','in_progress','completed','cancelled') NOT NULL DEFAULT 'new',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `field_technicians`
--

CREATE TABLE `field_technicians` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `license_number` varchar(255) DEFAULT NULL,
  `license_expiry` date DEFAULT NULL,
  `skills` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`skills`)),
  `hourly_rate` decimal(10,2) NOT NULL,
  `status` enum('active','inactive','on_leave') NOT NULL DEFAULT 'active',
  `phone` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `location` geometry DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `field_technician_ratings`
--

CREATE TABLE `field_technician_ratings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `field_service_request_id` bigint(20) UNSIGNED NOT NULL,
  `technician_id` bigint(20) UNSIGNED NOT NULL,
  `customer_id` bigint(20) UNSIGNED NOT NULL,
  `rating` int(11) NOT NULL DEFAULT 5,
  `comment` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `field_technician_tracking`
--

CREATE TABLE `field_technician_tracking` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `field_technician_id` bigint(20) UNSIGNED NOT NULL,
  `location` geometry NOT NULL,
  `timestamp` datetime NOT NULL,
  `accuracy` double DEFAULT NULL,
  `source` varchar(255) NOT NULL DEFAULT 'mobile',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `fixed_assets`
--

CREATE TABLE `fixed_assets` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(255) DEFAULT NULL,
  `asset_code` varchar(50) DEFAULT NULL,
  `location` varchar(150) DEFAULT NULL,
  `vendor` varchar(150) DEFAULT NULL,
  `warranty_expiry_date` date DEFAULT NULL,
  `purchase_value` decimal(14,2) NOT NULL,
  `salvage_value` decimal(14,2) NOT NULL DEFAULT 0.00,
  `depreciation_rate` decimal(5,2) DEFAULT NULL,
  `depreciation_method` enum('straight_line','declining_balance') NOT NULL DEFAULT 'straight_line',
  `purchase_date` date NOT NULL,
  `useful_life_years` int(11) NOT NULL DEFAULT 5,
  `accumulated_depreciation` decimal(14,2) NOT NULL DEFAULT 0.00,
  `book_value` decimal(14,2) GENERATED ALWAYS AS (`purchase_value` - `accumulated_depreciation`) STORED,
  `status` enum('active','disposed','under_maintenance') NOT NULL DEFAULT 'active',
  `disposal_date` date DEFAULT NULL,
  `disposal_value` decimal(15,2) DEFAULT NULL,
  `disposal_reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `fixed_assets`
--

INSERT INTO `fixed_assets` (`id`, `company_id`, `name`, `category`, `asset_code`, `location`, `vendor`, `warranty_expiry_date`, `purchase_value`, `salvage_value`, `depreciation_rate`, `depreciation_method`, `purchase_date`, `useful_life_years`, `accumulated_depreciation`, `status`, `disposal_date`, `disposal_value`, `disposal_reason`, `created_at`, `updated_at`) VALUES
(1, 4, 'car', NULL, 'FA-2026-001', 'invo', 'goher', NULL, 100000.00, 50000.00, NULL, 'straight_line', '2026-05-07', 1, 0.00, 'active', NULL, NULL, NULL, '2026-05-07 19:05:36', '2026-05-07 19:05:36');

-- --------------------------------------------------------

--
-- Table structure for table `fleet_trips`
--

CREATE TABLE `fleet_trips` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `vehicle_id` bigint(20) UNSIGNED NOT NULL,
  `driver_id` bigint(20) UNSIGNED DEFAULT NULL,
  `trip_date` date NOT NULL,
  `origin` varchar(200) NOT NULL,
  `destination` varchar(200) NOT NULL,
  `distance_km` decimal(10,2) NOT NULL DEFAULT 0.00,
  `purpose` varchar(300) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `fuel_logs`
--

CREATE TABLE `fuel_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `journal_entry_id` bigint(20) UNSIGNED DEFAULT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `vehicle_id` bigint(20) UNSIGNED NOT NULL,
  `date` date NOT NULL,
  `liters` decimal(10,2) NOT NULL DEFAULT 0.00,
  `price_per_liter` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_cost` decimal(12,2) NOT NULL DEFAULT 0.00,
  `odometer` int(11) NOT NULL DEFAULT 0,
  `station` varchar(255) DEFAULT NULL,
  `full_tank` tinyint(1) NOT NULL DEFAULT 0,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `helpdesk_workflows`
--

CREATE TABLE `helpdesk_workflows` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `trigger` varchar(255) NOT NULL,
  `conditions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`conditions`)),
  `actions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`actions`)),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `runs` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `last_run` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ip_whitelist_entries`
--

CREATE TABLE `ip_whitelist_entries` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `ip_address` varchar(50) NOT NULL,
  `label` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_positions`
--

CREATE TABLE `job_positions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `department` varchar(255) DEFAULT NULL,
  `requirements` text DEFAULT NULL,
  `vacancies` int(11) NOT NULL DEFAULT 1,
  `status` enum('open','closed','on_hold') NOT NULL DEFAULT 'open',
  `closing_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `journal_entries`
--

CREATE TABLE `journal_entries` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `ref` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `description` text NOT NULL,
  `status` enum('draft','posted') NOT NULL DEFAULT 'draft',
  `type` enum('manual','auto') NOT NULL DEFAULT 'manual',
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `reference_type` varchar(255) DEFAULT NULL,
  `reference_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `journal_entry_lines`
--

CREATE TABLE `journal_entry_lines` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `journal_entry_id` bigint(20) UNSIGNED NOT NULL,
  `account_id` bigint(20) UNSIGNED NOT NULL,
  `debit` decimal(14,2) NOT NULL DEFAULT 0.00,
  `credit` decimal(14,2) NOT NULL DEFAULT 0.00,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `knowledge_articles`
--

CREATE TABLE `knowledge_articles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `category` varchar(255) DEFAULT NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT 0,
  `views` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `knowledge_articles`
--

INSERT INTO `knowledge_articles` (`id`, `company_id`, `title`, `content`, `category`, `is_published`, `views`, `created_at`, `updated_at`, `created_by`) VALUES
(1, 4, 'hr', 'done', 'sels', 0, 0, '2026-05-07 19:08:03', '2026-05-07 19:08:03', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `leave_requests`
--

CREATE TABLE `leave_requests` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `type` enum('annual','sick','emergency','unpaid','other') NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `days` int(11) GENERATED ALWAYS AS (to_days(`end_date`) - to_days(`start_date`) + 1) STORED,
  `reason` text DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `leave_requests`
--

INSERT INTO `leave_requests` (`id`, `company_id`, `employee_id`, `type`, `start_date`, `end_date`, `reason`, `status`, `approved_by`, `approved_at`, `rejection_reason`, `created_at`, `updated_at`) VALUES
(1, 4, 1, 'sick', '2026-05-08', '2026-05-22', 'done', 'pending', NULL, NULL, NULL, '2026-05-07 19:07:06', '2026-05-07 19:07:06');

-- --------------------------------------------------------

--
-- Table structure for table `live_chat_agents`
--

CREATE TABLE `live_chat_agents` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `status` enum('available','busy','away','offline') NOT NULL DEFAULT 'offline',
  `max_concurrent_chats` int(11) NOT NULL DEFAULT 5,
  `current_chats` int(11) NOT NULL DEFAULT 0,
  `bio` text DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `last_seen_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `live_chat_analytics`
--

CREATE TABLE `live_chat_analytics` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `date` date NOT NULL,
  `total_sessions` int(11) NOT NULL DEFAULT 0,
  `missed_chats` int(11) NOT NULL DEFAULT 0,
  `avg_wait_time` decimal(10,2) NOT NULL DEFAULT 0.00,
  `avg_chat_duration` decimal(10,2) NOT NULL DEFAULT 0.00,
  `satisfaction_score` decimal(3,2) NOT NULL DEFAULT 0.00,
  `total_messages` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `live_chat_messages`
--

CREATE TABLE `live_chat_messages` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `session_id` bigint(20) UNSIGNED NOT NULL,
  `sender_id` bigint(20) UNSIGNED DEFAULT NULL,
  `sender_type` varchar(255) NOT NULL,
  `message` longtext NOT NULL,
  `attachments` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`attachments`)),
  `message_type` enum('text','file','image','video') NOT NULL DEFAULT 'text',
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `read_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `live_chat_routing_rules`
--

CREATE TABLE `live_chat_routing_rules` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('round_robin','load_balanced','skill_based') NOT NULL DEFAULT 'round_robin',
  `agent_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`agent_ids`)),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `live_chat_sessions`
--

CREATE TABLE `live_chat_sessions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `visitor_id` bigint(20) UNSIGNED NOT NULL,
  `agent_id` bigint(20) UNSIGNED DEFAULT NULL,
  `session_token` varchar(255) NOT NULL,
  `status` enum('pending','active','closed','transferred') NOT NULL DEFAULT 'pending',
  `started_at` datetime NOT NULL,
  `assigned_at` datetime DEFAULT NULL,
  `ended_at` datetime DEFAULT NULL,
  `wait_time_seconds` int(11) DEFAULT NULL,
  `chat_duration_seconds` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `live_chat_visitors`
--

CREATE TABLE `live_chat_visitors` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `session_id` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `ip_address` varchar(255) DEFAULT NULL,
  `browser` varchar(255) DEFAULT NULL,
  `device` varchar(255) DEFAULT NULL,
  `current_page` text DEFAULT NULL,
  `referrer` text DEFAULT NULL,
  `status` enum('online','idle','offline') NOT NULL DEFAULT 'online',
  `last_activity_at` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `mail_configs`
--

CREATE TABLE `mail_configs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `host` varchar(255) NOT NULL,
  `port` smallint(5) UNSIGNED NOT NULL DEFAULT 587,
  `username` varchar(255) NOT NULL,
  `mail_password` text DEFAULT NULL,
  `imap_host` varchar(255) DEFAULT NULL,
  `encryption` enum('tls','ssl','none') NOT NULL DEFAULT 'tls',
  `from_email` varchar(255) NOT NULL,
  `from_name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `maintenance_records`
--

CREATE TABLE `maintenance_records` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `vehicle_id` bigint(20) UNSIGNED NOT NULL,
  `type` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `cost` decimal(15,2) NOT NULL DEFAULT 0.00,
  `date` date NOT NULL,
  `next_date` date DEFAULT NULL,
  `odometer` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `marketing_contacts`
--

CREATE TABLE `marketing_contacts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `list_id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `subscribed` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `marketing_contact_lists`
--

CREATE TABLE `marketing_contact_lists` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `type` enum('customers','leads','custom') NOT NULL DEFAULT 'custom',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '0001_01_01_000003_create_companies_table', 1),
(5, '2024_01_01_000003_create_core_tables', 1),
(6, '2024_01_01_000004_create_inventory_tables', 1),
(7, '2024_01_01_000005_create_sales_purchases_stock_table', 1),
(8, '2024_01_01_000006_create_hr_accounting_pos_table', 1),
(9, '2024_01_01_000011_create_sale_payments_and_subscriptions_tables', 1),
(10, '2024_01_02_000001_add_performance_indexes', 1),
(11, '2024_01_02_000002_fix_item_field_naming', 1),
(12, '2025_01_01_000001_create_appraisals_table', 1),
(13, '2025_01_01_000002_create_work_orders_table', 1),
(14, '2025_01_01_000003_create_campaigns_table', 1),
(15, '2025_01_01_000003_create_tax_rates_table', 1),
(16, '2025_01_01_000004_create_mail_configs_table', 1),
(17, '2025_01_01_000004_create_vehicles_table', 1),
(18, '2025_01_01_000005_create_product_lots_table', 1),
(19, '2025_01_01_000006_create_fleet_maintenance_trips_table', 1),
(20, '2025_01_01_000007_add_manager_id_to_employees_table', 1),
(21, '2025_01_01_000010_create_fuel_logs_table', 1),
(22, '2025_01_01_000011_create_canned_responses_table', 1),
(23, '2026_01_01_000002_add_company_to_users_table', 1),
(24, '2026_01_01_000003_create_subscriptions_and_tickets_table', 1),
(25, '2026_03_28_202053_create_permission_tables', 1),
(26, '2026_03_28_203744_create_personal_access_tokens_table', 1),
(27, '2026_03_29_000001_add_status_to_companies_table', 1),
(28, '2026_03_29_100000_add_company_id_to_tenant_tables', 1),
(29, '2026_04_01_000001_create_warehouses_table', 1),
(30, '2026_04_01_000002_add_quotation_fields_to_sales', 1),
(31, '2026_04_01_000003_create_hr_advanced_tables', 1),
(32, '2026_04_01_000004_create_accounting_advanced_tables', 1),
(33, '2026_04_01_000005_create_crm_tables', 1),
(34, '2026_04_01_000006_create_project_tables', 1),
(35, '2026_04_01_000007_create_notifications_helpdesk_tables', 1),
(36, '2026_04_02_000001_create_purchase_invoices_table', 1),
(37, '2026_04_02_000002_create_sla_policies_table', 1),
(38, '2026_04_02_000003_create_marketing_contacts_table', 1),
(39, '2026_04_03_000001_add_performance_indexes', 1),
(40, '2026_04_04_000001_add_missing_columns_to_users_table', 1),
(41, '2026_04_05_000001_add_purchase_price_and_tax_to_products_purchases', 1),
(42, '2026_04_08_133751_add_billing_cycle_to_subscriptions_table', 1),
(43, '2026_04_08_134427_fix_missing_columns_in_companies_and_subscriptions', 1),
(44, '2026_04_08_231549_update_purchases_status_enum', 1),
(45, '2026_04_10_000001_create_new_integrations_tables', 1),
(46, '2026_04_10_000002_create_helpdesk_workflows_table', 1),
(47, '2026_04_10_194555_update_stock_movements_type_column', 1),
(48, '2026_04_10_203303_add_warehouse_id_to_sale_items_table', 1),
(49, '2026_04_11_171819_add_due_date_tax_rate_to_sales_table', 1),
(50, '2026_04_11_184932_add_warehouse_discount_to_purchase_items_table', 1),
(51, '2026_04_11_202213_fix_purchase_items_add_warehouse_discount', 1),
(52, '2026_04_11_232302_update_sales_status_enum', 1),
(53, '2026_04_13_001833_add_quotation_statuses_to_sales_table', 1),
(54, '2026_04_13_002616_add_rating_to_suppliers_table', 1),
(55, '2026_04_13_012757_add_extra_columns_to_suppliers_table', 1),
(56, '2026_04_13_014544_add_country_to_suppliers_table', 1),
(57, '2026_04_13_020656_create_supplier_ledger_table', 1),
(58, '2026_04_15_000001_create_recruitments_table', 1),
(59, '2026_04_15_112204_create_fixed_assets_table', 1),
(60, '2026_04_15_113826_fix_depreciation_rate_add_disposal_warranty_to_fixed_assets', 1),
(61, '2026_04_15_220001_rename_leave_dates_to_start_end', 1),
(62, '2026_04_16_000001_create_applicants_table', 1),
(63, '2026_04_17_000000_add_on_hold_status_to_recruitments_table', 1),
(64, '2026_04_17_000002_create_appraisal_templates_table', 1),
(65, '2026_04_17_000003_create_appraisal_goals_table', 1),
(66, '2026_04_17_000004_create_appraisal_360_feedback_table', 1),
(67, '2026_04_17_005349_add_missing_columns_to_recruitments_table', 1),
(68, '2026_04_21_000001_create_ticket_attachments_table', 1),
(69, '2026_04_21_000002_create_ticket_logs_table', 1),
(70, '2026_04_21_000003_create_escalation_rules_table', 1),
(71, '2026_04_21_000004_create_service_catalog_table', 1),
(72, '2026_04_21_000005_create_tags_tables', 1),
(73, '2026_04_21_000006_create_notification_preferences_table', 1),
(74, '2026_04_21_000007_upgrade_support_tickets_status_and_fields', 1),
(75, '2026_04_21_000008_create_company_settings_table', 1),
(76, '2026_04_21_000009_create_company_holidays_table', 1),
(77, '2026_04_22_000001_create_csat_ratings_table', 1),
(78, '2026_04_22_000001_create_live_chat_tables', 1),
(79, '2026_04_22_000002_create_multichannel_tables', 1),
(80, '2026_04_22_000003_create_customer_portal_tables', 1),
(81, '2026_04_22_000004_create_bi_analytics_tables', 1),
(82, '2026_04_23_000001_enhance_bom_with_multi_level', 1),
(83, '2026_04_23_000002_create_bank_reconciliation_tables', 1),
(84, '2026_04_23_000003_create_field_service_tables', 1),
(85, '2026_04_24_000001_add_integration_columns', 1),
(86, '2026_04_25_131456_fix_purchase_invoices_nullable_and_status', 1),
(87, '2026_04_25_132452_add_missing_columns_to_purchase_invoices', 1),
(88, '2026_04_25_133440_add_due_date_to_purchase_invoices', 1),
(89, '2026_04_25_140846_fix_currencies_table_columns', 1),
(90, '2026_04_25_163805_add_created_by_to_knowledge_articles', 1),
(91, '2026_04_25_164013_alter_canned_responses_table', 1),
(92, '2026_04_25_175001_add_currency_to_companies_table', 2),
(93, '2026_04_26_000001_add_account_type_and_defaults', 3),
(94, '2026_04_27_000001_expand_accounts_chart', 3),
(95, '2026_05_07_225856_add_two_factor_confirmed_to_users_table', 4),
(96, '2026_05_07_230345_add_missing_columns_to_companies_table', 5),
(99, '2026_05_07_232900_add_email_to_branches_table', 6),
(100, '2026_05_07_234317_add_missing_columns_to_payrolls_table', 7),
(101, '2026_05_07_234412_fix_payrolls_status_enum', 8);

-- --------------------------------------------------------

--
-- Table structure for table `model_has_permissions`
--

CREATE TABLE `model_has_permissions` (
  `permission_id` bigint(20) UNSIGNED NOT NULL,
  `model_type` varchar(255) NOT NULL,
  `model_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `model_has_roles`
--

CREATE TABLE `model_has_roles` (
  `role_id` bigint(20) UNSIGNED NOT NULL,
  `model_type` varchar(255) NOT NULL,
  `model_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `model_has_roles`
--

INSERT INTO `model_has_roles` (`role_id`, `model_type`, `model_id`) VALUES
(1, 'App\\Models\\User', 1),
(2, 'App\\Models\\User', 2),
(3, 'App\\Models\\User', 3),
(4, 'App\\Models\\User', 4),
(5, 'App\\Models\\User', 5),
(6, 'App\\Models\\User', 6),
(10, 'App\\Models\\User', 9);

-- --------------------------------------------------------

--
-- Table structure for table `notification_preferences`
--

CREATE TABLE `notification_preferences` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `email_on_assigned` tinyint(1) NOT NULL DEFAULT 1,
  `email_on_status_change` tinyint(1) NOT NULL DEFAULT 1,
  `email_on_reply` tinyint(1) NOT NULL DEFAULT 1,
  `email_on_escalation` tinyint(1) NOT NULL DEFAULT 1,
  `inapp_on_assigned` tinyint(1) NOT NULL DEFAULT 1,
  `inapp_on_status_change` tinyint(1) NOT NULL DEFAULT 1,
  `inapp_on_reply` tinyint(1) NOT NULL DEFAULT 1,
  `inapp_on_escalation` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notification_preferences`
--

INSERT INTO `notification_preferences` (`id`, `user_id`, `email_on_assigned`, `email_on_status_change`, `email_on_reply`, `email_on_escalation`, `inapp_on_assigned`, `inapp_on_status_change`, `inapp_on_reply`, `inapp_on_escalation`, `created_at`, `updated_at`) VALUES
(1, 9, 1, 1, 1, 1, 1, 1, 1, 1, '2026-05-07 19:42:12', '2026-05-07 19:42:12');

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_gateway_configs`
--

CREATE TABLE `payment_gateway_configs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `provider` enum('paymob','stripe') NOT NULL DEFAULT 'paymob',
  `paymob_api_key` text DEFAULT NULL,
  `paymob_iframe_id` varchar(255) DEFAULT NULL,
  `paymob_integration_id` varchar(255) DEFAULT NULL,
  `stripe_public_key` varchar(255) DEFAULT NULL,
  `stripe_secret_key` text DEFAULT NULL,
  `currency` varchar(3) NOT NULL DEFAULT 'EGP',
  `is_active` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_transactions`
--

CREATE TABLE `payment_transactions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `provider` varchar(255) DEFAULT NULL,
  `order_id` varchar(255) DEFAULT NULL,
  `amount_cents` int(11) NOT NULL DEFAULT 0,
  `currency` varchar(3) NOT NULL DEFAULT 'EGP',
  `status` enum('pending','success','failed','refunded') NOT NULL DEFAULT 'pending',
  `reference` varchar(255) DEFAULT NULL,
  `raw_response` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`raw_response`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payrolls`
--

CREATE TABLE `payrolls` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `journal_entry_id` bigint(20) UNSIGNED DEFAULT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `month` int(11) NOT NULL,
  `year` int(11) NOT NULL,
  `basic_salary` decimal(10,2) NOT NULL DEFAULT 0.00,
  `allowances` decimal(15,2) NOT NULL DEFAULT 0.00,
  `bonus` decimal(10,2) NOT NULL DEFAULT 0.00,
  `deductions` decimal(10,2) NOT NULL DEFAULT 0.00,
  `net_salary` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('draft','approved','paid','pending') DEFAULT 'draft',
  `accounting_status` enum('pending','journalized','posted') NOT NULL DEFAULT 'pending',
  `paid_at` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payrolls`
--

INSERT INTO `payrolls` (`id`, `journal_entry_id`, `company_id`, `employee_id`, `month`, `year`, `basic_salary`, `allowances`, `bonus`, `deductions`, `net_salary`, `status`, `accounting_status`, `paid_at`, `created_at`, `updated_at`) VALUES
(1, NULL, 4, 1, 5, 2026, 10000.00, 0.00, 0.00, 0.00, 10000.00, 'paid', 'pending', '2026-05-07', '2026-05-07 20:44:32', '2026-05-07 20:44:38');

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `guard_name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`id`, `name`, `guard_name`, `created_at`, `updated_at`) VALUES
(1, 'view-dashboard', 'web', '2026-04-25 14:43:00', '2026-04-25 14:43:00'),
(2, 'manage-users', 'web', '2026-04-25 14:43:00', '2026-04-25 14:43:00'),
(3, 'manage-settings', 'web', '2026-04-25 14:43:00', '2026-04-25 14:43:00'),
(4, 'manage-products', 'web', '2026-04-25 14:43:00', '2026-04-25 14:43:00'),
(5, 'manage-sales', 'web', '2026-04-25 14:43:00', '2026-04-25 14:43:00'),
(6, 'manage-purchases', 'web', '2026-04-25 14:43:00', '2026-04-25 14:43:00'),
(7, 'manage-accounting', 'web', '2026-04-25 14:43:00', '2026-04-25 14:43:00'),
(8, 'manage-hr', 'web', '2026-04-25 14:43:00', '2026-04-25 14:43:00'),
(9, 'manage-pos', 'web', '2026-04-25 14:43:00', '2026-04-25 14:43:00'),
(10, 'manage-projects', 'web', '2026-04-25 14:43:00', '2026-04-25 14:43:00'),
(11, 'manage-crm', 'web', '2026-04-25 14:43:00', '2026-04-25 14:43:00'),
(12, 'manage-warehouses', 'web', '2026-04-25 14:43:00', '2026-04-25 14:43:00'),
(13, 'manage-budgets', 'web', '2026-04-25 14:43:00', '2026-04-25 14:43:00'),
(14, 'view-reports', 'web', '2026-04-25 14:43:00', '2026-04-25 14:43:00'),
(15, 'manage-helpdesk', 'web', '2026-04-25 14:43:00', '2026-04-25 14:43:00'),
(16, 'view-helpdesk', 'web', '2026-04-25 14:43:00', '2026-04-25 14:43:00'),
(17, 'manage-fleet', 'web', '2026-04-25 14:43:00', '2026-04-25 14:43:00'),
(18, 'manage-manufacturing', 'web', '2026-04-25 14:43:00', '2026-04-25 14:43:00'),
(19, 'manage-recruitment', 'web', '2026-04-25 14:43:00', '2026-04-25 14:43:00'),
(20, 'manage-marketing', 'web', '2026-04-25 14:43:00', '2026-04-25 14:43:00'),
(21, 'view-audit-logs', 'web', '2026-04-25 14:43:00', '2026-04-25 14:43:00'),
(22, 'manage-escalation-rules', 'web', '2026-04-25 14:43:00', '2026-04-25 14:43:00'),
(23, 'create-users', 'web', '2026-04-25 14:43:00', '2026-04-25 14:43:00'),
(24, 'edit-users', 'web', '2026-04-25 14:43:00', '2026-04-25 14:43:00'),
(25, 'view-users', 'web', '2026-04-25 14:43:00', '2026-04-25 14:43:00');

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 'App\\Models\\User', 1, 'api-token', '7b5e09e059b881050c1b40669248544747afddc6f82d361c33653e29a5d4e7a5', '[\"*\"]', '2026-04-25 14:47:43', NULL, '2026-04-25 14:43:32', '2026-04-25 14:47:43'),
(8, 'App\\Models\\User', 1, 'api-token', 'f9e0f7e3459e7656053dc192f1dac13046e7000727b44d3743cf99eda0587e69', '[\"*\"]', '2026-04-25 15:07:45', NULL, '2026-04-25 15:06:39', '2026-04-25 15:07:45'),
(9, 'App\\Models\\User', 1, 'api-token', 'bbb3ba1052e1d9fd4a73f27946f1b177da589d2ea7d82dc67228e92a50e47319', '[\"*\"]', '2026-04-25 15:17:26', NULL, '2026-04-25 15:08:49', '2026-04-25 15:17:26'),
(13, 'App\\Models\\User', 9, 'api-token', '3d8cf9d54a96e27cfc600e11f7e51b23551460e0bb60988845970a6dd4bc6cfa', '[\"*\"]', '2026-04-29 12:46:58', NULL, '2026-04-25 18:06:41', '2026-04-29 12:46:58'),
(14, 'App\\Models\\User', 9, 'api-token', '71afbdb9fbcc1a9ff8e67d4c3f51a514c89d5f0745e2d494b9484b1cb12b8777', '[\"*\"]', '2026-04-29 13:16:25', NULL, '2026-04-29 12:47:13', '2026-04-29 13:16:25'),
(17, 'App\\Models\\User', 9, 'api-token', '11ac7ff1e22f69443b82679c08afdec3063da01f1318120327ba4e280c758e53', '[\"*\"]', '2026-05-07 19:38:36', NULL, '2026-05-07 18:59:52', '2026-05-07 19:38:36'),
(18, 'App\\Models\\User', 9, 'api-token', 'dbac4b3c0019c78b7833ccb0ef9619db6ca5748ad0e18a71d7ff46800e6ce59c', '[\"*\"]', '2026-05-07 20:01:33', NULL, '2026-05-07 19:40:57', '2026-05-07 20:01:33'),
(19, 'App\\Models\\User', 9, 'api-token', '92a682face292fb6a6d93a9edc68cc0a883487c4f5968022834195802c362c96', '[\"*\"]', '2026-05-07 20:44:38', NULL, '2026-05-07 20:02:18', '2026-05-07 20:44:38');

-- --------------------------------------------------------

--
-- Table structure for table `pipeline_stages`
--

CREATE TABLE `pipeline_stages` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `color` varchar(255) NOT NULL DEFAULT '#6B7280',
  `order` int(11) NOT NULL DEFAULT 0,
  `is_won` tinyint(1) NOT NULL DEFAULT 0,
  `is_lost` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `portal_activity_logs`
--

CREATE TABLE `portal_activity_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `portal_user_id` bigint(20) UNSIGNED NOT NULL,
  `action` varchar(255) NOT NULL,
  `model_type` varchar(255) DEFAULT NULL,
  `model_id` bigint(20) UNSIGNED DEFAULT NULL,
  `changes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`changes`)),
  `ip_address` varchar(255) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `portal_invoices`
--

CREATE TABLE `portal_invoices` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `portal_user_id` bigint(20) UNSIGNED NOT NULL,
  `portal_order_id` bigint(20) UNSIGNED DEFAULT NULL,
  `invoice_number` varchar(255) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `status` enum('draft','sent','viewed','partially_paid','paid') NOT NULL DEFAULT 'sent',
  `issued_at` datetime NOT NULL,
  `due_at` datetime NOT NULL,
  `paid_at` datetime DEFAULT NULL,
  `pdf_path` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `portal_knowledge_base`
--

CREATE TABLE `portal_knowledge_base` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `content` longtext NOT NULL,
  `category` varchar(255) NOT NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT 1,
  `views` int(11) NOT NULL DEFAULT 0,
  `helpful_count` int(11) NOT NULL DEFAULT 0,
  `not_helpful_count` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `portal_orders`
--

CREATE TABLE `portal_orders` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `portal_user_id` bigint(20) UNSIGNED NOT NULL,
  `sale_id` bigint(20) UNSIGNED DEFAULT NULL,
  `order_number` varchar(255) NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `tax_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `status` enum('pending','confirmed','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
  `payment_status` enum('unpaid','partial','paid','refunded') NOT NULL DEFAULT 'unpaid',
  `tracking_number` varchar(255) DEFAULT NULL,
  `shipping_method` varchar(255) DEFAULT NULL,
  `shipped_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `portal_order_items`
--

CREATE TABLE `portal_order_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `portal_order_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED DEFAULT NULL,
  `product_name` varchar(255) NOT NULL,
  `sku` varchar(255) DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(15,2) NOT NULL,
  `total_price` decimal(15,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `portal_payments`
--

CREATE TABLE `portal_payments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `portal_user_id` bigint(20) UNSIGNED NOT NULL,
  `portal_invoice_id` bigint(20) UNSIGNED DEFAULT NULL,
  `payment_reference` varchar(255) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `status` enum('pending','processing','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
  `method` enum('credit_card','debit_card','bank_transfer','paypal','stripe') NOT NULL DEFAULT 'credit_card',
  `transaction_id` text DEFAULT NULL,
  `payment_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payment_details`)),
  `processed_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `portal_settings`
--

CREATE TABLE `portal_settings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `enable_self_service` tinyint(1) NOT NULL DEFAULT 1,
  `enable_knowledge_base` tinyint(1) NOT NULL DEFAULT 1,
  `enable_order_tracking` tinyint(1) NOT NULL DEFAULT 1,
  `enable_payment_online` tinyint(1) NOT NULL DEFAULT 1,
  `require_email_verification` tinyint(1) NOT NULL DEFAULT 1,
  `max_file_upload_size` int(11) NOT NULL DEFAULT 10,
  `allowed_file_types` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`allowed_file_types`)),
  `portal_description` text DEFAULT NULL,
  `portal_logo_url` varchar(255) DEFAULT NULL,
  `portal_custom_domain` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `portal_tickets`
--

CREATE TABLE `portal_tickets` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `portal_user_id` bigint(20) UNSIGNED NOT NULL,
  `support_ticket_id` bigint(20) UNSIGNED DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` longtext NOT NULL,
  `category` enum('billing','technical','general','feature_request') NOT NULL DEFAULT 'general',
  `priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  `status` enum('open','in_progress','waiting_customer','resolved','closed') NOT NULL DEFAULT 'open',
  `attachments` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`attachments`)),
  `resolved_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `portal_users`
--

CREATE TABLE `portal_users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `crm_contact_id` bigint(20) UNSIGNED NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive','suspended','pending') NOT NULL DEFAULT 'active',
  `address` text DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `postal_code` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `email_verified_at` datetime DEFAULT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pos_shifts`
--

CREATE TABLE `pos_shifts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `opening_cash` decimal(12,2) NOT NULL DEFAULT 0.00,
  `closing_cash` decimal(12,2) DEFAULT NULL,
  `total_sales` decimal(12,2) NOT NULL DEFAULT 0.00,
  `sales_count` int(11) NOT NULL DEFAULT 0,
  `cash_difference` decimal(12,2) DEFAULT NULL,
  `status` enum('open','closed') NOT NULL DEFAULT 'open',
  `opened_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `closed_at` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `category_id` bigint(20) UNSIGNED DEFAULT NULL,
  `warehouse_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `name_en` varchar(255) DEFAULT NULL,
  `sku` varchar(255) DEFAULT NULL,
  `barcode` varchar(255) DEFAULT NULL,
  `unit` varchar(255) NOT NULL DEFAULT 'piece',
  `price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `cost` decimal(12,2) NOT NULL DEFAULT 0.00,
  `purchase_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `qty` decimal(12,3) NOT NULL DEFAULT 0.000,
  `min_qty` decimal(12,3) NOT NULL DEFAULT 0.000,
  `tax_rate` decimal(5,2) NOT NULL DEFAULT 0.00,
  `description` text DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `company_id`, `category_id`, `warehouse_id`, `name`, `name_en`, `sku`, `barcode`, `unit`, `price`, `cost`, `purchase_price`, `qty`, `min_qty`, `tax_rate`, `description`, `image_url`, `image`, `is_active`, `deleted_at`, `created_at`, `updated_at`) VALUES
(1, 4, 1, NULL, 'lap top', NULL, 'SKU-69ED2D2756AD3', NULL, 'piece', 0.00, 0.00, 0.00, 0.000, 0.000, 0.00, NULL, NULL, NULL, 1, '2026-04-25 18:08:36', '2026-04-25 18:07:51', '2026-04-25 18:08:36'),
(2, 4, 1, NULL, 'lap top', NULL, 'SKU-69ED2D6C1E8AF', NULL, 'piece', 18000.00, 13181.82, 0.00, 11.000, 0.000, 0.00, 'تم', NULL, NULL, 1, '2026-04-27 17:24:58', '2026-04-25 18:09:00', '2026-04-27 17:25:13'),
(3, 4, 1, NULL, 'lap top', NULL, 'SKU-69EFC65D467D6', NULL, 'piece', 2.00, 1.00, 0.00, 12.000, 2.000, 0.00, 'ok', NULL, NULL, 1, '2026-04-27 18:54:43', '2026-04-27 17:26:05', '2026-04-27 18:54:43'),
(4, 4, 1, NULL, 'lap top', NULL, 'SKU-69EFDBBDBC053', NULL, 'piece', 2.00, 1.00, 0.00, 6.000, 2.000, 0.00, 'تم', NULL, NULL, 1, NULL, '2026-04-27 18:57:17', '2026-04-28 13:21:48');

-- --------------------------------------------------------

--
-- Table structure for table `product_locations`
--

CREATE TABLE `product_locations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `warehouse_id` bigint(20) UNSIGNED NOT NULL,
  `qty` decimal(12,3) NOT NULL DEFAULT 0.000,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_locations`
--

INSERT INTO `product_locations` (`id`, `company_id`, `product_id`, `warehouse_id`, `qty`, `created_at`, `updated_at`) VALUES
(11, 4, 2, 1, 11.000, '2026-04-27 11:06:01', '2026-04-27 17:25:13'),
(22, 4, 3, 1, 12.000, '2026-04-27 18:01:26', '2026-04-27 18:54:12'),
(23, 4, 4, 1, 8.000, '2026-04-27 18:57:57', '2026-04-28 13:05:09');

-- --------------------------------------------------------

--
-- Table structure for table `product_lots`
--

CREATE TABLE `product_lots` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `lot_number` varchar(255) NOT NULL,
  `serial_type` enum('lot','serial') NOT NULL DEFAULT 'lot',
  `qty` double NOT NULL DEFAULT 1,
  `expiry_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('active','expired','consumed') NOT NULL DEFAULT 'active',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

CREATE TABLE `projects` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `invoice_id` bigint(20) UNSIGNED DEFAULT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `customer_id` bigint(20) UNSIGNED DEFAULT NULL,
  `manager_id` bigint(20) UNSIGNED DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `budget` decimal(14,2) NOT NULL DEFAULT 0.00,
  `status` enum('planning','active','on_hold','completed','cancelled') NOT NULL DEFAULT 'planning',
  `invoiced` tinyint(1) NOT NULL DEFAULT 0,
  `progress` int(11) NOT NULL DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `projects`
--

INSERT INTO `projects` (`id`, `invoice_id`, `company_id`, `name`, `description`, `customer_id`, `manager_id`, `start_date`, `end_date`, `budget`, `status`, `invoiced`, `progress`, `deleted_at`, `created_at`, `updated_at`) VALUES
(1, NULL, 4, 'المعمول', 'تم', NULL, NULL, '2026-05-08', '2026-05-29', 100000.00, 'active', 0, 0, NULL, '2026-05-07 19:15:54', '2026-05-07 19:15:54');

-- --------------------------------------------------------

--
-- Table structure for table `project_tasks`
--

CREATE TABLE `project_tasks` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `assigned_to` bigint(20) UNSIGNED DEFAULT NULL,
  `status` enum('todo','in_progress','review','done') NOT NULL DEFAULT 'todo',
  `priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `due_date` date DEFAULT NULL,
  `estimated_hours` int(11) NOT NULL DEFAULT 0,
  `order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `purchases`
--

CREATE TABLE `purchases` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_number` varchar(255) DEFAULT NULL COMMENT 'رقم الطلب للفرونت',
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `supplier_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `po_number` varchar(255) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(15,2) NOT NULL DEFAULT 0.00 COMMENT 'قيمة الضريبة',
  `tax` decimal(12,2) NOT NULL DEFAULT 0.00,
  `discount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `status` enum('draft','pending','approved','ordered','received','cancelled') NOT NULL DEFAULT 'draft',
  `expected_at` date DEFAULT NULL,
  `received_at` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `purchases`
--

INSERT INTO `purchases` (`id`, `order_number`, `company_id`, `supplier_id`, `user_id`, `po_number`, `subtotal`, `tax_amount`, `tax`, `discount`, `total`, `status`, `expected_at`, `received_at`, `notes`, `deleted_at`, `created_at`, `updated_at`) VALUES
(1, NULL, 4, 1, 9, 'PO-20260425-0001', 75000.00, 0.00, 0.00, 0.00, 75000.00, 'received', '2026-04-27', NULL, 'تم', NULL, '2026-04-25 18:09:10', '2026-04-27 11:06:13'),
(2, NULL, 4, 1, 9, 'PO-20260427-0002', 70000.00, 0.00, 0.00, 0.00, 70000.00, 'received', '2026-04-28', NULL, NULL, NULL, '2026-04-27 10:13:29', '2026-04-27 11:06:01'),
(3, NULL, 4, 1, 9, 'PO-20260427-0003', 11.00, 0.00, 0.00, 0.00, 11.00, 'received', '2026-04-27', NULL, NULL, NULL, '2026-04-27 17:26:14', '2026-04-27 17:27:02'),
(4, NULL, 4, 1, 9, 'PO-20260427-0004', 1.00, 0.00, 0.00, 0.00, 1.00, 'received', '2026-04-29', NULL, NULL, NULL, '2026-04-27 18:57:25', '2026-04-27 18:57:57'),
(5, NULL, 4, 1, 9, 'PO-20260428-0005', 10.00, 0.00, 0.00, 0.00, 10.00, 'received', '2026-04-29', NULL, NULL, NULL, '2026-04-28 12:46:30', '2026-04-28 12:46:33');

-- --------------------------------------------------------

--
-- Table structure for table `purchase_invoices`
--

CREATE TABLE `purchase_invoices` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `purchase_id` bigint(20) UNSIGNED DEFAULT NULL,
  `supplier_id` bigint(20) UNSIGNED NOT NULL,
  `invoice_number` varchar(255) DEFAULT NULL,
  `invoice_date` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `tax` decimal(15,2) NOT NULL DEFAULT 0.00,
  `discount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total` decimal(15,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `status` enum('draft','pending','matched','discrepancy','approved','paid','overdue','cancelled') NOT NULL DEFAULT 'draft',
  `notes` text DEFAULT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `po_matched` tinyint(1) NOT NULL DEFAULT 0,
  `receipt_matched` tinyint(1) NOT NULL DEFAULT 0,
  `invoice_matched` tinyint(1) NOT NULL DEFAULT 0,
  `po_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `received_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `variance` decimal(15,2) NOT NULL DEFAULT 0.00,
  `discrepancy_notes` text DEFAULT NULL,
  `matched_at` timestamp NULL DEFAULT NULL,
  `matched_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `purchase_invoices`
--

INSERT INTO `purchase_invoices` (`id`, `company_id`, `purchase_id`, `supplier_id`, `invoice_number`, `invoice_date`, `due_date`, `amount`, `tax`, `discount`, `total`, `tax_amount`, `total_amount`, `status`, `notes`, `reference`, `po_matched`, `receipt_matched`, `invoice_matched`, `po_amount`, `received_amount`, `variance`, `discrepancy_notes`, `matched_at`, `matched_by`, `created_at`, `updated_at`) VALUES
(4, 4, 4, 1, NULL, '2026-04-27', NULL, 1.00, 0.00, 0.00, 1.00, 0.00, 0.00, 'draft', 'فاتورة شراء تلقائية - PO-20260427-0004', 'PO-20260427-0004', 0, 0, 0, 0.00, 0.00, 0.00, NULL, NULL, NULL, '2026-04-27 18:57:57', '2026-04-27 18:57:57'),
(5, 4, 5, 1, NULL, '2026-04-28', NULL, 10.00, 0.00, 0.00, 10.00, 0.00, 0.00, 'draft', 'فاتورة شراء تلقائية - PO-20260428-0005', 'PO-20260428-0005', 0, 0, 0, 0.00, 0.00, 0.00, NULL, NULL, NULL, '2026-04-28 12:46:33', '2026-04-28 12:46:33');

-- --------------------------------------------------------

--
-- Table structure for table `purchase_items`
--

CREATE TABLE `purchase_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `purchase_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED DEFAULT NULL,
  `warehouse_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `quantity` decimal(12,3) NOT NULL,
  `unit_price` decimal(12,2) NOT NULL,
  `discount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total` decimal(12,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `purchase_items`
--

INSERT INTO `purchase_items` (`id`, `purchase_id`, `product_id`, `warehouse_id`, `name`, `quantity`, `unit_price`, `discount`, `total`, `created_at`, `updated_at`) VALUES
(1, 1, 2, 1, NULL, 1.000, 75000.00, 0.00, 75000.00, '2026-04-25 18:09:10', '2026-04-25 18:09:10'),
(2, 2, 2, 1, NULL, 10.000, 7000.00, 0.00, 70000.00, '2026-04-27 10:13:29', '2026-04-27 10:13:29'),
(3, 3, 3, NULL, NULL, 11.000, 1.00, 0.00, 11.00, '2026-04-27 17:26:14', '2026-04-27 17:26:14'),
(5, 4, 4, 1, NULL, 1.000, 1.00, 0.00, 1.00, '2026-04-27 18:57:54', '2026-04-27 18:57:54'),
(6, 5, 4, NULL, NULL, 10.000, 1.00, 0.00, 10.00, '2026-04-28 12:46:30', '2026-04-28 12:46:30');

-- --------------------------------------------------------

--
-- Table structure for table `recruitments`
--

CREATE TABLE `recruitments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `department` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `status` enum('open','closed','draft','on_hold') NOT NULL,
  `salary_range_min` decimal(10,2) DEFAULT NULL,
  `salary_range_max` decimal(10,2) DEFAULT NULL,
  `is_archived` tinyint(1) NOT NULL DEFAULT 0,
  `open_date` date DEFAULT NULL,
  `close_date` date DEFAULT NULL,
  `vacancies` int(11) NOT NULL DEFAULT 1,
  `description` text DEFAULT NULL,
  `requirements` text DEFAULT NULL,
  `deadline` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `recruitments`
--

INSERT INTO `recruitments` (`id`, `company_id`, `title`, `department`, `location`, `status`, `salary_range_min`, `salary_range_max`, `is_archived`, `open_date`, `close_date`, `vacancies`, `description`, `requirements`, `deadline`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 4, 'باك ايند', 'IT', NULL, 'on_hold', 10000.00, 20000.00, 0, '2026-05-08', '2026-05-30', 1, NULL, 'اوك', NULL, '2026-05-07 19:10:32', '2026-05-07 19:11:14', NULL),
(2, 4, 'باك ايند (Copy)', 'IT', NULL, 'draft', 10000.00, 20000.00, 1, '2026-05-08', '2026-05-30', 1, NULL, 'اوك', NULL, '2026-05-07 19:10:52', '2026-05-07 19:10:57', '2026-05-07 19:10:57'),
(3, 4, 'باك ايند (Copy)', 'IT', NULL, 'draft', 10000.00, 20000.00, 0, '2026-05-08', '2026-05-30', 1, NULL, 'اوك', NULL, '2026-05-07 19:11:04', '2026-05-07 19:11:09', '2026-05-07 19:11:09');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `guard_name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `guard_name`, `created_at`, `updated_at`) VALUES
(1, 'super-admin', 'web', '2026-04-25 14:43:00', '2026-04-25 14:43:00'),
(2, 'manager', 'web', '2026-04-25 14:43:00', '2026-04-25 14:43:00'),
(3, 'accountant', 'web', '2026-04-25 14:43:00', '2026-04-25 14:43:00'),
(4, 'store-manager', 'web', '2026-04-25 14:43:01', '2026-04-25 14:43:01'),
(5, 'cashier', 'web', '2026-04-25 14:43:01', '2026-04-25 14:43:01'),
(6, 'sales-rep', 'web', '2026-04-25 14:43:01', '2026-04-25 14:43:01'),
(7, 'hr-manager', 'web', '2026-04-25 14:43:01', '2026-04-25 14:43:01'),
(8, 'viewer', 'web', '2026-04-25 14:43:01', '2026-04-25 14:43:01'),
(9, 'branch_manager', 'web', '2026-04-25 14:43:01', '2026-04-25 14:43:01'),
(10, 'admin', 'web', '2026-04-25 15:17:14', '2026-04-25 15:17:14');

-- --------------------------------------------------------

--
-- Table structure for table `role_has_permissions`
--

CREATE TABLE `role_has_permissions` (
  `permission_id` bigint(20) UNSIGNED NOT NULL,
  `role_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `role_has_permissions`
--

INSERT INTO `role_has_permissions` (`permission_id`, `role_id`) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 5),
(1, 6),
(1, 7),
(1, 8),
(1, 9),
(2, 1),
(2, 2),
(3, 1),
(3, 2),
(4, 1),
(4, 2),
(4, 4),
(5, 1),
(5, 2),
(5, 5),
(5, 6),
(6, 1),
(6, 2),
(7, 1),
(7, 2),
(7, 3),
(8, 1),
(8, 2),
(8, 7),
(9, 1),
(9, 2),
(9, 5),
(10, 1),
(10, 2),
(11, 1),
(11, 2),
(11, 6),
(12, 1),
(12, 2),
(12, 4),
(13, 1),
(13, 2),
(13, 3),
(14, 1),
(14, 2),
(14, 3),
(14, 4),
(14, 7),
(14, 8),
(15, 1),
(15, 2),
(16, 1),
(16, 2),
(16, 3),
(16, 4),
(16, 5),
(16, 6),
(16, 7),
(16, 8),
(16, 9),
(17, 1),
(17, 2),
(18, 1),
(18, 2),
(18, 4),
(19, 1),
(19, 2),
(19, 7),
(20, 1),
(20, 2),
(21, 1),
(21, 2),
(22, 1),
(22, 2),
(23, 9),
(24, 9),
(25, 9);

-- --------------------------------------------------------

--
-- Table structure for table `sales`
--

CREATE TABLE `sales` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED DEFAULT NULL,
  `opportunity_id` bigint(20) UNSIGNED DEFAULT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `customer_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `invoice_number` varchar(255) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL DEFAULT 0.00,
  `tax` decimal(12,2) NOT NULL DEFAULT 0.00,
  `discount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `paid_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `status` enum('draft','pending','confirmed','completed','cancelled','refunded','quotation','sent') NOT NULL DEFAULT 'draft',
  `sale_type` enum('invoice','quotation') NOT NULL DEFAULT 'invoice',
  `payment_method` varchar(255) NOT NULL DEFAULT 'cash',
  `payment_terms` varchar(255) DEFAULT NULL,
  `valid_until` date DEFAULT NULL,
  `converted_from_id` bigint(20) UNSIGNED DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `tax_rate_id` bigint(20) UNSIGNED DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `sale_date` date DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sales`
--

INSERT INTO `sales` (`id`, `project_id`, `opportunity_id`, `company_id`, `customer_id`, `user_id`, `invoice_number`, `subtotal`, `tax`, `discount`, `total`, `paid_amount`, `status`, `sale_type`, `payment_method`, `payment_terms`, `valid_until`, `converted_from_id`, `notes`, `tax_rate_id`, `due_date`, `sale_date`, `deleted_at`, `created_at`, `updated_at`) VALUES
(1, NULL, NULL, 4, 1, 9, 'INV-20260427-0001', 15.00, 0.00, 0.00, 15.00, 0.00, 'completed', 'invoice', 'cash', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-27 16:58:35', '2026-04-27 16:52:18', '2026-04-27 16:58:35'),
(4, NULL, NULL, 4, 1, 9, 'INV-20260427-0002', 1.00, 0.00, 0.00, 1.00, 0.00, 'completed', 'invoice', 'cash', NULL, NULL, NULL, NULL, NULL, '2026-04-27', NULL, '2026-04-27 17:12:51', '2026-04-27 17:04:39', '2026-04-27 17:12:51'),
(7, NULL, NULL, 4, 2, 9, 'INV-20260427-0003', 10.00, 0.00, 0.00, 10.00, 0.00, 'completed', 'invoice', 'cash', NULL, NULL, NULL, NULL, NULL, '2026-04-27', NULL, '2026-04-27 17:12:48', '2026-04-27 17:05:18', '2026-04-27 17:12:48'),
(8, NULL, NULL, 4, 1, 9, 'INV-20260427-0004', 100000.00, 0.00, 0.00, 100000.00, 0.00, 'completed', 'invoice', 'cash', NULL, NULL, NULL, NULL, NULL, '2026-04-27', NULL, '2026-04-27 17:25:13', '2026-04-27 17:14:57', '2026-04-27 17:25:13'),
(9, NULL, NULL, 4, 1, 9, 'INV-20260427-0005', 1.00, 0.00, 0.00, 1.00, 0.00, 'completed', 'invoice', 'cash', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-27 17:39:01', '2026-04-27 17:28:35', '2026-04-27 17:39:01'),
(10, NULL, NULL, 4, 1, 9, 'INV-20260427-0006', 2.00, 0.00, 0.00, 2.00, 0.00, 'refunded', 'invoice', 'cash', NULL, NULL, NULL, '[مرتجع RTN-260427-8379] defective', NULL, '2026-04-27', NULL, '2026-04-27 17:38:58', '2026-04-27 17:29:19', '2026-04-27 17:38:58'),
(21, NULL, NULL, 4, 2, 9, 'INV-20260427-0007', 2.00, 0.00, 0.00, 2.00, 0.00, 'completed', 'invoice', 'cash', NULL, NULL, NULL, NULL, NULL, '2026-04-29', NULL, '2026-04-27 18:03:00', '2026-04-27 18:01:26', '2026-04-27 18:03:00'),
(22, NULL, NULL, 4, 1, 9, 'INV-20260427-0008', 1.00, 0.00, 0.00, 1.00, 0.00, 'completed', 'invoice', 'cash', NULL, NULL, NULL, NULL, NULL, '2026-04-29', NULL, '2026-04-27 18:54:12', '2026-04-27 18:02:20', '2026-04-27 18:54:12'),
(23, NULL, NULL, 4, 1, 9, 'INV-20260427-0009', 2.00, 0.00, 0.00, 2.00, 0.00, 'completed', 'invoice', 'cash', NULL, NULL, NULL, NULL, NULL, '2026-04-29', NULL, NULL, '2026-04-27 19:03:03', '2026-04-27 19:03:03'),
(29, NULL, NULL, 4, 2, 9, 'INV-20260428-0001', 2.00, 0.00, 0.00, 2.00, 0.00, 'completed', 'invoice', 'cash', NULL, NULL, NULL, NULL, NULL, '2026-04-28', NULL, NULL, '2026-04-28 13:05:09', '2026-04-28 13:05:09');

-- --------------------------------------------------------

--
-- Table structure for table `sale_items`
--

CREATE TABLE `sale_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `sale_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED DEFAULT NULL,
  `warehouse_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `quantity` decimal(12,3) NOT NULL,
  `unit_price` decimal(12,2) NOT NULL,
  `discount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total` decimal(12,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sale_items`
--

INSERT INTO `sale_items` (`id`, `sale_id`, `product_id`, `warehouse_id`, `name`, `quantity`, `unit_price`, `discount`, `total`, `created_at`, `updated_at`) VALUES
(1, 1, 2, NULL, NULL, 15.000, 1.00, 0.00, 15.00, '2026-04-27 16:52:18', '2026-04-27 16:52:18'),
(4, 4, 2, 1, NULL, 1.000, 1.00, 0.00, 1.00, '2026-04-27 17:04:39', '2026-04-27 17:04:39'),
(7, 7, 2, NULL, NULL, 10.000, 1.00, 0.00, 10.00, '2026-04-27 17:05:18', '2026-04-27 17:05:18'),
(8, 8, 2, 1, NULL, 1.000, 100000.00, 0.00, 100000.00, '2026-04-27 17:14:57', '2026-04-27 17:14:57'),
(9, 9, 3, NULL, NULL, 1.000, 1.00, 0.00, 1.00, '2026-04-27 17:28:35', '2026-04-27 17:28:35'),
(10, 10, 3, NULL, NULL, 1.000, 2.00, 0.00, 2.00, '2026-04-27 17:29:19', '2026-04-27 17:29:19'),
(21, 21, 3, 1, NULL, 1.000, 2.00, 0.00, 2.00, '2026-04-27 18:01:26', '2026-04-27 18:01:26'),
(22, 22, 3, 1, NULL, 1.000, 1.00, 0.00, 1.00, '2026-04-27 18:02:20', '2026-04-27 18:02:20'),
(23, 23, 4, 1, NULL, 1.000, 2.00, 0.00, 2.00, '2026-04-27 19:03:03', '2026-04-27 19:03:03'),
(29, 29, 4, 1, NULL, 1.000, 2.00, 0.00, 2.00, '2026-04-28 13:05:09', '2026-04-28 13:05:09');

-- --------------------------------------------------------

--
-- Table structure for table `sale_payments`
--

CREATE TABLE `sale_payments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `sale_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_method` varchar(255) NOT NULL DEFAULT 'cash',
  `reference` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `service_catalog`
--

CREATE TABLE `service_catalog` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(255) DEFAULT NULL,
  `category` varchar(255) NOT NULL,
  `form_schema` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`form_schema`)),
  `default_priority` varchar(255) NOT NULL DEFAULT 'medium',
  `default_assigned_role` varchar(255) DEFAULT NULL,
  `sla_hours` int(11) NOT NULL DEFAULT 24,
  `requires_approval` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `service_catalog`
--

INSERT INTO `service_catalog` (`id`, `company_id`, `name`, `description`, `icon`, `category`, `form_schema`, `default_priority`, `default_assigned_role`, `sla_hours`, `requires_approval`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 4, 'تصليح', 'ok', NULL, 'IT', '{\"fields\":[{\"type\":\"text\",\"label\":\"lable\",\"name\":\"name\",\"required\":false}]}', 'medium', 'hr', 24, 0, 1, 0, '2026-05-07 19:20:49', '2026-05-07 19:20:49');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sla_policies`
--

CREATE TABLE `sla_policies` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `priority` varchar(255) NOT NULL DEFAULT 'medium',
  `first_response_hours` int(11) NOT NULL DEFAULT 24,
  `resolution_hours` int(11) NOT NULL DEFAULT 72,
  `business_hours_only` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sms_configs`
--

CREATE TABLE `sms_configs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `provider` enum('twilio','vonage') NOT NULL DEFAULT 'twilio',
  `account_sid` varchar(255) DEFAULT NULL,
  `auth_token` text DEFAULT NULL,
  `from_number` varchar(255) DEFAULT NULL,
  `api_key` varchar(255) DEFAULT NULL,
  `api_secret` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sms_logs`
--

CREATE TABLE `sms_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `provider` varchar(255) DEFAULT NULL,
  `to` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `status` enum('sent','failed','pending') NOT NULL DEFAULT 'pending',
  `external_id` varchar(255) DEFAULT NULL,
  `sent_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `social_media_settings`
--

CREATE TABLE `social_media_settings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `platform` enum('facebook','instagram') NOT NULL,
  `page_id` varchar(255) NOT NULL,
  `page_name` varchar(255) NOT NULL,
  `page_access_token` varchar(255) NOT NULL,
  `business_info` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`business_info`)),
  `auto_reply_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `auto_reply_message` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stock_movements`
--

CREATE TABLE `stock_movements` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `warehouse_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `type` enum('in','out','transfer','adjustment','return','transfer_in','transfer_out') NOT NULL,
  `qty` decimal(12,3) NOT NULL,
  `qty_before` decimal(12,3) NOT NULL DEFAULT 0.000,
  `qty_after` decimal(12,3) NOT NULL DEFAULT 0.000,
  `cost` decimal(12,2) NOT NULL DEFAULT 0.00,
  `reference_type` varchar(255) DEFAULT NULL,
  `reference_id` bigint(20) UNSIGNED DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `stock_movements`
--

INSERT INTO `stock_movements` (`id`, `company_id`, `product_id`, `warehouse_id`, `user_id`, `type`, `qty`, `qty_before`, `qty_after`, `cost`, `reference_type`, `reference_id`, `notes`, `created_at`, `updated_at`) VALUES
(1, 4, 2, NULL, 9, 'out', 15.000, -9995.000, -10010.000, 0.00, 'App\\Models\\Sale', 1, 'فاتورة INV-20260427-0001', '2026-04-27 16:52:18', '2026-04-27 16:52:18'),
(2, 4, 2, NULL, 9, 'in', 15.000, 11.000, 26.000, 0.00, 'App\\Models\\Sale', 1, '[حذف فاتورة] INV-20260427-0001', '2026-04-27 16:58:35', '2026-04-27 16:58:35'),
(3, 4, 2, 1, 9, 'out', 1.000, 11.000, 10.000, 0.00, 'App\\Models\\Sale', 4, 'فاتورة INV-20260427-0002', '2026-04-27 17:04:39', '2026-04-27 17:04:39'),
(4, 4, 2, NULL, 9, 'out', 10.000, 10.000, 0.000, 0.00, 'App\\Models\\Sale', 7, 'فاتورة INV-20260427-0003', '2026-04-27 17:05:18', '2026-04-27 17:05:18'),
(5, 4, 2, NULL, 9, 'in', 10.000, 11.000, 21.000, 0.00, 'App\\Models\\Sale', 7, '[حذف فاتورة] INV-20260427-0003', '2026-04-27 17:12:48', '2026-04-27 17:12:48'),
(6, 4, 2, 1, 9, 'in', 1.000, 21.000, 22.000, 0.00, 'App\\Models\\Sale', 4, '[حذف فاتورة] INV-20260427-0002', '2026-04-27 17:12:51', '2026-04-27 17:12:51'),
(7, 4, 2, 1, 9, 'out', 1.000, 11.000, 10.000, 0.00, 'App\\Models\\Sale', 8, 'فاتورة INV-20260427-0004', '2026-04-27 17:14:57', '2026-04-27 17:14:57'),
(8, 4, 2, 1, 9, 'in', 1.000, 10.000, 11.000, 0.00, 'App\\Models\\Sale', 8, '[حذف فاتورة] INV-20260427-0004', '2026-04-27 17:25:13', '2026-04-27 17:25:13'),
(9, 4, 3, NULL, 9, 'in', 11.000, 0.000, 11.000, 0.00, 'App\\Models\\Purchase', 3, 'استلام أمر شراء PO-20260427-0003', '2026-04-27 17:27:02', '2026-04-27 17:27:02'),
(10, 4, 3, NULL, 9, 'out', 1.000, 11.000, 10.000, 0.00, 'App\\Models\\Sale', 9, 'فاتورة INV-20260427-0005', '2026-04-27 17:28:35', '2026-04-27 17:28:35'),
(11, 4, 3, NULL, 9, 'out', 1.000, 10.000, 9.000, 0.00, 'App\\Models\\Sale', 10, 'فاتورة INV-20260427-0006', '2026-04-27 17:29:19', '2026-04-27 17:29:19'),
(12, 4, 3, NULL, 9, 'in', 1.000, 9.000, 10.000, 0.00, 'App\\Models\\Sale', 10, '[مرتجع] [مرتجع RTN-260427-8379] defective', '2026-04-27 17:36:48', '2026-04-27 17:36:48'),
(13, 4, 3, NULL, 9, 'in', 1.000, 10.000, 11.000, 0.00, 'App\\Models\\Sale', 10, '[حذف فاتورة] INV-20260427-0006', '2026-04-27 17:38:57', '2026-04-27 17:38:57'),
(14, 4, 3, NULL, 9, 'in', 1.000, 11.000, 12.000, 0.00, 'App\\Models\\Sale', 9, '[حذف فاتورة] INV-20260427-0005', '2026-04-27 17:39:01', '2026-04-27 17:39:01'),
(15, 4, 3, 1, 9, 'out', 1.000, 12.000, 11.000, 0.00, 'App\\Models\\Sale', 21, 'فاتورة INV-20260427-0007', '2026-04-27 18:01:26', '2026-04-27 18:01:26'),
(16, 4, 3, 1, 9, 'out', 1.000, 11.000, 10.000, 0.00, 'App\\Models\\Sale', 22, 'فاتورة INV-20260427-0008', '2026-04-27 18:02:20', '2026-04-27 18:02:20'),
(17, 4, 3, 1, 9, 'in', 1.000, 10.000, 11.000, 0.00, 'App\\Models\\Sale', 21, '[حذف فاتورة] INV-20260427-0007', '2026-04-27 18:03:00', '2026-04-27 18:03:00'),
(18, 4, 3, 1, 9, 'in', 1.000, 11.000, 12.000, 0.00, 'App\\Models\\Sale', 22, '[حذف فاتورة] INV-20260427-0008', '2026-04-27 18:54:12', '2026-04-27 18:54:12'),
(19, 4, 4, 1, 9, 'in', 1.000, 0.000, 1.000, 0.00, 'App\\Models\\Purchase', 4, 'استلام أمر شراء PO-20260427-0004', '2026-04-27 18:57:57', '2026-04-27 18:57:57'),
(20, 4, 4, 1, 9, 'out', 1.000, 1.000, 0.000, 0.00, 'App\\Models\\Sale', 23, 'فاتورة INV-20260427-0009', '2026-04-27 19:03:03', '2026-04-27 19:03:03'),
(21, 4, 4, NULL, 9, 'out', 1.000, 0.000, -1.000, 0.00, 'Sale', 23, 'مبيعات - فاتورة INV-20260427-0009', '2026-04-27 19:03:03', '2026-04-27 19:03:03'),
(22, 4, 4, NULL, 9, 'in', 10.000, -1.000, 9.000, 0.00, 'App\\Models\\Purchase', 5, 'استلام أمر شراء PO-20260428-0005', '2026-04-28 12:46:33', '2026-04-28 12:46:33'),
(23, 4, 4, 1, 9, 'adjustment', 0.000, 0.000, 9.000, 0.00, NULL, NULL, NULL, '2026-04-28 13:04:49', '2026-04-28 13:04:49'),
(24, 4, 4, 1, 9, 'out', 1.000, 9.000, 8.000, 0.00, 'App\\Models\\Sale', 29, 'فاتورة INV-20260428-0001', '2026-04-28 13:05:09', '2026-04-28 13:05:09'),
(25, 4, 4, NULL, 9, 'out', 1.000, 8.000, 7.000, 0.00, 'Sale', 29, 'مبيعات - فاتورة INV-20260428-0001', '2026-04-28 13:05:09', '2026-04-28 13:05:09'),
(26, 4, 4, NULL, 9, 'out', 1.000, 7.000, 6.000, 0.00, 'Sale', 29, 'مبيعات - فاتورة INV-20260428-0001', '2026-04-28 13:21:48', '2026-04-28 13:21:48');

-- --------------------------------------------------------

--
-- Table structure for table `stock_transfers`
--

CREATE TABLE `stock_transfers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `ref` varchar(255) NOT NULL,
  `from_warehouse_id` bigint(20) UNSIGNED NOT NULL,
  `to_warehouse_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `qty` decimal(12,3) NOT NULL,
  `status` enum('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subscriptions`
--

CREATE TABLE `subscriptions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `plan` enum('starter','professional','enterprise') NOT NULL,
  `billing_cycle` enum('monthly','quarterly','yearly') NOT NULL DEFAULT 'monthly',
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `currency` varchar(10) NOT NULL DEFAULT 'EGP',
  `payment_method` varchar(255) DEFAULT NULL,
  `payment_ref` varchar(255) DEFAULT NULL,
  `status` enum('active','cancelled','expired') NOT NULL DEFAULT 'active',
  `starts_at` timestamp NULL DEFAULT NULL,
  `ends_at` timestamp NULL DEFAULT NULL,
  `auto_renew` tinyint(1) NOT NULL DEFAULT 1,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `type` enum('company','individual') NOT NULL DEFAULT 'company',
  `status` enum('active','suspended','blocked') NOT NULL DEFAULT 'active',
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `street` varchar(255) DEFAULT NULL,
  `contact_person` varchar(150) DEFAULT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `tax_number` varchar(255) DEFAULT NULL,
  `payment_terms` varchar(255) DEFAULT NULL,
  `payment_method` enum('cash','bank_transfer','deferred') NOT NULL DEFAULT 'cash',
  `bank_name` varchar(150) DEFAULT NULL,
  `bank_account` varchar(100) DEFAULT NULL,
  `products_notes` text DEFAULT NULL,
  `balance` decimal(12,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `rating` tinyint(4) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `suppliers`
--

INSERT INTO `suppliers` (`id`, `company_id`, `name`, `code`, `type`, `status`, `email`, `phone`, `address`, `country`, `city`, `street`, `contact_person`, `contact_phone`, `tax_number`, `payment_terms`, `payment_method`, `bank_name`, `bank_account`, `products_notes`, `balance`, `notes`, `is_active`, `deleted_at`, `created_at`, `updated_at`, `rating`) VALUES
(1, 4, 'mahmoud', 'SUP-0001', 'company', 'active', NULL, '01146109626', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'cash', NULL, NULL, NULL, 0.00, NULL, 1, NULL, '2026-04-25 18:07:15', '2026-04-25 18:07:15', 0);

-- --------------------------------------------------------

--
-- Table structure for table `supplier_ledger`
--

CREATE TABLE `supplier_ledger` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `supplier_id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `type` enum('invoice','payment','return','adjustment') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `direction` enum('debit','credit') NOT NULL,
  `balance_after` decimal(15,2) NOT NULL DEFAULT 0.00,
  `reference` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `supplier_ledger`
--

INSERT INTO `supplier_ledger` (`id`, `supplier_id`, `company_id`, `type`, `amount`, `direction`, `balance_after`, `reference`, `notes`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 1, 4, 'invoice', 70000.00, 'debit', 70000.00, 'PO-20260427-0002', 'فاتورة شراء PO-20260427-0002', 9, '2026-04-27 11:06:01', '2026-04-27 11:06:01'),
(2, 1, 4, 'invoice', 75000.00, 'debit', 145000.00, 'PO-20260425-0001', 'فاتورة شراء PO-20260425-0001', 9, '2026-04-27 11:06:13', '2026-04-27 11:06:13'),
(3, 1, 4, 'invoice', 11.00, 'debit', 145011.00, 'PO-20260427-0003', 'فاتورة شراء PO-20260427-0003', 9, '2026-04-27 17:27:02', '2026-04-27 17:27:02'),
(4, 1, 4, 'invoice', 1.00, 'debit', 145012.00, 'PO-20260427-0004', 'فاتورة شراء PO-20260427-0004', 9, '2026-04-27 18:57:57', '2026-04-27 18:57:57'),
(5, 1, 4, 'invoice', 10.00, 'debit', 145022.00, 'PO-20260428-0005', 'فاتورة شراء PO-20260428-0005', 9, '2026-04-28 12:46:33', '2026-04-28 12:46:33');

-- --------------------------------------------------------

--
-- Table structure for table `support_tickets`
--

CREATE TABLE `support_tickets` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `ticket_number` varchar(255) DEFAULT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `admin_reply` text DEFAULT NULL,
  `priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `category` varchar(255) NOT NULL DEFAULT 'general',
  `status` enum('open','assigned','in_progress','waiting_user','resolved','closed') NOT NULL DEFAULT 'open',
  `is_escalated` tinyint(1) NOT NULL DEFAULT 0,
  `escalated_at` timestamp NULL DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `csat_rating` tinyint(3) UNSIGNED DEFAULT NULL,
  `first_response_at` timestamp NULL DEFAULT NULL,
  `response_time_hours` int(11) DEFAULT NULL,
  `attachments` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`attachments`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `sla_policy_id` bigint(20) UNSIGNED DEFAULT NULL,
  `sla_breached` tinyint(1) NOT NULL DEFAULT 0,
  `resolution_due_at` timestamp NULL DEFAULT NULL,
  `first_response_due_at` timestamp NULL DEFAULT NULL,
  `assigned_to` bigint(20) UNSIGNED DEFAULT NULL,
  `requester_id` bigint(20) UNSIGNED DEFAULT NULL,
  `service_id` bigint(20) UNSIGNED DEFAULT NULL,
  `form_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`form_data`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tags`
--

CREATE TABLE `tags` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `color` varchar(255) NOT NULL DEFAULT '#2E75B6',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tags`
--

INSERT INTO `tags` (`id`, `company_id`, `name`, `color`, `created_at`, `updated_at`) VALUES
(1, 4, 'عاجل', '#C55A11', '2026-05-07 19:19:37', '2026-05-07 19:19:37'),
(2, 4, 'مهم', '#C55A11', '2026-05-07 19:19:49', '2026-05-07 19:19:49');

-- --------------------------------------------------------

--
-- Table structure for table `tax_rates`
--

CREATE TABLE `tax_rates` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `rate` decimal(8,4) NOT NULL,
  `type` enum('percentage','fixed') NOT NULL DEFAULT 'percentage',
  `applies_to` enum('sales','purchases','both') NOT NULL DEFAULT 'both',
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ticket_attachments`
--

CREATE TABLE `ticket_attachments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `ticket_id` bigint(20) UNSIGNED NOT NULL,
  `uploaded_by` bigint(20) UNSIGNED NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `mime_type` varchar(255) DEFAULT NULL,
  `file_size` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ticket_logs`
--

CREATE TABLE `ticket_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `ticket_id` bigint(20) UNSIGNED NOT NULL,
  `done_by` bigint(20) UNSIGNED NOT NULL,
  `action` varchar(255) NOT NULL,
  `old_value` varchar(255) DEFAULT NULL,
  `new_value` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ticket_messages`
--

CREATE TABLE `ticket_messages` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `ticket_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `body` text NOT NULL,
  `sender_type` enum('company','admin') NOT NULL DEFAULT 'company',
  `attachments` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`attachments`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ticket_tags`
--

CREATE TABLE `ticket_tags` (
  `ticket_id` bigint(20) UNSIGNED NOT NULL,
  `tag_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `timesheets`
--

CREATE TABLE `timesheets` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `task_id` bigint(20) UNSIGNED DEFAULT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `date` date NOT NULL,
  `hours` decimal(5,2) NOT NULL,
  `description` text DEFAULT NULL,
  `is_billable` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `is_super_admin` tinyint(1) NOT NULL DEFAULT 0,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `two_factor_secret` text DEFAULT NULL,
  `two_factor_confirmed` tinyint(1) NOT NULL DEFAULT 0,
  `two_factor_enabled` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `company_id`, `name`, `email`, `phone`, `email_verified_at`, `password`, `is_active`, `last_login_at`, `is_super_admin`, `remember_token`, `created_at`, `updated_at`, `two_factor_secret`, `two_factor_confirmed`, `two_factor_enabled`) VALUES
(1, NULL, 'Super Admin', 'superadmin@codesphere.io', NULL, NULL, '$2y$12$VOk.kkw.CBftYz/sOi.2SuMvGlhwQm7anqOCmgozF9kTvTUq699CC', 1, '2026-05-07 18:59:09', 1, NULL, '2026-04-25 14:43:01', '2026-05-07 18:59:09', NULL, 0, 0),
(2, 1, 'Admin', 'admin@codesphere.io', NULL, NULL, '$2y$12$aeIAt8.1NCo6NTzqVQNtFulu/IhjAzmRnoHshnBpZkomODVEapHtu', 1, NULL, 0, NULL, '2026-04-25 14:43:01', '2026-04-25 14:43:01', NULL, 0, 0),
(3, 1, 'فاطمة محاسبة', 'fatma@codesphere.io', NULL, NULL, '$2y$12$8zTo6Pfi6Sv6OWvCxq07tOESaUJ/ubrDDZ6zdvQg3DPO8kFPetlWy', 1, NULL, 0, NULL, '2026-04-25 14:43:01', '2026-04-25 14:43:01', NULL, 0, 0),
(4, 1, 'محمد مخازن', 'mohamad@codesphere.io', NULL, NULL, '$2y$12$9TQmXCwGJ3So0qgMz.mCXOlfuFTBbb81LNojZFBtbLZYWEOVBZS4u', 1, NULL, 0, NULL, '2026-04-25 14:43:02', '2026-04-25 14:43:02', NULL, 0, 0),
(5, 1, 'سارة كاشير', 'sara@codesphere.io', NULL, NULL, '$2y$12$VMjaYwiyOVr7H7YPt4ToCeUa2ksMFGbDTR1keyMKnWP9wS80/v5RO', 1, NULL, 0, NULL, '2026-04-25 14:43:02', '2026-04-25 14:43:02', NULL, 0, 0),
(6, 1, 'خالد مبيعات', 'khaled@codesphere.io', NULL, NULL, '$2y$12$QskMhcrYM8LnM0vOAdLVYuKpx6Unnau57oyVl5F2VdfTJVHsMRj3.', 1, NULL, 0, NULL, '2026-04-25 14:43:02', '2026-04-25 14:43:02', NULL, 0, 0),
(8, 3, 'tarek', 'goher@gmail.com', NULL, NULL, '$2y$12$O71Hfplk8LiF.TqL.ujDMupHehsI9tz9IMA8cEaZppqT6w45vly0K', 1, '2026-05-07 18:58:36', 0, NULL, '2026-04-25 14:59:11', '2026-05-07 18:58:36', NULL, 0, 0),
(9, 4, 'goher', 'goher22@gmail.com', NULL, NULL, '$2y$12$AC0r8aNMrCmC41staEwS1eigAJNM5z3zMRGCbIqRM/jeuwMZg7MoO', 1, '2026-05-07 20:02:18', 0, NULL, '2026-04-25 15:23:11', '2026-05-07 20:02:18', 'RWC6RPQKEKJWFCBI', 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `vehicles`
--

CREATE TABLE `vehicles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `plate` varchar(255) NOT NULL,
  `type` varchar(255) DEFAULT NULL,
  `brand` varchar(255) DEFAULT NULL,
  `model` varchar(255) DEFAULT NULL,
  `year` smallint(5) UNSIGNED DEFAULT NULL,
  `odometer` double NOT NULL DEFAULT 0,
  `fuel_type` enum('petrol','diesel','electric','hybrid') NOT NULL DEFAULT 'petrol',
  `status` enum('available','in_use','maintenance','retired') NOT NULL DEFAULT 'available',
  `assigned_to` varchar(255) DEFAULT NULL,
  `next_service_date` date DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vehicle_logs`
--

CREATE TABLE `vehicle_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `vehicle_id` bigint(20) UNSIGNED NOT NULL,
  `type` enum('trip','maintenance','fuel','insurance','other') NOT NULL DEFAULT 'trip',
  `date` date NOT NULL,
  `description` text DEFAULT NULL,
  `odometer` double DEFAULT NULL,
  `cost` double NOT NULL DEFAULT 0,
  `driver` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vouchers`
--

CREATE TABLE `vouchers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `code` varchar(20) NOT NULL,
  `type` enum('percentage','fixed') NOT NULL DEFAULT 'percentage',
  `value` decimal(10,2) NOT NULL,
  `min_order` decimal(12,2) DEFAULT NULL,
  `max_uses` int(11) DEFAULT NULL,
  `uses_count` int(11) NOT NULL DEFAULT 0,
  `expires_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `warehouses`
--

CREATE TABLE `warehouses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `warehouses`
--

INSERT INTO `warehouses` (`id`, `company_id`, `name`, `location`, `address`, `is_default`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 4, 'المخزن الرائيسي', 'القاهره', NULL, 0, 1, '2026-04-25 18:08:18', '2026-04-25 18:08:18');

-- --------------------------------------------------------

--
-- Table structure for table `whatsapp_templates`
--

CREATE TABLE `whatsapp_templates` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `template_name` varchar(255) NOT NULL,
  `external_template_id` varchar(255) NOT NULL,
  `content` longtext NOT NULL,
  `variables` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`variables`)),
  `status` enum('approved','rejected','pending','disabled') NOT NULL DEFAULT 'pending',
  `category` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `work_centers`
--

CREATE TABLE `work_centers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `code` varchar(255) NOT NULL,
  `capacity` decimal(10,2) NOT NULL,
  `hourly_rate` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('active','inactive','maintenance') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `work_center_routings`
--

CREATE TABLE `work_center_routings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `work_center_id` bigint(20) UNSIGNED NOT NULL,
  `sequence` int(11) NOT NULL,
  `setup_time` decimal(10,2) NOT NULL DEFAULT 0.00,
  `operation_time` decimal(10,2) NOT NULL DEFAULT 0.00,
  `unit_time` decimal(10,2) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `work_orders`
--

CREATE TABLE `work_orders` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `qty_planned` double NOT NULL DEFAULT 1,
  `qty_produced` double NOT NULL DEFAULT 0,
  `planned_date` date DEFAULT NULL,
  `status` enum('draft','in_progress','done','cancelled') NOT NULL DEFAULT 'draft',
  `notes` text DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `accounts`
--
ALTER TABLE `accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `accounts_code_unique` (`code`),
  ADD KEY `accounts_parent_id_foreign` (`parent_id`),
  ADD KEY `idx_accounts_company_type` (`company_id`,`type`),
  ADD KEY `idx_accounts_company_active` (`company_id`,`is_active`),
  ADD KEY `accounts_company_id_type_index` (`company_id`,`type`),
  ADD KEY `accounts_company_id_is_active_index` (`company_id`,`is_active`);

--
-- Indexes for table `api_keys`
--
ALTER TABLE `api_keys`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `api_keys_key_hash_unique` (`key_hash`),
  ADD KEY `api_keys_company_id_foreign` (`company_id`),
  ADD KEY `api_keys_created_by_foreign` (`created_by`);

--
-- Indexes for table `applicants`
--
ALTER TABLE `applicants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `applicants_email_unique` (`email`),
  ADD KEY `applicants_company_id_pipeline_stage_index` (`company_id`,`pipeline_stage`),
  ADD KEY `applicants_company_id_job_id_index` (`company_id`,`job_id`),
  ADD KEY `applicants_email_company_id_index` (`email`,`company_id`),
  ADD KEY `applicants_company_id_index` (`company_id`),
  ADD KEY `applicants_job_id_index` (`job_id`),
  ADD KEY `applicants_pipeline_stage_index` (`pipeline_stage`),
  ADD KEY `applicants_applied_date_index` (`applied_date`);

--
-- Indexes for table `applicant_pipeline_history`
--
ALTER TABLE `applicant_pipeline_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `applicant_pipeline_history_changed_by_foreign` (`changed_by`),
  ADD KEY `applicant_pipeline_history_applicant_id_index` (`applicant_id`),
  ADD KEY `applicant_pipeline_history_changed_at_index` (`changed_at`);

--
-- Indexes for table `appraisals`
--
ALTER TABLE `appraisals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `appraisals_company_id_foreign` (`company_id`),
  ADD KEY `appraisals_employee_id_foreign` (`employee_id`);

--
-- Indexes for table `appraisal_360_feedback`
--
ALTER TABLE `appraisal_360_feedback`
  ADD PRIMARY KEY (`id`),
  ADD KEY `appraisal_360_feedback_company_id_index` (`company_id`),
  ADD KEY `appraisal_360_feedback_appraisal_id_index` (`appraisal_id`),
  ADD KEY `appraisal_360_feedback_from_employee_id_index` (`from_employee_id`),
  ADD KEY `appraisal_360_feedback_relation_index` (`relation`);

--
-- Indexes for table `appraisal_goals`
--
ALTER TABLE `appraisal_goals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `appraisal_goals_company_id_index` (`company_id`),
  ADD KEY `appraisal_goals_employee_id_index` (`employee_id`),
  ADD KEY `appraisal_goals_appraisal_id_index` (`appraisal_id`),
  ADD KEY `appraisal_goals_status_index` (`status`);

--
-- Indexes for table `appraisal_templates`
--
ALTER TABLE `appraisal_templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `appraisal_templates_company_id_index` (`company_id`);

--
-- Indexes for table `attendances`
--
ALTER TABLE `attendances`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `attendances_employee_id_date_unique` (`employee_id`,`date`),
  ADD KEY `attendances_company_id_status_index` (`company_id`,`status`),
  ADD KEY `idx_attendances_company_status` (`company_id`,`status`),
  ADD KEY `idx_attendances_emp_date` (`employee_id`,`date`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `audit_logs_company_id_created_at_index` (`company_id`,`created_at`),
  ADD KEY `idx_audit_company_action` (`company_id`,`action`),
  ADD KEY `idx_audit_user_date` (`user_id`,`created_at`);

--
-- Indexes for table `auto_assignment_rules`
--
ALTER TABLE `auto_assignment_rules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `auto_assignment_rules_company_id_foreign` (`company_id`),
  ADD KEY `auto_assignment_rules_assign_to_user_id_foreign` (`assign_to_user_id`);

--
-- Indexes for table `bank_accounts`
--
ALTER TABLE `bank_accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `bank_accounts_account_number_unique` (`account_number`),
  ADD KEY `bank_accounts_account_id_foreign` (`account_id`),
  ADD KEY `bank_accounts_company_id_status_index` (`company_id`,`status`);

--
-- Indexes for table `bank_reconciliations`
--
ALTER TABLE `bank_reconciliations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bank_reconciliations_bank_account_id_foreign` (`bank_account_id`),
  ADD KEY `bank_reconciliations_bank_statement_id_foreign` (`bank_statement_id`),
  ADD KEY `bank_reconciliations_reconciled_by_foreign` (`reconciled_by`),
  ADD KEY `bank_reconciliations_company_id_reconciliation_date_index` (`company_id`,`reconciliation_date`);

--
-- Indexes for table `bank_statements`
--
ALTER TABLE `bank_statements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bank_statements_company_id_foreign` (`company_id`),
  ADD KEY `bank_statements_account_id_foreign` (`account_id`),
  ADD KEY `bank_statements_journal_entry_id_foreign` (`journal_entry_id`);

--
-- Indexes for table `bank_statement_details`
--
ALTER TABLE `bank_statement_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bank_statement_details_bank_statement_id_foreign` (`bank_statement_id`),
  ADD KEY `bank_statement_details_status_matched_transaction_id_index` (`status`,`matched_transaction_id`);

--
-- Indexes for table `bi_custom_reports`
--
ALTER TABLE `bi_custom_reports`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `bi_custom_reports_slug_unique` (`slug`),
  ADD KEY `bi_custom_reports_company_id_foreign` (`company_id`),
  ADD KEY `bi_custom_reports_created_by_foreign` (`created_by`);

--
-- Indexes for table `bi_dashboards`
--
ALTER TABLE `bi_dashboards`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `bi_dashboards_slug_unique` (`slug`),
  ADD KEY `bi_dashboards_company_id_foreign` (`company_id`),
  ADD KEY `bi_dashboards_created_by_foreign` (`created_by`);

--
-- Indexes for table `bi_data_sync_queue`
--
ALTER TABLE `bi_data_sync_queue`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bi_data_sync_queue_company_id_foreign` (`company_id`);

--
-- Indexes for table `bi_drill_down_configs`
--
ALTER TABLE `bi_drill_down_configs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bi_drill_down_configs_company_id_foreign` (`company_id`),
  ADD KEY `bi_drill_down_configs_widget_id_foreign` (`widget_id`);

--
-- Indexes for table `bi_events`
--
ALTER TABLE `bi_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bi_events_company_id_foreign` (`company_id`),
  ADD KEY `bi_events_event_type_index` (`event_type`),
  ADD KEY `bi_events_occurred_at_index` (`occurred_at`);

--
-- Indexes for table `bi_kpi_data`
--
ALTER TABLE `bi_kpi_data`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `bi_kpi_data_company_id_kpi_metric_id_date_unique` (`company_id`,`kpi_metric_id`,`date`),
  ADD KEY `bi_kpi_data_kpi_metric_id_foreign` (`kpi_metric_id`),
  ADD KEY `bi_kpi_data_date_index` (`date`);

--
-- Indexes for table `bi_kpi_metrics`
--
ALTER TABLE `bi_kpi_metrics`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `bi_kpi_metrics_metric_key_unique` (`metric_key`),
  ADD KEY `bi_kpi_metrics_company_id_foreign` (`company_id`),
  ADD KEY `bi_kpi_metrics_metric_name_index` (`metric_name`);

--
-- Indexes for table `bi_predictions`
--
ALTER TABLE `bi_predictions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bi_predictions_company_id_foreign` (`company_id`),
  ADD KEY `bi_predictions_model_id_foreign` (`model_id`);

--
-- Indexes for table `bi_predictive_models`
--
ALTER TABLE `bi_predictive_models`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bi_predictive_models_company_id_foreign` (`company_id`);

--
-- Indexes for table `bi_report_executions`
--
ALTER TABLE `bi_report_executions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bi_report_executions_company_id_foreign` (`company_id`),
  ADD KEY `bi_report_executions_report_id_foreign` (`report_id`);

--
-- Indexes for table `bi_user_preferences`
--
ALTER TABLE `bi_user_preferences`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bi_user_preferences_company_id_foreign` (`company_id`),
  ADD KEY `bi_user_preferences_user_id_foreign` (`user_id`),
  ADD KEY `bi_user_preferences_default_dashboard_id_foreign` (`default_dashboard_id`);

--
-- Indexes for table `bi_widgets`
--
ALTER TABLE `bi_widgets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bi_widgets_company_id_foreign` (`company_id`),
  ADD KEY `bi_widgets_dashboard_id_foreign` (`dashboard_id`),
  ADD KEY `bi_widgets_widget_type_index` (`widget_type`);

--
-- Indexes for table `bom_items`
--
ALTER TABLE `bom_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bom_items_company_id_foreign` (`company_id`),
  ADD KEY `bom_items_product_id_foreign` (`product_id`),
  ADD KEY `bom_items_component_id_foreign` (`component_id`),
  ADD KEY `bom_items_parent_bom_id_foreign` (`parent_bom_id`);

--
-- Indexes for table `branches`
--
ALTER TABLE `branches`
  ADD PRIMARY KEY (`id`),
  ADD KEY `branches_company_id_foreign` (`company_id`);

--
-- Indexes for table `budgets`
--
ALTER TABLE `budgets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `budgets_company_id_account_id_month_year_unique` (`company_id`,`account_id`,`month`,`year`),
  ADD KEY `budgets_account_id_foreign` (`account_id`);

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_expiration_index` (`expiration`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_locks_expiration_index` (`expiration`);

--
-- Indexes for table `campaigns`
--
ALTER TABLE `campaigns`
  ADD PRIMARY KEY (`id`),
  ADD KEY `campaigns_contact_list_id_foreign` (`contact_list_id`),
  ADD KEY `campaigns_company_id_status_index` (`company_id`,`status`);

--
-- Indexes for table `candidates`
--
ALTER TABLE `candidates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `candidates_company_id_foreign` (`company_id`),
  ADD KEY `candidates_job_position_id_foreign` (`job_position_id`);

--
-- Indexes for table `canned_responses`
--
ALTER TABLE `canned_responses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `canned_responses_company_id_foreign` (`company_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `categories_company_id_foreign` (`company_id`),
  ADD KEY `categories_parent_id_foreign` (`parent_id`);

--
-- Indexes for table `channel_contacts`
--
ALTER TABLE `channel_contacts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cc_company_type_id_unique` (`company_id`,`channel_type`,`channel_identifier`),
  ADD KEY `channel_contacts_crm_contact_id_foreign` (`crm_contact_id`);

--
-- Indexes for table `channel_conversations`
--
ALTER TABLE `channel_conversations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `channel_conversations_external_conversation_id_unique` (`external_conversation_id`),
  ADD KEY `channel_conversations_company_id_foreign` (`company_id`),
  ADD KEY `channel_conversations_ticket_id_foreign` (`ticket_id`),
  ADD KEY `channel_conversations_assigned_agent_id_foreign` (`assigned_agent_id`);

--
-- Indexes for table `channel_integrations`
--
ALTER TABLE `channel_integrations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `channel_integrations_company_id_channel_type_unique` (`company_id`,`channel_type`),
  ADD KEY `channel_integrations_channel_type_index` (`channel_type`);

--
-- Indexes for table `channel_messages`
--
ALTER TABLE `channel_messages`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `channel_messages_external_message_id_unique` (`external_message_id`),
  ADD KEY `channel_messages_company_id_foreign` (`company_id`),
  ADD KEY `channel_messages_channel_integration_id_foreign` (`channel_integration_id`),
  ADD KEY `channel_messages_ticket_id_foreign` (`ticket_id`),
  ADD KEY `channel_messages_contact_id_foreign` (`contact_id`),
  ADD KEY `channel_messages_direction_index` (`direction`);

--
-- Indexes for table `channel_message_analytics`
--
ALTER TABLE `channel_message_analytics`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cma_company_type_date_unique` (`company_id`,`channel_type`,`date`);

--
-- Indexes for table `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `companies_email_unique` (`email`);

--
-- Indexes for table `company_holidays`
--
ALTER TABLE `company_holidays`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `company_holidays_company_id_holiday_date_unique` (`company_id`,`holiday_date`),
  ADD KEY `company_holidays_company_id_holiday_date_index` (`company_id`,`holiday_date`);

--
-- Indexes for table `company_settings`
--
ALTER TABLE `company_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `company_settings_company_id_unique` (`company_id`);

--
-- Indexes for table `crm_activities`
--
ALTER TABLE `crm_activities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `crm_activities_company_id_foreign` (`company_id`),
  ADD KEY `crm_activities_lead_id_foreign` (`lead_id`),
  ADD KEY `crm_activities_user_id_foreign` (`user_id`);

--
-- Indexes for table `crm_leads`
--
ALTER TABLE `crm_leads`
  ADD PRIMARY KEY (`id`),
  ADD KEY `crm_leads_stage_id_foreign` (`stage_id`),
  ADD KEY `crm_leads_assigned_to_foreign` (`assigned_to`),
  ADD KEY `crm_leads_customer_id_foreign` (`customer_id`),
  ADD KEY `crm_leads_company_id_stage_id_index` (`company_id`,`stage_id`),
  ADD KEY `crm_leads_company_id_assigned_to_index` (`company_id`,`assigned_to`);

--
-- Indexes for table `csat_ratings`
--
ALTER TABLE `csat_ratings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `csat_ratings_ticket_id_unique` (`ticket_id`),
  ADD UNIQUE KEY `csat_ratings_token_unique` (`token`),
  ADD KEY `csat_ratings_company_id_rated_at_index` (`company_id`,`rated_at`);

--
-- Indexes for table `currencies`
--
ALTER TABLE `currencies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `currencies_company_id_foreign` (`company_id`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_customers_company_active` (`company_id`,`is_active`),
  ADD KEY `idx_customers_company_date` (`company_id`,`created_at`),
  ADD KEY `customers_company_id_index` (`company_id`),
  ADD KEY `customers_name_index` (`name`);

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employees_user_id_foreign` (`user_id`),
  ADD KEY `employees_manager_id_foreign` (`manager_id`),
  ADD KEY `idx_employees_company_dept` (`company_id`,`department`),
  ADD KEY `employees_company_id_status_index` (`company_id`,`status`),
  ADD KEY `employees_company_id_department_index` (`company_id`,`department`);

--
-- Indexes for table `erp_notifications`
--
ALTER TABLE `erp_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `erp_notifications_user_id_read_at_index` (`user_id`,`read_at`),
  ADD KEY `erp_notifications_company_id_user_id_index` (`company_id`,`user_id`);

--
-- Indexes for table `escalation_rules`
--
ALTER TABLE `escalation_rules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `escalation_rules_company_id_foreign` (`company_id`),
  ADD KEY `escalation_rules_escalate_to_user_id_foreign` (`escalate_to_user_id`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `field_service_details`
--
ALTER TABLE `field_service_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `field_service_details_field_service_request_id_index` (`field_service_request_id`);

--
-- Indexes for table `field_service_reports`
--
ALTER TABLE `field_service_reports`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `field_service_reports_field_service_request_id_unique` (`field_service_request_id`),
  ADD KEY `field_service_reports_technician_id_foreign` (`technician_id`);

--
-- Indexes for table `field_service_requests`
--
ALTER TABLE `field_service_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `field_service_requests_reference_unique` (`reference`),
  ADD KEY `field_service_requests_customer_id_foreign` (`customer_id`),
  ADD KEY `field_service_requests_assigned_technician_id_foreign` (`assigned_technician_id`),
  ADD KEY `field_service_requests_company_id_status_scheduled_date_index` (`company_id`,`status`,`scheduled_date`);

--
-- Indexes for table `field_technicians`
--
ALTER TABLE `field_technicians`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `field_technicians_license_number_unique` (`license_number`),
  ADD KEY `field_technicians_employee_id_foreign` (`employee_id`),
  ADD KEY `field_technicians_company_id_status_index` (`company_id`,`status`);

--
-- Indexes for table `field_technician_ratings`
--
ALTER TABLE `field_technician_ratings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `field_technician_ratings_field_service_request_id_foreign` (`field_service_request_id`),
  ADD KEY `field_technician_ratings_customer_id_foreign` (`customer_id`),
  ADD KEY `field_technician_ratings_technician_id_index` (`technician_id`);

--
-- Indexes for table `field_technician_tracking`
--
ALTER TABLE `field_technician_tracking`
  ADD PRIMARY KEY (`id`),
  ADD KEY `field_technician_tracking_field_technician_id_timestamp_index` (`field_technician_id`,`timestamp`);

--
-- Indexes for table `fixed_assets`
--
ALTER TABLE `fixed_assets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fixed_assets_company_id_foreign` (`company_id`);

--
-- Indexes for table `fleet_trips`
--
ALTER TABLE `fleet_trips`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fleet_trips_company_id_vehicle_id_index` (`company_id`,`vehicle_id`);

--
-- Indexes for table `fuel_logs`
--
ALTER TABLE `fuel_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fuel_logs_company_id_foreign` (`company_id`),
  ADD KEY `fuel_logs_vehicle_id_foreign` (`vehicle_id`);

--
-- Indexes for table `helpdesk_workflows`
--
ALTER TABLE `helpdesk_workflows`
  ADD PRIMARY KEY (`id`),
  ADD KEY `helpdesk_workflows_company_id_index` (`company_id`);

--
-- Indexes for table `ip_whitelist_entries`
--
ALTER TABLE `ip_whitelist_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ip_whitelist_entries_company_id_foreign` (`company_id`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `job_positions`
--
ALTER TABLE `job_positions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `job_positions_company_id_foreign` (`company_id`);

--
-- Indexes for table `journal_entries`
--
ALTER TABLE `journal_entries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `journal_entries_ref_unique` (`ref`),
  ADD KEY `journal_entries_user_id_foreign` (`user_id`),
  ADD KEY `journal_entries_company_id_date_index` (`company_id`,`date`),
  ADD KEY `idx_journal_company_date` (`company_id`,`date`),
  ADD KEY `idx_journal_company_type` (`company_id`,`type`),
  ADD KEY `idx_journal_company_status` (`company_id`,`status`),
  ADD KEY `journal_entries_company_id_status_index` (`company_id`,`status`);

--
-- Indexes for table `journal_entry_lines`
--
ALTER TABLE `journal_entry_lines`
  ADD PRIMARY KEY (`id`),
  ADD KEY `journal_entry_lines_journal_entry_id_foreign` (`journal_entry_id`),
  ADD KEY `journal_entry_lines_account_id_foreign` (`account_id`);

--
-- Indexes for table `knowledge_articles`
--
ALTER TABLE `knowledge_articles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `knowledge_articles_company_id_foreign` (`company_id`),
  ADD KEY `knowledge_articles_created_by_foreign` (`created_by`);

--
-- Indexes for table `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leave_requests_employee_id_foreign` (`employee_id`),
  ADD KEY `leave_requests_approved_by_foreign` (`approved_by`),
  ADD KEY `leave_requests_company_id_status_index` (`company_id`,`status`);

--
-- Indexes for table `live_chat_agents`
--
ALTER TABLE `live_chat_agents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `live_chat_agents_company_id_foreign` (`company_id`),
  ADD KEY `live_chat_agents_user_id_foreign` (`user_id`);

--
-- Indexes for table `live_chat_analytics`
--
ALTER TABLE `live_chat_analytics`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `live_chat_analytics_company_id_date_unique` (`company_id`,`date`);

--
-- Indexes for table `live_chat_messages`
--
ALTER TABLE `live_chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `live_chat_messages_company_id_foreign` (`company_id`),
  ADD KEY `live_chat_messages_session_id_foreign` (`session_id`),
  ADD KEY `live_chat_messages_sender_id_foreign` (`sender_id`);

--
-- Indexes for table `live_chat_routing_rules`
--
ALTER TABLE `live_chat_routing_rules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `live_chat_routing_rules_company_id_foreign` (`company_id`);

--
-- Indexes for table `live_chat_sessions`
--
ALTER TABLE `live_chat_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `live_chat_sessions_session_token_unique` (`session_token`),
  ADD KEY `live_chat_sessions_company_id_foreign` (`company_id`),
  ADD KEY `live_chat_sessions_visitor_id_foreign` (`visitor_id`),
  ADD KEY `live_chat_sessions_agent_id_foreign` (`agent_id`);

--
-- Indexes for table `live_chat_visitors`
--
ALTER TABLE `live_chat_visitors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `live_chat_visitors_session_id_unique` (`session_id`),
  ADD KEY `live_chat_visitors_company_id_foreign` (`company_id`);

--
-- Indexes for table `mail_configs`
--
ALTER TABLE `mail_configs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `mail_configs_company_id_unique` (`company_id`);

--
-- Indexes for table `maintenance_records`
--
ALTER TABLE `maintenance_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `maintenance_records_company_id_vehicle_id_index` (`company_id`,`vehicle_id`);

--
-- Indexes for table `marketing_contacts`
--
ALTER TABLE `marketing_contacts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `marketing_contacts_list_id_foreign` (`list_id`),
  ADD KEY `marketing_contacts_company_id_foreign` (`company_id`);

--
-- Indexes for table `marketing_contact_lists`
--
ALTER TABLE `marketing_contact_lists`
  ADD PRIMARY KEY (`id`),
  ADD KEY `marketing_contact_lists_company_id_foreign` (`company_id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `model_has_permissions`
--
ALTER TABLE `model_has_permissions`
  ADD PRIMARY KEY (`permission_id`,`model_id`,`model_type`),
  ADD KEY `model_has_permissions_model_id_model_type_index` (`model_id`,`model_type`);

--
-- Indexes for table `model_has_roles`
--
ALTER TABLE `model_has_roles`
  ADD PRIMARY KEY (`role_id`,`model_id`,`model_type`),
  ADD KEY `model_has_roles_model_id_model_type_index` (`model_id`,`model_type`);

--
-- Indexes for table `notification_preferences`
--
ALTER TABLE `notification_preferences`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `notification_preferences_user_id_unique` (`user_id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `payment_gateway_configs`
--
ALTER TABLE `payment_gateway_configs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `payment_gateway_configs_company_id_unique` (`company_id`);

--
-- Indexes for table `payment_transactions`
--
ALTER TABLE `payment_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `payment_transactions_company_id_foreign` (`company_id`);

--
-- Indexes for table `payrolls`
--
ALTER TABLE `payrolls`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `payrolls_employee_id_month_year_unique` (`employee_id`,`month`,`year`),
  ADD KEY `payrolls_company_id_status_index` (`company_id`,`status`),
  ADD KEY `idx_payrolls_company_status` (`company_id`,`status`),
  ADD KEY `payrolls_company_id_year_month_index` (`company_id`,`year`,`month`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `permissions_name_guard_name_unique` (`name`,`guard_name`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Indexes for table `pipeline_stages`
--
ALTER TABLE `pipeline_stages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pipeline_stages_company_id_foreign` (`company_id`);

--
-- Indexes for table `portal_activity_logs`
--
ALTER TABLE `portal_activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `portal_activity_logs_company_id_foreign` (`company_id`),
  ADD KEY `portal_activity_logs_portal_user_id_foreign` (`portal_user_id`);

--
-- Indexes for table `portal_invoices`
--
ALTER TABLE `portal_invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `portal_invoices_invoice_number_unique` (`invoice_number`),
  ADD KEY `portal_invoices_company_id_foreign` (`company_id`),
  ADD KEY `portal_invoices_portal_user_id_foreign` (`portal_user_id`),
  ADD KEY `portal_invoices_portal_order_id_foreign` (`portal_order_id`);

--
-- Indexes for table `portal_knowledge_base`
--
ALTER TABLE `portal_knowledge_base`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `portal_knowledge_base_slug_unique` (`slug`),
  ADD KEY `portal_knowledge_base_company_id_foreign` (`company_id`);

--
-- Indexes for table `portal_orders`
--
ALTER TABLE `portal_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `portal_orders_order_number_unique` (`order_number`),
  ADD KEY `portal_orders_company_id_foreign` (`company_id`),
  ADD KEY `portal_orders_portal_user_id_foreign` (`portal_user_id`),
  ADD KEY `portal_orders_sale_id_foreign` (`sale_id`);

--
-- Indexes for table `portal_order_items`
--
ALTER TABLE `portal_order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `portal_order_items_company_id_foreign` (`company_id`),
  ADD KEY `portal_order_items_portal_order_id_foreign` (`portal_order_id`),
  ADD KEY `portal_order_items_product_id_foreign` (`product_id`);

--
-- Indexes for table `portal_payments`
--
ALTER TABLE `portal_payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `portal_payments_payment_reference_unique` (`payment_reference`),
  ADD KEY `portal_payments_company_id_foreign` (`company_id`),
  ADD KEY `portal_payments_portal_user_id_foreign` (`portal_user_id`),
  ADD KEY `portal_payments_portal_invoice_id_foreign` (`portal_invoice_id`);

--
-- Indexes for table `portal_settings`
--
ALTER TABLE `portal_settings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `portal_settings_company_id_foreign` (`company_id`);

--
-- Indexes for table `portal_tickets`
--
ALTER TABLE `portal_tickets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `portal_tickets_company_id_foreign` (`company_id`),
  ADD KEY `portal_tickets_portal_user_id_foreign` (`portal_user_id`),
  ADD KEY `portal_tickets_support_ticket_id_foreign` (`support_ticket_id`);

--
-- Indexes for table `portal_users`
--
ALTER TABLE `portal_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `portal_users_email_unique` (`email`),
  ADD KEY `portal_users_company_id_foreign` (`company_id`),
  ADD KEY `portal_users_crm_contact_id_foreign` (`crm_contact_id`);

--
-- Indexes for table `pos_shifts`
--
ALTER TABLE `pos_shifts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pos_shifts_user_id_foreign` (`user_id`),
  ADD KEY `pos_shifts_company_id_index` (`company_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `products_category_id_foreign` (`category_id`),
  ADD KEY `products_company_id_sku_index` (`company_id`,`sku`),
  ADD KEY `products_company_id_is_active_index` (`company_id`,`is_active`),
  ADD KEY `products_warehouse_id_foreign` (`warehouse_id`),
  ADD KEY `products_company_id_category_id_index` (`company_id`,`category_id`),
  ADD KEY `products_name_index` (`name`);

--
-- Indexes for table `product_locations`
--
ALTER TABLE `product_locations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `product_locations_product_id_warehouse_id_unique` (`product_id`,`warehouse_id`),
  ADD KEY `product_locations_company_id_foreign` (`company_id`),
  ADD KEY `product_locations_warehouse_id_foreign` (`warehouse_id`);

--
-- Indexes for table `product_lots`
--
ALTER TABLE `product_lots`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_lots_company_id_foreign` (`company_id`),
  ADD KEY `product_lots_product_id_foreign` (`product_id`);

--
-- Indexes for table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `projects_customer_id_foreign` (`customer_id`),
  ADD KEY `projects_manager_id_foreign` (`manager_id`),
  ADD KEY `projects_company_id_status_index` (`company_id`,`status`);

--
-- Indexes for table `project_tasks`
--
ALTER TABLE `project_tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `project_tasks_assigned_to_foreign` (`assigned_to`),
  ADD KEY `project_tasks_project_id_status_index` (`project_id`,`status`),
  ADD KEY `project_tasks_company_id_assigned_to_index` (`company_id`,`assigned_to`);

--
-- Indexes for table `purchases`
--
ALTER TABLE `purchases`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `purchases_po_number_unique` (`po_number`),
  ADD KEY `purchases_supplier_id_foreign` (`supplier_id`),
  ADD KEY `purchases_user_id_foreign` (`user_id`),
  ADD KEY `purchases_company_id_status_index` (`company_id`,`status`),
  ADD KEY `idx_purchases_company_date` (`company_id`,`created_at`),
  ADD KEY `purchases_company_id_created_at_index` (`company_id`,`created_at`);

--
-- Indexes for table `purchase_invoices`
--
ALTER TABLE `purchase_invoices`
  ADD PRIMARY KEY (`id`),
  ADD KEY `purchase_invoices_company_id_foreign` (`company_id`),
  ADD KEY `purchase_invoices_purchase_id_foreign` (`purchase_id`),
  ADD KEY `purchase_invoices_supplier_id_foreign` (`supplier_id`),
  ADD KEY `purchase_invoices_matched_by_foreign` (`matched_by`);

--
-- Indexes for table `purchase_items`
--
ALTER TABLE `purchase_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_purchase_items_purchase` (`purchase_id`),
  ADD KEY `idx_purchase_items_product` (`product_id`);

--
-- Indexes for table `recruitments`
--
ALTER TABLE `recruitments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `recruitments_company_id_index` (`company_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `roles_name_guard_name_unique` (`name`,`guard_name`);

--
-- Indexes for table `role_has_permissions`
--
ALTER TABLE `role_has_permissions`
  ADD PRIMARY KEY (`permission_id`,`role_id`),
  ADD KEY `role_has_permissions_role_id_foreign` (`role_id`);

--
-- Indexes for table `sales`
--
ALTER TABLE `sales`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sales_invoice_number_unique` (`invoice_number`),
  ADD KEY `sales_customer_id_foreign` (`customer_id`),
  ADD KEY `sales_user_id_foreign` (`user_id`),
  ADD KEY `sales_company_id_status_index` (`company_id`,`status`),
  ADD KEY `sales_company_id_created_at_index` (`company_id`,`created_at`),
  ADD KEY `sales_company_id_sale_date_index` (`company_id`,`sale_date`),
  ADD KEY `sales_company_id_payment_method_index` (`company_id`,`payment_method`);

--
-- Indexes for table `sale_items`
--
ALTER TABLE `sale_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sale_items_sale` (`sale_id`),
  ADD KEY `idx_sale_items_product` (`product_id`),
  ADD KEY `sale_items_warehouse_id_foreign` (`warehouse_id`);

--
-- Indexes for table `sale_payments`
--
ALTER TABLE `sale_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sale_payments_user_id_foreign` (`user_id`),
  ADD KEY `sale_payments_sale_id_created_at_index` (`sale_id`,`created_at`),
  ADD KEY `sale_payments_company_id_index` (`company_id`),
  ADD KEY `idx_sale_payments_sale` (`sale_id`);

--
-- Indexes for table `service_catalog`
--
ALTER TABLE `service_catalog`
  ADD PRIMARY KEY (`id`),
  ADD KEY `service_catalog_company_id_is_active_category_index` (`company_id`,`is_active`,`category`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `sla_policies`
--
ALTER TABLE `sla_policies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sla_policies_company_id_foreign` (`company_id`);

--
-- Indexes for table `sms_configs`
--
ALTER TABLE `sms_configs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sms_configs_company_id_unique` (`company_id`);

--
-- Indexes for table `sms_logs`
--
ALTER TABLE `sms_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sms_logs_company_id_foreign` (`company_id`),
  ADD KEY `sms_logs_sent_by_foreign` (`sent_by`);

--
-- Indexes for table `social_media_settings`
--
ALTER TABLE `social_media_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sms_company_platform_page_unique` (`company_id`,`platform`,`page_id`),
  ADD KEY `social_media_settings_platform_index` (`platform`);

--
-- Indexes for table `stock_movements`
--
ALTER TABLE `stock_movements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `stock_movements_product_id_foreign` (`product_id`),
  ADD KEY `stock_movements_user_id_foreign` (`user_id`),
  ADD KEY `stock_movements_company_id_product_id_index` (`company_id`,`product_id`),
  ADD KEY `stock_movements_reference_type_reference_id_index` (`reference_type`,`reference_id`),
  ADD KEY `idx_stock_company_type` (`company_id`,`type`),
  ADD KEY `idx_stock_company_date` (`company_id`,`created_at`),
  ADD KEY `idx_stock_reference` (`reference_type`,`reference_id`),
  ADD KEY `stock_movements_warehouse_id_foreign` (`warehouse_id`),
  ADD KEY `stock_movements_company_id_type_index` (`company_id`,`type`),
  ADD KEY `stock_movements_company_id_created_at_index` (`company_id`,`created_at`);

--
-- Indexes for table `stock_transfers`
--
ALTER TABLE `stock_transfers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `stock_transfers_ref_unique` (`ref`),
  ADD KEY `stock_transfers_company_id_foreign` (`company_id`),
  ADD KEY `stock_transfers_from_warehouse_id_foreign` (`from_warehouse_id`),
  ADD KEY `stock_transfers_to_warehouse_id_foreign` (`to_warehouse_id`),
  ADD KEY `stock_transfers_product_id_foreign` (`product_id`),
  ADD KEY `stock_transfers_user_id_foreign` (`user_id`);

--
-- Indexes for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `subscriptions_company_id_foreign` (`company_id`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_suppliers_company_active` (`company_id`,`is_active`),
  ADD KEY `suppliers_company_id_index` (`company_id`);

--
-- Indexes for table `supplier_ledger`
--
ALTER TABLE `supplier_ledger`
  ADD PRIMARY KEY (`id`),
  ADD KEY `supplier_ledger_supplier_id_foreign` (`supplier_id`),
  ADD KEY `supplier_ledger_company_id_foreign` (`company_id`),
  ADD KEY `supplier_ledger_created_by_foreign` (`created_by`);

--
-- Indexes for table `support_tickets`
--
ALTER TABLE `support_tickets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `support_tickets_ticket_number_unique` (`ticket_number`),
  ADD KEY `support_tickets_sla_policy_id_foreign` (`sla_policy_id`),
  ADD KEY `support_tickets_company_id_status_index` (`company_id`,`status`),
  ADD KEY `support_tickets_company_id_priority_index` (`company_id`,`priority`),
  ADD KEY `support_tickets_assigned_to_foreign` (`assigned_to`),
  ADD KEY `support_tickets_requester_id_foreign` (`requester_id`),
  ADD KEY `support_tickets_service_id_foreign` (`service_id`);

--
-- Indexes for table `tags`
--
ALTER TABLE `tags`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `tags_company_id_name_unique` (`company_id`,`name`);

--
-- Indexes for table `tax_rates`
--
ALTER TABLE `tax_rates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tax_rates_company_id_index` (`company_id`);

--
-- Indexes for table `ticket_attachments`
--
ALTER TABLE `ticket_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ticket_attachments_uploaded_by_foreign` (`uploaded_by`),
  ADD KEY `ticket_attachments_ticket_id_index` (`ticket_id`);

--
-- Indexes for table `ticket_logs`
--
ALTER TABLE `ticket_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ticket_logs_done_by_foreign` (`done_by`),
  ADD KEY `ticket_logs_ticket_id_created_at_index` (`ticket_id`,`created_at`);

--
-- Indexes for table `ticket_messages`
--
ALTER TABLE `ticket_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ticket_messages_ticket_id_foreign` (`ticket_id`),
  ADD KEY `ticket_messages_user_id_foreign` (`user_id`);

--
-- Indexes for table `ticket_tags`
--
ALTER TABLE `ticket_tags`
  ADD PRIMARY KEY (`ticket_id`,`tag_id`),
  ADD KEY `ticket_tags_tag_id_foreign` (`tag_id`);

--
-- Indexes for table `timesheets`
--
ALTER TABLE `timesheets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `timesheets_company_id_foreign` (`company_id`),
  ADD KEY `timesheets_task_id_foreign` (`task_id`),
  ADD KEY `timesheets_project_id_foreign` (`project_id`),
  ADD KEY `timesheets_user_id_foreign` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD KEY `users_company_id_foreign` (`company_id`);

--
-- Indexes for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vehicles_company_id_foreign` (`company_id`);

--
-- Indexes for table `vehicle_logs`
--
ALTER TABLE `vehicle_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vehicle_logs_company_id_foreign` (`company_id`),
  ADD KEY `vehicle_logs_vehicle_id_foreign` (`vehicle_id`);

--
-- Indexes for table `vouchers`
--
ALTER TABLE `vouchers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `vouchers_company_id_code_unique` (`company_id`,`code`),
  ADD KEY `vouchers_company_id_index` (`company_id`);

--
-- Indexes for table `warehouses`
--
ALTER TABLE `warehouses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `warehouses_company_id_foreign` (`company_id`);

--
-- Indexes for table `whatsapp_templates`
--
ALTER TABLE `whatsapp_templates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `whatsapp_templates_external_template_id_unique` (`external_template_id`),
  ADD KEY `whatsapp_templates_company_id_foreign` (`company_id`);

--
-- Indexes for table `work_centers`
--
ALTER TABLE `work_centers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `work_centers_name_unique` (`name`),
  ADD UNIQUE KEY `work_centers_code_unique` (`code`),
  ADD KEY `work_centers_company_id_status_index` (`company_id`,`status`);

--
-- Indexes for table `work_center_routings`
--
ALTER TABLE `work_center_routings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `work_center_routings_company_id_foreign` (`company_id`),
  ADD KEY `work_center_routings_work_center_id_foreign` (`work_center_id`),
  ADD KEY `work_center_routings_product_id_sequence_index` (`product_id`,`sequence`);

--
-- Indexes for table `work_orders`
--
ALTER TABLE `work_orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `work_orders_company_id_foreign` (`company_id`),
  ADD KEY `work_orders_product_id_foreign` (`product_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `accounts`
--
ALTER TABLE `accounts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=76;

--
-- AUTO_INCREMENT for table `api_keys`
--
ALTER TABLE `api_keys`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `applicants`
--
ALTER TABLE `applicants`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `applicant_pipeline_history`
--
ALTER TABLE `applicant_pipeline_history`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `appraisals`
--
ALTER TABLE `appraisals`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `appraisal_360_feedback`
--
ALTER TABLE `appraisal_360_feedback`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `appraisal_goals`
--
ALTER TABLE `appraisal_goals`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `appraisal_templates`
--
ALTER TABLE `appraisal_templates`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `attendances`
--
ALTER TABLE `attendances`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `auto_assignment_rules`
--
ALTER TABLE `auto_assignment_rules`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bank_accounts`
--
ALTER TABLE `bank_accounts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bank_reconciliations`
--
ALTER TABLE `bank_reconciliations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bank_statements`
--
ALTER TABLE `bank_statements`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bank_statement_details`
--
ALTER TABLE `bank_statement_details`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bi_custom_reports`
--
ALTER TABLE `bi_custom_reports`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bi_dashboards`
--
ALTER TABLE `bi_dashboards`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bi_data_sync_queue`
--
ALTER TABLE `bi_data_sync_queue`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bi_drill_down_configs`
--
ALTER TABLE `bi_drill_down_configs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bi_events`
--
ALTER TABLE `bi_events`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bi_kpi_data`
--
ALTER TABLE `bi_kpi_data`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bi_kpi_metrics`
--
ALTER TABLE `bi_kpi_metrics`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bi_predictions`
--
ALTER TABLE `bi_predictions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bi_predictive_models`
--
ALTER TABLE `bi_predictive_models`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bi_report_executions`
--
ALTER TABLE `bi_report_executions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bi_user_preferences`
--
ALTER TABLE `bi_user_preferences`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bi_widgets`
--
ALTER TABLE `bi_widgets`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bom_items`
--
ALTER TABLE `bom_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `branches`
--
ALTER TABLE `branches`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `budgets`
--
ALTER TABLE `budgets`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `campaigns`
--
ALTER TABLE `campaigns`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `candidates`
--
ALTER TABLE `candidates`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `canned_responses`
--
ALTER TABLE `canned_responses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `channel_contacts`
--
ALTER TABLE `channel_contacts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `channel_conversations`
--
ALTER TABLE `channel_conversations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `channel_integrations`
--
ALTER TABLE `channel_integrations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `channel_messages`
--
ALTER TABLE `channel_messages`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `channel_message_analytics`
--
ALTER TABLE `channel_message_analytics`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `companies`
--
ALTER TABLE `companies`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `company_holidays`
--
ALTER TABLE `company_holidays`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `company_settings`
--
ALTER TABLE `company_settings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `crm_activities`
--
ALTER TABLE `crm_activities`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `crm_leads`
--
ALTER TABLE `crm_leads`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `csat_ratings`
--
ALTER TABLE `csat_ratings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `currencies`
--
ALTER TABLE `currencies`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `erp_notifications`
--
ALTER TABLE `erp_notifications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `escalation_rules`
--
ALTER TABLE `escalation_rules`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `field_service_details`
--
ALTER TABLE `field_service_details`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `field_service_reports`
--
ALTER TABLE `field_service_reports`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `field_service_requests`
--
ALTER TABLE `field_service_requests`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `field_technicians`
--
ALTER TABLE `field_technicians`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `field_technician_ratings`
--
ALTER TABLE `field_technician_ratings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `field_technician_tracking`
--
ALTER TABLE `field_technician_tracking`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `fixed_assets`
--
ALTER TABLE `fixed_assets`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `fleet_trips`
--
ALTER TABLE `fleet_trips`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `fuel_logs`
--
ALTER TABLE `fuel_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `helpdesk_workflows`
--
ALTER TABLE `helpdesk_workflows`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ip_whitelist_entries`
--
ALTER TABLE `ip_whitelist_entries`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `job_positions`
--
ALTER TABLE `job_positions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `journal_entries`
--
ALTER TABLE `journal_entries`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `journal_entry_lines`
--
ALTER TABLE `journal_entry_lines`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `knowledge_articles`
--
ALTER TABLE `knowledge_articles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `leave_requests`
--
ALTER TABLE `leave_requests`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `live_chat_agents`
--
ALTER TABLE `live_chat_agents`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `live_chat_analytics`
--
ALTER TABLE `live_chat_analytics`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `live_chat_messages`
--
ALTER TABLE `live_chat_messages`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `live_chat_routing_rules`
--
ALTER TABLE `live_chat_routing_rules`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `live_chat_sessions`
--
ALTER TABLE `live_chat_sessions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `live_chat_visitors`
--
ALTER TABLE `live_chat_visitors`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `mail_configs`
--
ALTER TABLE `mail_configs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `maintenance_records`
--
ALTER TABLE `maintenance_records`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `marketing_contacts`
--
ALTER TABLE `marketing_contacts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `marketing_contact_lists`
--
ALTER TABLE `marketing_contact_lists`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=102;

--
-- AUTO_INCREMENT for table `notification_preferences`
--
ALTER TABLE `notification_preferences`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `payment_gateway_configs`
--
ALTER TABLE `payment_gateway_configs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payment_transactions`
--
ALTER TABLE `payment_transactions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payrolls`
--
ALTER TABLE `payrolls`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `pipeline_stages`
--
ALTER TABLE `pipeline_stages`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `portal_activity_logs`
--
ALTER TABLE `portal_activity_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `portal_invoices`
--
ALTER TABLE `portal_invoices`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `portal_knowledge_base`
--
ALTER TABLE `portal_knowledge_base`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `portal_orders`
--
ALTER TABLE `portal_orders`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `portal_order_items`
--
ALTER TABLE `portal_order_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `portal_payments`
--
ALTER TABLE `portal_payments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `portal_settings`
--
ALTER TABLE `portal_settings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `portal_tickets`
--
ALTER TABLE `portal_tickets`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `portal_users`
--
ALTER TABLE `portal_users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pos_shifts`
--
ALTER TABLE `pos_shifts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `product_locations`
--
ALTER TABLE `product_locations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `product_lots`
--
ALTER TABLE `product_lots`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `project_tasks`
--
ALTER TABLE `project_tasks`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `purchases`
--
ALTER TABLE `purchases`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `purchase_invoices`
--
ALTER TABLE `purchase_invoices`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `purchase_items`
--
ALTER TABLE `purchase_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `recruitments`
--
ALTER TABLE `recruitments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `sales`
--
ALTER TABLE `sales`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `sale_items`
--
ALTER TABLE `sale_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `sale_payments`
--
ALTER TABLE `sale_payments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `service_catalog`
--
ALTER TABLE `service_catalog`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `sla_policies`
--
ALTER TABLE `sla_policies`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sms_configs`
--
ALTER TABLE `sms_configs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sms_logs`
--
ALTER TABLE `sms_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `social_media_settings`
--
ALTER TABLE `social_media_settings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stock_movements`
--
ALTER TABLE `stock_movements`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `stock_transfers`
--
ALTER TABLE `stock_transfers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subscriptions`
--
ALTER TABLE `subscriptions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `supplier_ledger`
--
ALTER TABLE `supplier_ledger`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `support_tickets`
--
ALTER TABLE `support_tickets`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tags`
--
ALTER TABLE `tags`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `tax_rates`
--
ALTER TABLE `tax_rates`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ticket_attachments`
--
ALTER TABLE `ticket_attachments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ticket_logs`
--
ALTER TABLE `ticket_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ticket_messages`
--
ALTER TABLE `ticket_messages`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `timesheets`
--
ALTER TABLE `timesheets`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `vehicles`
--
ALTER TABLE `vehicles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vehicle_logs`
--
ALTER TABLE `vehicle_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vouchers`
--
ALTER TABLE `vouchers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `warehouses`
--
ALTER TABLE `warehouses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `whatsapp_templates`
--
ALTER TABLE `whatsapp_templates`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `work_centers`
--
ALTER TABLE `work_centers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `work_center_routings`
--
ALTER TABLE `work_center_routings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `work_orders`
--
ALTER TABLE `work_orders`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `accounts`
--
ALTER TABLE `accounts`
  ADD CONSTRAINT `accounts_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `accounts_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `api_keys`
--
ALTER TABLE `api_keys`
  ADD CONSTRAINT `api_keys_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `api_keys_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `applicants`
--
ALTER TABLE `applicants`
  ADD CONSTRAINT `applicants_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `applicants_job_id_foreign` FOREIGN KEY (`job_id`) REFERENCES `recruitments` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `applicant_pipeline_history`
--
ALTER TABLE `applicant_pipeline_history`
  ADD CONSTRAINT `applicant_pipeline_history_applicant_id_foreign` FOREIGN KEY (`applicant_id`) REFERENCES `applicants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `applicant_pipeline_history_changed_by_foreign` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `appraisals`
--
ALTER TABLE `appraisals`
  ADD CONSTRAINT `appraisals_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appraisals_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `appraisal_360_feedback`
--
ALTER TABLE `appraisal_360_feedback`
  ADD CONSTRAINT `appraisal_360_feedback_appraisal_id_foreign` FOREIGN KEY (`appraisal_id`) REFERENCES `appraisals` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appraisal_360_feedback_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appraisal_360_feedback_from_employee_id_foreign` FOREIGN KEY (`from_employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `appraisal_goals`
--
ALTER TABLE `appraisal_goals`
  ADD CONSTRAINT `appraisal_goals_appraisal_id_foreign` FOREIGN KEY (`appraisal_id`) REFERENCES `appraisals` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appraisal_goals_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appraisal_goals_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `appraisal_templates`
--
ALTER TABLE `appraisal_templates`
  ADD CONSTRAINT `appraisal_templates_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `attendances`
--
ALTER TABLE `attendances`
  ADD CONSTRAINT `attendances_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `attendances_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `audit_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `auto_assignment_rules`
--
ALTER TABLE `auto_assignment_rules`
  ADD CONSTRAINT `auto_assignment_rules_assign_to_user_id_foreign` FOREIGN KEY (`assign_to_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `auto_assignment_rules_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bank_accounts`
--
ALTER TABLE `bank_accounts`
  ADD CONSTRAINT `bank_accounts_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`),
  ADD CONSTRAINT `bank_accounts_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bank_reconciliations`
--
ALTER TABLE `bank_reconciliations`
  ADD CONSTRAINT `bank_reconciliations_bank_account_id_foreign` FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bank_reconciliations_bank_statement_id_foreign` FOREIGN KEY (`bank_statement_id`) REFERENCES `bank_statements` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bank_reconciliations_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bank_reconciliations_reconciled_by_foreign` FOREIGN KEY (`reconciled_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `bank_statements`
--
ALTER TABLE `bank_statements`
  ADD CONSTRAINT `bank_statements_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bank_statements_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bank_statements_journal_entry_id_foreign` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `bank_statement_details`
--
ALTER TABLE `bank_statement_details`
  ADD CONSTRAINT `bank_statement_details_bank_statement_id_foreign` FOREIGN KEY (`bank_statement_id`) REFERENCES `bank_statements` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bi_custom_reports`
--
ALTER TABLE `bi_custom_reports`
  ADD CONSTRAINT `bi_custom_reports_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bi_custom_reports_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bi_dashboards`
--
ALTER TABLE `bi_dashboards`
  ADD CONSTRAINT `bi_dashboards_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bi_dashboards_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bi_data_sync_queue`
--
ALTER TABLE `bi_data_sync_queue`
  ADD CONSTRAINT `bi_data_sync_queue_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bi_drill_down_configs`
--
ALTER TABLE `bi_drill_down_configs`
  ADD CONSTRAINT `bi_drill_down_configs_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bi_drill_down_configs_widget_id_foreign` FOREIGN KEY (`widget_id`) REFERENCES `bi_widgets` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bi_events`
--
ALTER TABLE `bi_events`
  ADD CONSTRAINT `bi_events_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bi_kpi_data`
--
ALTER TABLE `bi_kpi_data`
  ADD CONSTRAINT `bi_kpi_data_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bi_kpi_data_kpi_metric_id_foreign` FOREIGN KEY (`kpi_metric_id`) REFERENCES `bi_kpi_metrics` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bi_kpi_metrics`
--
ALTER TABLE `bi_kpi_metrics`
  ADD CONSTRAINT `bi_kpi_metrics_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bi_predictions`
--
ALTER TABLE `bi_predictions`
  ADD CONSTRAINT `bi_predictions_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bi_predictions_model_id_foreign` FOREIGN KEY (`model_id`) REFERENCES `bi_predictive_models` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bi_predictive_models`
--
ALTER TABLE `bi_predictive_models`
  ADD CONSTRAINT `bi_predictive_models_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bi_report_executions`
--
ALTER TABLE `bi_report_executions`
  ADD CONSTRAINT `bi_report_executions_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bi_report_executions_report_id_foreign` FOREIGN KEY (`report_id`) REFERENCES `bi_custom_reports` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bi_user_preferences`
--
ALTER TABLE `bi_user_preferences`
  ADD CONSTRAINT `bi_user_preferences_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bi_user_preferences_default_dashboard_id_foreign` FOREIGN KEY (`default_dashboard_id`) REFERENCES `bi_dashboards` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `bi_user_preferences_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bi_widgets`
--
ALTER TABLE `bi_widgets`
  ADD CONSTRAINT `bi_widgets_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bi_widgets_dashboard_id_foreign` FOREIGN KEY (`dashboard_id`) REFERENCES `bi_dashboards` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bom_items`
--
ALTER TABLE `bom_items`
  ADD CONSTRAINT `bom_items_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bom_items_component_id_foreign` FOREIGN KEY (`component_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bom_items_parent_bom_id_foreign` FOREIGN KEY (`parent_bom_id`) REFERENCES `bom_items` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bom_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `branches`
--
ALTER TABLE `branches`
  ADD CONSTRAINT `branches_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `budgets`
--
ALTER TABLE `budgets`
  ADD CONSTRAINT `budgets_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `budgets_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `campaigns`
--
ALTER TABLE `campaigns`
  ADD CONSTRAINT `campaigns_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `campaigns_contact_list_id_foreign` FOREIGN KEY (`contact_list_id`) REFERENCES `marketing_contact_lists` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `candidates`
--
ALTER TABLE `candidates`
  ADD CONSTRAINT `candidates_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `candidates_job_position_id_foreign` FOREIGN KEY (`job_position_id`) REFERENCES `job_positions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `canned_responses`
--
ALTER TABLE `canned_responses`
  ADD CONSTRAINT `canned_responses_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `categories_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `channel_contacts`
--
ALTER TABLE `channel_contacts`
  ADD CONSTRAINT `channel_contacts_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `channel_contacts_crm_contact_id_foreign` FOREIGN KEY (`crm_contact_id`) REFERENCES `crm_leads` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `channel_conversations`
--
ALTER TABLE `channel_conversations`
  ADD CONSTRAINT `channel_conversations_assigned_agent_id_foreign` FOREIGN KEY (`assigned_agent_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `channel_conversations_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `channel_conversations_ticket_id_foreign` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `channel_integrations`
--
ALTER TABLE `channel_integrations`
  ADD CONSTRAINT `channel_integrations_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `channel_messages`
--
ALTER TABLE `channel_messages`
  ADD CONSTRAINT `channel_messages_channel_integration_id_foreign` FOREIGN KEY (`channel_integration_id`) REFERENCES `channel_integrations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `channel_messages_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `channel_messages_contact_id_foreign` FOREIGN KEY (`contact_id`) REFERENCES `channel_contacts` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `channel_messages_ticket_id_foreign` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `channel_message_analytics`
--
ALTER TABLE `channel_message_analytics`
  ADD CONSTRAINT `channel_message_analytics_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `company_holidays`
--
ALTER TABLE `company_holidays`
  ADD CONSTRAINT `company_holidays_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `company_settings`
--
ALTER TABLE `company_settings`
  ADD CONSTRAINT `company_settings_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `crm_activities`
--
ALTER TABLE `crm_activities`
  ADD CONSTRAINT `crm_activities_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `crm_activities_lead_id_foreign` FOREIGN KEY (`lead_id`) REFERENCES `crm_leads` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `crm_activities_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `crm_leads`
--
ALTER TABLE `crm_leads`
  ADD CONSTRAINT `crm_leads_assigned_to_foreign` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `crm_leads_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `crm_leads_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `crm_leads_stage_id_foreign` FOREIGN KEY (`stage_id`) REFERENCES `pipeline_stages` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `csat_ratings`
--
ALTER TABLE `csat_ratings`
  ADD CONSTRAINT `csat_ratings_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `csat_ratings_ticket_id_foreign` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `currencies`
--
ALTER TABLE `currencies`
  ADD CONSTRAINT `currencies_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `customers`
--
ALTER TABLE `customers`
  ADD CONSTRAINT `customers_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `employees`
--
ALTER TABLE `employees`
  ADD CONSTRAINT `employees_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `employees_manager_id_foreign` FOREIGN KEY (`manager_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `employees_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `erp_notifications`
--
ALTER TABLE `erp_notifications`
  ADD CONSTRAINT `erp_notifications_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `erp_notifications_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `escalation_rules`
--
ALTER TABLE `escalation_rules`
  ADD CONSTRAINT `escalation_rules_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `escalation_rules_escalate_to_user_id_foreign` FOREIGN KEY (`escalate_to_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `field_service_details`
--
ALTER TABLE `field_service_details`
  ADD CONSTRAINT `field_service_details_field_service_request_id_foreign` FOREIGN KEY (`field_service_request_id`) REFERENCES `field_service_requests` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `field_service_reports`
--
ALTER TABLE `field_service_reports`
  ADD CONSTRAINT `field_service_reports_field_service_request_id_foreign` FOREIGN KEY (`field_service_request_id`) REFERENCES `field_service_requests` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `field_service_reports_technician_id_foreign` FOREIGN KEY (`technician_id`) REFERENCES `field_technicians` (`id`);

--
-- Constraints for table `field_service_requests`
--
ALTER TABLE `field_service_requests`
  ADD CONSTRAINT `field_service_requests_assigned_technician_id_foreign` FOREIGN KEY (`assigned_technician_id`) REFERENCES `field_technicians` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `field_service_requests_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `field_service_requests_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`);

--
-- Constraints for table `field_technicians`
--
ALTER TABLE `field_technicians`
  ADD CONSTRAINT `field_technicians_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `field_technicians_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `field_technician_ratings`
--
ALTER TABLE `field_technician_ratings`
  ADD CONSTRAINT `field_technician_ratings_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `field_technician_ratings_field_service_request_id_foreign` FOREIGN KEY (`field_service_request_id`) REFERENCES `field_service_requests` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `field_technician_ratings_technician_id_foreign` FOREIGN KEY (`technician_id`) REFERENCES `field_technicians` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `field_technician_tracking`
--
ALTER TABLE `field_technician_tracking`
  ADD CONSTRAINT `field_technician_tracking_field_technician_id_foreign` FOREIGN KEY (`field_technician_id`) REFERENCES `field_technicians` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `fixed_assets`
--
ALTER TABLE `fixed_assets`
  ADD CONSTRAINT `fixed_assets_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `fuel_logs`
--
ALTER TABLE `fuel_logs`
  ADD CONSTRAINT `fuel_logs_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fuel_logs_vehicle_id_foreign` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ip_whitelist_entries`
--
ALTER TABLE `ip_whitelist_entries`
  ADD CONSTRAINT `ip_whitelist_entries_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `job_positions`
--
ALTER TABLE `job_positions`
  ADD CONSTRAINT `job_positions_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `journal_entries`
--
ALTER TABLE `journal_entries`
  ADD CONSTRAINT `journal_entries_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `journal_entries_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `journal_entry_lines`
--
ALTER TABLE `journal_entry_lines`
  ADD CONSTRAINT `journal_entry_lines_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`),
  ADD CONSTRAINT `journal_entry_lines_journal_entry_id_foreign` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `knowledge_articles`
--
ALTER TABLE `knowledge_articles`
  ADD CONSTRAINT `knowledge_articles_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `knowledge_articles_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD CONSTRAINT `leave_requests_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `leave_requests_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `leave_requests_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `live_chat_agents`
--
ALTER TABLE `live_chat_agents`
  ADD CONSTRAINT `live_chat_agents_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `live_chat_agents_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `live_chat_analytics`
--
ALTER TABLE `live_chat_analytics`
  ADD CONSTRAINT `live_chat_analytics_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `live_chat_messages`
--
ALTER TABLE `live_chat_messages`
  ADD CONSTRAINT `live_chat_messages_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `live_chat_messages_sender_id_foreign` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `live_chat_messages_session_id_foreign` FOREIGN KEY (`session_id`) REFERENCES `live_chat_sessions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `live_chat_routing_rules`
--
ALTER TABLE `live_chat_routing_rules`
  ADD CONSTRAINT `live_chat_routing_rules_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `live_chat_sessions`
--
ALTER TABLE `live_chat_sessions`
  ADD CONSTRAINT `live_chat_sessions_agent_id_foreign` FOREIGN KEY (`agent_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `live_chat_sessions_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `live_chat_sessions_visitor_id_foreign` FOREIGN KEY (`visitor_id`) REFERENCES `live_chat_visitors` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `live_chat_visitors`
--
ALTER TABLE `live_chat_visitors`
  ADD CONSTRAINT `live_chat_visitors_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `marketing_contacts`
--
ALTER TABLE `marketing_contacts`
  ADD CONSTRAINT `marketing_contacts_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `marketing_contacts_list_id_foreign` FOREIGN KEY (`list_id`) REFERENCES `marketing_contact_lists` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `marketing_contact_lists`
--
ALTER TABLE `marketing_contact_lists`
  ADD CONSTRAINT `marketing_contact_lists_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `model_has_permissions`
--
ALTER TABLE `model_has_permissions`
  ADD CONSTRAINT `model_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `model_has_roles`
--
ALTER TABLE `model_has_roles`
  ADD CONSTRAINT `model_has_roles_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notification_preferences`
--
ALTER TABLE `notification_preferences`
  ADD CONSTRAINT `notification_preferences_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payment_gateway_configs`
--
ALTER TABLE `payment_gateway_configs`
  ADD CONSTRAINT `payment_gateway_configs_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payment_transactions`
--
ALTER TABLE `payment_transactions`
  ADD CONSTRAINT `payment_transactions_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payrolls`
--
ALTER TABLE `payrolls`
  ADD CONSTRAINT `payrolls_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payrolls_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`);

--
-- Constraints for table `pipeline_stages`
--
ALTER TABLE `pipeline_stages`
  ADD CONSTRAINT `pipeline_stages_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `portal_activity_logs`
--
ALTER TABLE `portal_activity_logs`
  ADD CONSTRAINT `portal_activity_logs_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `portal_activity_logs_portal_user_id_foreign` FOREIGN KEY (`portal_user_id`) REFERENCES `portal_users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `portal_invoices`
--
ALTER TABLE `portal_invoices`
  ADD CONSTRAINT `portal_invoices_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `portal_invoices_portal_order_id_foreign` FOREIGN KEY (`portal_order_id`) REFERENCES `portal_orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `portal_invoices_portal_user_id_foreign` FOREIGN KEY (`portal_user_id`) REFERENCES `portal_users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `portal_knowledge_base`
--
ALTER TABLE `portal_knowledge_base`
  ADD CONSTRAINT `portal_knowledge_base_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `portal_orders`
--
ALTER TABLE `portal_orders`
  ADD CONSTRAINT `portal_orders_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `portal_orders_portal_user_id_foreign` FOREIGN KEY (`portal_user_id`) REFERENCES `portal_users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `portal_orders_sale_id_foreign` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `portal_order_items`
--
ALTER TABLE `portal_order_items`
  ADD CONSTRAINT `portal_order_items_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `portal_order_items_portal_order_id_foreign` FOREIGN KEY (`portal_order_id`) REFERENCES `portal_orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `portal_order_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `portal_payments`
--
ALTER TABLE `portal_payments`
  ADD CONSTRAINT `portal_payments_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `portal_payments_portal_invoice_id_foreign` FOREIGN KEY (`portal_invoice_id`) REFERENCES `portal_invoices` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `portal_payments_portal_user_id_foreign` FOREIGN KEY (`portal_user_id`) REFERENCES `portal_users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `portal_settings`
--
ALTER TABLE `portal_settings`
  ADD CONSTRAINT `portal_settings_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `portal_tickets`
--
ALTER TABLE `portal_tickets`
  ADD CONSTRAINT `portal_tickets_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `portal_tickets_portal_user_id_foreign` FOREIGN KEY (`portal_user_id`) REFERENCES `portal_users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `portal_tickets_support_ticket_id_foreign` FOREIGN KEY (`support_ticket_id`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `portal_users`
--
ALTER TABLE `portal_users`
  ADD CONSTRAINT `portal_users_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `portal_users_crm_contact_id_foreign` FOREIGN KEY (`crm_contact_id`) REFERENCES `crm_leads` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `pos_shifts`
--
ALTER TABLE `pos_shifts`
  ADD CONSTRAINT `pos_shifts_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pos_shifts_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `products_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `products_warehouse_id_foreign` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `product_locations`
--
ALTER TABLE `product_locations`
  ADD CONSTRAINT `product_locations_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `product_locations_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `product_locations_warehouse_id_foreign` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `product_lots`
--
ALTER TABLE `product_lots`
  ADD CONSTRAINT `product_lots_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `product_lots_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `projects`
--
ALTER TABLE `projects`
  ADD CONSTRAINT `projects_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `projects_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `projects_manager_id_foreign` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `project_tasks`
--
ALTER TABLE `project_tasks`
  ADD CONSTRAINT `project_tasks_assigned_to_foreign` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `project_tasks_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `project_tasks_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `purchases`
--
ALTER TABLE `purchases`
  ADD CONSTRAINT `purchases_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `purchases_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `purchases_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `purchase_invoices`
--
ALTER TABLE `purchase_invoices`
  ADD CONSTRAINT `purchase_invoices_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `purchase_invoices_matched_by_foreign` FOREIGN KEY (`matched_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `purchase_invoices_purchase_id_foreign` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `purchase_invoices_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `purchase_items`
--
ALTER TABLE `purchase_items`
  ADD CONSTRAINT `purchase_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `purchase_items_purchase_id_foreign` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `recruitments`
--
ALTER TABLE `recruitments`
  ADD CONSTRAINT `recruitments_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `role_has_permissions`
--
ALTER TABLE `role_has_permissions`
  ADD CONSTRAINT `role_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `role_has_permissions_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `sales`
--
ALTER TABLE `sales`
  ADD CONSTRAINT `sales_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `sales_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `sales_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `sale_items`
--
ALTER TABLE `sale_items`
  ADD CONSTRAINT `sale_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `sale_items_sale_id_foreign` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `sale_items_warehouse_id_foreign` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `sale_payments`
--
ALTER TABLE `sale_payments`
  ADD CONSTRAINT `sale_payments_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `sale_payments_sale_id_foreign` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `sale_payments_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `service_catalog`
--
ALTER TABLE `service_catalog`
  ADD CONSTRAINT `service_catalog_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `sla_policies`
--
ALTER TABLE `sla_policies`
  ADD CONSTRAINT `sla_policies_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `sms_configs`
--
ALTER TABLE `sms_configs`
  ADD CONSTRAINT `sms_configs_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `sms_logs`
--
ALTER TABLE `sms_logs`
  ADD CONSTRAINT `sms_logs_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `sms_logs_sent_by_foreign` FOREIGN KEY (`sent_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `social_media_settings`
--
ALTER TABLE `social_media_settings`
  ADD CONSTRAINT `social_media_settings_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stock_movements`
--
ALTER TABLE `stock_movements`
  ADD CONSTRAINT `stock_movements_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `stock_movements_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `stock_movements_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `stock_movements_warehouse_id_foreign` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `stock_transfers`
--
ALTER TABLE `stock_transfers`
  ADD CONSTRAINT `stock_transfers_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `stock_transfers_from_warehouse_id_foreign` FOREIGN KEY (`from_warehouse_id`) REFERENCES `warehouses` (`id`),
  ADD CONSTRAINT `stock_transfers_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  ADD CONSTRAINT `stock_transfers_to_warehouse_id_foreign` FOREIGN KEY (`to_warehouse_id`) REFERENCES `warehouses` (`id`),
  ADD CONSTRAINT `stock_transfers_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD CONSTRAINT `subscriptions_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD CONSTRAINT `suppliers_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `supplier_ledger`
--
ALTER TABLE `supplier_ledger`
  ADD CONSTRAINT `supplier_ledger_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `supplier_ledger_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `supplier_ledger_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `support_tickets`
--
ALTER TABLE `support_tickets`
  ADD CONSTRAINT `support_tickets_assigned_to_foreign` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `support_tickets_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `support_tickets_requester_id_foreign` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `support_tickets_service_id_foreign` FOREIGN KEY (`service_id`) REFERENCES `service_catalog` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `support_tickets_sla_policy_id_foreign` FOREIGN KEY (`sla_policy_id`) REFERENCES `sla_policies` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `tags`
--
ALTER TABLE `tags`
  ADD CONSTRAINT `tags_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ticket_attachments`
--
ALTER TABLE `ticket_attachments`
  ADD CONSTRAINT `ticket_attachments_ticket_id_foreign` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ticket_attachments_uploaded_by_foreign` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ticket_logs`
--
ALTER TABLE `ticket_logs`
  ADD CONSTRAINT `ticket_logs_done_by_foreign` FOREIGN KEY (`done_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ticket_logs_ticket_id_foreign` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ticket_messages`
--
ALTER TABLE `ticket_messages`
  ADD CONSTRAINT `ticket_messages_ticket_id_foreign` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ticket_messages_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ticket_tags`
--
ALTER TABLE `ticket_tags`
  ADD CONSTRAINT `ticket_tags_tag_id_foreign` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ticket_tags_ticket_id_foreign` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `timesheets`
--
ALTER TABLE `timesheets`
  ADD CONSTRAINT `timesheets_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `timesheets_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `timesheets_task_id_foreign` FOREIGN KEY (`task_id`) REFERENCES `project_tasks` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `timesheets_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD CONSTRAINT `vehicles_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `vehicle_logs`
--
ALTER TABLE `vehicle_logs`
  ADD CONSTRAINT `vehicle_logs_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `vehicle_logs_vehicle_id_foreign` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `vouchers`
--
ALTER TABLE `vouchers`
  ADD CONSTRAINT `vouchers_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `warehouses`
--
ALTER TABLE `warehouses`
  ADD CONSTRAINT `warehouses_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `whatsapp_templates`
--
ALTER TABLE `whatsapp_templates`
  ADD CONSTRAINT `whatsapp_templates_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `work_centers`
--
ALTER TABLE `work_centers`
  ADD CONSTRAINT `work_centers_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `work_center_routings`
--
ALTER TABLE `work_center_routings`
  ADD CONSTRAINT `work_center_routings_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `work_center_routings_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `work_center_routings_work_center_id_foreign` FOREIGN KEY (`work_center_id`) REFERENCES `work_centers` (`id`);

--
-- Constraints for table `work_orders`
--
ALTER TABLE `work_orders`
  ADD CONSTRAINT `work_orders_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `work_orders_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
