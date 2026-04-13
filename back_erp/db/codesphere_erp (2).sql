-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 13, 2026 at 05:54 PM
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

INSERT INTO `accounts` (`id`, `company_id`, `code`, `name`, `name_en`, `type`, `tax_type`, `normal_balance`, `balance`, `parent_id`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 2, '1000', 'الأصول', NULL, 'asset', NULL, 'debit', 0.00, NULL, 1, '2026-04-08 19:45:54', '2026-04-08 19:45:54'),
(2, 2, '2000', 'الخصوم', NULL, 'liability', NULL, 'credit', 0.00, NULL, 1, '2026-04-08 19:45:54', '2026-04-08 19:45:54'),
(3, 2, '3000', 'حقوق الملكية', NULL, 'equity', NULL, 'credit', 0.00, NULL, 1, '2026-04-08 19:45:54', '2026-04-08 19:45:54'),
(4, 2, '4000', 'الإيرادات', NULL, 'revenue', NULL, 'credit', 0.00, NULL, 1, '2026-04-08 19:45:54', '2026-04-08 19:45:54'),
(5, 2, '5000', 'المصاريف', NULL, 'expense', NULL, 'debit', 0.00, NULL, 1, '2026-04-08 19:45:54', '2026-04-08 19:45:54'),
(6, 2, '1100', 'الأصول المتداولة', NULL, 'asset', NULL, 'debit', 0.00, 1, 1, '2026-04-08 19:45:54', '2026-04-08 19:45:54'),
(7, 2, '1101', 'النقدية بالصندوق', NULL, 'asset', NULL, 'debit', 0.00, 6, 1, '2026-04-08 19:45:54', '2026-04-08 19:45:54'),
(8, 2, '1102', 'البنك', NULL, 'asset', NULL, 'debit', 0.00, 6, 1, '2026-04-08 19:45:54', '2026-04-08 19:45:54'),
(9, 2, '1103', 'المدينون', NULL, 'asset', NULL, 'debit', 0.00, 6, 1, '2026-04-08 19:45:54', '2026-04-08 19:45:54'),
(10, 2, '1200', 'المخزون', NULL, 'asset', NULL, 'debit', 205000.00, 1, 1, '2026-04-08 19:45:54', '2026-04-11 20:26:19'),
(11, 2, '1300', 'الأصول الثابتة', NULL, 'asset', NULL, 'debit', 0.00, 1, 1, '2026-04-08 19:45:54', '2026-04-08 19:45:54'),
(12, 2, '2100', 'الخصوم المتداولة', NULL, 'liability', NULL, 'credit', 0.00, 2, 1, '2026-04-08 19:45:54', '2026-04-08 19:45:54'),
(13, 2, '2101', 'الموردون', NULL, 'liability', NULL, 'credit', 205000.00, 12, 1, '2026-04-08 19:45:54', '2026-04-11 20:26:19'),
(14, 2, '2102', 'مصاريف مستحقة', NULL, 'liability', NULL, 'credit', 0.00, 12, 1, '2026-04-08 19:45:54', '2026-04-08 19:45:54'),
(15, 2, '2103', 'ضريبة القيمة المضافة', NULL, 'liability', NULL, 'credit', 0.00, 12, 1, '2026-04-08 19:45:54', '2026-04-08 19:45:54'),
(16, 2, '3001', 'رأس المال', NULL, 'equity', NULL, 'credit', 0.00, 3, 1, '2026-04-08 19:45:54', '2026-04-08 19:45:54'),
(17, 2, '3002', 'الأرباح المحتجزة', NULL, 'equity', NULL, 'credit', 0.00, 3, 1, '2026-04-08 19:45:54', '2026-04-08 19:45:54'),
(18, 2, '4001', 'إيرادات المبيعات', NULL, 'revenue', NULL, 'credit', 0.00, 4, 1, '2026-04-08 19:45:54', '2026-04-08 19:45:54'),
(19, 2, '4002', 'إيرادات أخرى', NULL, 'revenue', NULL, 'credit', 0.00, 4, 1, '2026-04-08 19:45:54', '2026-04-08 19:45:54'),
(20, 2, '5001', 'تكلفة البضاعة', NULL, 'expense', NULL, 'debit', 0.00, 5, 1, '2026-04-08 19:45:54', '2026-04-08 19:45:54'),
(21, 2, '5002', 'مصاريف الإيجار', NULL, 'expense', NULL, 'debit', 0.00, 5, 1, '2026-04-08 19:45:54', '2026-04-08 19:45:54'),
(22, 2, '5003', 'مصاريف الرواتب', NULL, 'expense', NULL, 'debit', 0.00, 5, 1, '2026-04-08 19:45:54', '2026-04-08 19:45:54'),
(23, 2, '5004', 'مصاريف إدارية', NULL, 'expense', NULL, 'debit', 0.00, 5, 1, '2026-04-08 19:45:54', '2026-04-08 19:45:54'),
(24, 2, '5005', 'مصاريف تسويق', NULL, 'expense', NULL, 'debit', 0.00, 5, 1, '2026-04-08 19:45:54', '2026-04-08 19:45:54');

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
-- Table structure for table `appraisals`
--

CREATE TABLE `appraisals` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `period` varchar(255) NOT NULL,
  `score` double NOT NULL DEFAULT 0,
  `rating` enum('excellent','good','average','poor') NOT NULL DEFAULT 'average',
  `reviewer` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attendances`
--

CREATE TABLE `attendances` (
  `id` bigint(20) UNSIGNED NOT NULL,
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
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `branches`
--

CREATE TABLE `branches` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `is_main` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  `name` varchar(255) NOT NULL,
  `category` varchar(255) DEFAULT NULL,
  `body` text NOT NULL,
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
(1, 1, NULL, 'saas', 'product', NULL, '2026-04-08 17:53:18', '2026-04-08 17:53:18'),
(2, 1, NULL, 'ezz', 'product', NULL, '2026-04-08 19:41:16', '2026-04-08 19:41:16'),
(3, 2, NULL, 'elctronic', 'product', NULL, '2026-04-08 19:47:04', '2026-04-08 19:47:04'),
(4, 2, NULL, 'saas', 'product', NULL, '2026-04-08 20:55:23', '2026-04-08 20:55:23'),
(5, 2, NULL, 'apple', 'product', NULL, '2026-04-10 17:21:20', '2026-04-10 17:21:20'),
(6, 2, NULL, 'apple', 'product', NULL, '2026-04-11 20:25:28', '2026-04-11 20:25:28');

-- --------------------------------------------------------

--
-- Table structure for table `companies`
--

CREATE TABLE `companies` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `company_type` varchar(255) DEFAULT NULL,
  `country` varchar(255) NOT NULL DEFAULT 'مصر',
  `phone` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
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

INSERT INTO `companies` (`id`, `name`, `company_type`, `country`, `phone`, `email`, `logo`, `status`, `plan`, `subscription_plan`, `is_active`, `db_name`, `settings`, `trial_ends_at`, `subscription_ends_at`, `deleted_at`, `created_at`, `updated_at`) VALUES
(1, 'شركة CodeSphere التجريبية', NULL, 'مصر', '01000000000', 'demo@codesphere.io', NULL, 'active', 'enterprise', 'starter', 0, NULL, NULL, NULL, NULL, NULL, '2026-04-08 17:38:06', '2026-04-08 17:38:06'),
(2, 'goher', NULL, 'مصر', '101010101010', 'goher@gmail.com', NULL, 'active', 'professional', 'starter', 0, NULL, NULL, NULL, NULL, NULL, '2026-04-08 19:45:54', '2026-04-08 19:45:54');

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
-- Table structure for table `currencies`
--

CREATE TABLE `currencies` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `code` varchar(10) NOT NULL,
  `name` varchar(255) NOT NULL,
  `rate` decimal(12,6) NOT NULL DEFAULT 1.000000,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
(1, 2, 'ezz', NULL, NULL, NULL, NULL, 0.00, 0.00, 0, NULL, 1, NULL, '2026-04-08 19:49:29', '2026-04-08 19:49:29'),
(2, 2, 'ezz', NULL, NULL, NULL, NULL, 0.00, 0.00, 0, NULL, 1, NULL, '2026-04-08 20:22:46', '2026-04-08 20:22:46'),
(3, 2, 'saas', NULL, NULL, NULL, NULL, 0.00, 0.00, 0, NULL, 1, NULL, '2026-04-09 10:31:15', '2026-04-09 10:31:15'),
(4, 2, 'tarek', NULL, NULL, NULL, NULL, 0.00, 0.00, 0, NULL, 1, NULL, '2026-04-09 18:20:42', '2026-04-09 18:20:42'),
(5, 2, 'samer', NULL, NULL, NULL, NULL, 0.00, 0.00, 0, NULL, 1, NULL, '2026-04-09 19:06:08', '2026-04-09 19:06:08'),
(6, 2, 'mona', NULL, NULL, NULL, NULL, 0.00, 0.00, 0, NULL, 1, NULL, '2026-04-11 21:16:53', '2026-04-11 21:16:53');

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
(1, 2, 'saas', 'sas', 'saas', 2000.00, '322232', 'saas@s.com', '2026-04-10', 'active', NULL, NULL, NULL, NULL, '2026-04-10 12:17:36', '2026-04-10 12:17:36');

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

-- --------------------------------------------------------

--
-- Table structure for table `escalation_rules`
--

CREATE TABLE `escalation_rules` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
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
-- Table structure for table `fixed_assets`
--

CREATE TABLE `fixed_assets` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(255) DEFAULT NULL,
  `purchase_value` decimal(14,2) NOT NULL,
  `salvage_value` decimal(14,2) NOT NULL DEFAULT 0.00,
  `depreciation_rate` decimal(5,2) NOT NULL DEFAULT 0.00,
  `depreciation_method` enum('straight_line','declining_balance') NOT NULL DEFAULT 'straight_line',
  `purchase_date` date NOT NULL,
  `useful_life_years` int(11) NOT NULL DEFAULT 5,
  `accumulated_depreciation` decimal(14,2) NOT NULL DEFAULT 0.00,
  `book_value` decimal(14,2) GENERATED ALWAYS AS (`purchase_value` - `accumulated_depreciation`) STORED,
  `status` enum('active','disposed','under_maintenance') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

--
-- Dumping data for table `jobs`
--

INSERT INTO `jobs` (`id`, `queue`, `payload`, `attempts`, `reserved_at`, `available_at`, `created_at`) VALUES
(4, 'default', '{\"uuid\":\"c9ecbc32-81c4-4897-a3be-52da33166cfb\",\"displayName\":\"App\\\\Listeners\\\\SendSaleNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Events\\\\CallQueuedListener\",\"command\":\"O:36:\\\"Illuminate\\\\Events\\\\CallQueuedListener\\\":26:{s:5:\\\"class\\\";s:34:\\\"App\\\\Listeners\\\\SendSaleNotification\\\";s:6:\\\"method\\\";s:6:\\\"handle\\\";s:4:\\\"data\\\";a:1:{i:0;O:22:\\\"App\\\\Events\\\\SaleCreated\\\":1:{s:4:\\\"sale\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\Sale\\\";s:2:\\\"id\\\";i:5;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}}}s:5:\\\"tries\\\";N;s:13:\\\"maxExceptions\\\";N;s:7:\\\"backoff\\\";N;s:10:\\\"retryUntil\\\";N;s:7:\\\"timeout\\\";N;s:13:\\\"failOnTimeout\\\";b:0;s:17:\\\"shouldBeEncrypted\\\";b:0;s:14:\\\"shouldBeUnique\\\";b:0;s:29:\\\"shouldBeUniqueUntilProcessing\\\";b:0;s:8:\\\"uniqueId\\\";N;s:9:\\\"uniqueFor\\\";N;s:3:\\\"job\\\";N;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775688879,\"delay\":null}', 0, NULL, 1775688879, 1775688879),
(5, 'default', '{\"uuid\":\"b205ce2a-3861-4145-b0a5-d7dc227425a7\",\"displayName\":\"App\\\\Listeners\\\\SendSaleNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Events\\\\CallQueuedListener\",\"command\":\"O:36:\\\"Illuminate\\\\Events\\\\CallQueuedListener\\\":26:{s:5:\\\"class\\\";s:34:\\\"App\\\\Listeners\\\\SendSaleNotification\\\";s:6:\\\"method\\\";s:6:\\\"handle\\\";s:4:\\\"data\\\";a:1:{i:0;O:22:\\\"App\\\\Events\\\\SaleCreated\\\":1:{s:4:\\\"sale\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\Sale\\\";s:2:\\\"id\\\";i:6;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}}}s:5:\\\"tries\\\";N;s:13:\\\"maxExceptions\\\";N;s:7:\\\"backoff\\\";N;s:10:\\\"retryUntil\\\";N;s:7:\\\"timeout\\\";N;s:13:\\\"failOnTimeout\\\";b:0;s:17:\\\"shouldBeEncrypted\\\";b:0;s:14:\\\"shouldBeUnique\\\";b:0;s:29:\\\"shouldBeUniqueUntilProcessing\\\";b:0;s:8:\\\"uniqueId\\\";N;s:9:\\\"uniqueFor\\\";N;s:3:\\\"job\\\";N;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775737891,\"delay\":null}', 0, NULL, 1775737891, 1775737891),
(6, 'default', '{\"uuid\":\"cfec59ba-5a0b-467f-add0-8ad0f6e3567d\",\"displayName\":\"App\\\\Listeners\\\\SendSaleNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Events\\\\CallQueuedListener\",\"command\":\"O:36:\\\"Illuminate\\\\Events\\\\CallQueuedListener\\\":26:{s:5:\\\"class\\\";s:34:\\\"App\\\\Listeners\\\\SendSaleNotification\\\";s:6:\\\"method\\\";s:6:\\\"handle\\\";s:4:\\\"data\\\";a:1:{i:0;O:22:\\\"App\\\\Events\\\\SaleCreated\\\":1:{s:4:\\\"sale\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\Sale\\\";s:2:\\\"id\\\";i:7;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}}}s:5:\\\"tries\\\";N;s:13:\\\"maxExceptions\\\";N;s:7:\\\"backoff\\\";N;s:10:\\\"retryUntil\\\";N;s:7:\\\"timeout\\\";N;s:13:\\\"failOnTimeout\\\";b:0;s:17:\\\"shouldBeEncrypted\\\";b:0;s:14:\\\"shouldBeUnique\\\";b:0;s:29:\\\"shouldBeUniqueUntilProcessing\\\";b:0;s:8:\\\"uniqueId\\\";N;s:9:\\\"uniqueFor\\\";N;s:3:\\\"job\\\";N;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775766007,\"delay\":null}', 0, NULL, 1775766007, 1775766007),
(7, 'default', '{\"uuid\":\"570f29d3-dcaf-4cf7-8c4b-3625c3ef5b1f\",\"displayName\":\"App\\\\Listeners\\\\SendSaleNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Events\\\\CallQueuedListener\",\"command\":\"O:36:\\\"Illuminate\\\\Events\\\\CallQueuedListener\\\":26:{s:5:\\\"class\\\";s:34:\\\"App\\\\Listeners\\\\SendSaleNotification\\\";s:6:\\\"method\\\";s:6:\\\"handle\\\";s:4:\\\"data\\\";a:1:{i:0;O:22:\\\"App\\\\Events\\\\SaleCreated\\\":1:{s:4:\\\"sale\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\Sale\\\";s:2:\\\"id\\\";i:8;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}}}s:5:\\\"tries\\\";N;s:13:\\\"maxExceptions\\\";N;s:7:\\\"backoff\\\";N;s:10:\\\"retryUntil\\\";N;s:7:\\\"timeout\\\";N;s:13:\\\"failOnTimeout\\\";b:0;s:17:\\\"shouldBeEncrypted\\\";b:0;s:14:\\\"shouldBeUnique\\\";b:0;s:29:\\\"shouldBeUniqueUntilProcessing\\\";b:0;s:8:\\\"uniqueId\\\";N;s:9:\\\"uniqueFor\\\";N;s:3:\\\"job\\\";N;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775766054,\"delay\":null}', 0, NULL, 1775766054, 1775766054),
(8, 'default', '{\"uuid\":\"dcef70f3-63d9-4138-99df-c2b29af48c68\",\"displayName\":\"App\\\\Listeners\\\\SendSaleNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Events\\\\CallQueuedListener\",\"command\":\"O:36:\\\"Illuminate\\\\Events\\\\CallQueuedListener\\\":26:{s:5:\\\"class\\\";s:34:\\\"App\\\\Listeners\\\\SendSaleNotification\\\";s:6:\\\"method\\\";s:6:\\\"handle\\\";s:4:\\\"data\\\";a:1:{i:0;O:22:\\\"App\\\\Events\\\\SaleCreated\\\":1:{s:4:\\\"sale\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\Sale\\\";s:2:\\\"id\\\";i:15;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}}}s:5:\\\"tries\\\";N;s:13:\\\"maxExceptions\\\";N;s:7:\\\"backoff\\\";N;s:10:\\\"retryUntil\\\";N;s:7:\\\"timeout\\\";N;s:13:\\\"failOnTimeout\\\";b:0;s:17:\\\"shouldBeEncrypted\\\";b:0;s:14:\\\"shouldBeUnique\\\";b:0;s:29:\\\"shouldBeUniqueUntilProcessing\\\";b:0;s:8:\\\"uniqueId\\\";N;s:9:\\\"uniqueFor\\\";N;s:3:\\\"job\\\";N;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775829918,\"delay\":null}', 0, NULL, 1775829918, 1775829918),
(9, 'default', '{\"uuid\":\"043352f5-20bb-4634-b236-c79d8bd51302\",\"displayName\":\"App\\\\Jobs\\\\ProcessMonthlyPayrollJob\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":3,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":300,\"retryUntil\":null,\"data\":{\"commandName\":\"App\\\\Jobs\\\\ProcessMonthlyPayrollJob\",\"command\":\"O:33:\\\"App\\\\Jobs\\\\ProcessMonthlyPayrollJob\\\":3:{s:40:\\\"\\u0000App\\\\Jobs\\\\ProcessMonthlyPayrollJob\\u0000month\\\";i:5;s:39:\\\"\\u0000App\\\\Jobs\\\\ProcessMonthlyPayrollJob\\u0000year\\\";i:2026;s:44:\\\"\\u0000App\\\\Jobs\\\\ProcessMonthlyPayrollJob\\u0000companyId\\\";i:2;}\",\"batchId\":null},\"createdAt\":1775830812,\"delay\":null}', 0, NULL, 1775830812, 1775830812),
(10, 'default', '{\"uuid\":\"abb49ba9-1551-479a-b2c1-e095815e47f6\",\"displayName\":\"App\\\\Jobs\\\\ProcessMonthlyPayrollJob\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":3,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":300,\"retryUntil\":null,\"data\":{\"commandName\":\"App\\\\Jobs\\\\ProcessMonthlyPayrollJob\",\"command\":\"O:33:\\\"App\\\\Jobs\\\\ProcessMonthlyPayrollJob\\\":3:{s:40:\\\"\\u0000App\\\\Jobs\\\\ProcessMonthlyPayrollJob\\u0000month\\\";i:4;s:39:\\\"\\u0000App\\\\Jobs\\\\ProcessMonthlyPayrollJob\\u0000year\\\";i:2026;s:44:\\\"\\u0000App\\\\Jobs\\\\ProcessMonthlyPayrollJob\\u0000companyId\\\";i:2;}\",\"batchId\":null},\"createdAt\":1775830816,\"delay\":null}', 0, NULL, 1775830816, 1775830816),
(11, 'default', '{\"uuid\":\"b846ecb0-aa3f-4544-a8c4-57fb7e13063a\",\"displayName\":\"App\\\\Listeners\\\\SendSaleNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Events\\\\CallQueuedListener\",\"command\":\"O:36:\\\"Illuminate\\\\Events\\\\CallQueuedListener\\\":26:{s:5:\\\"class\\\";s:34:\\\"App\\\\Listeners\\\\SendSaleNotification\\\";s:6:\\\"method\\\";s:6:\\\"handle\\\";s:4:\\\"data\\\";a:1:{i:0;O:22:\\\"App\\\\Events\\\\SaleCreated\\\":1:{s:4:\\\"sale\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\Sale\\\";s:2:\\\"id\\\";i:17;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}}}s:5:\\\"tries\\\";N;s:13:\\\"maxExceptions\\\";N;s:7:\\\"backoff\\\";N;s:10:\\\"retryUntil\\\";N;s:7:\\\"timeout\\\";N;s:13:\\\"failOnTimeout\\\";b:0;s:17:\\\"shouldBeEncrypted\\\";b:0;s:14:\\\"shouldBeUnique\\\";b:0;s:29:\\\"shouldBeUniqueUntilProcessing\\\";b:0;s:8:\\\"uniqueId\\\";N;s:9:\\\"uniqueFor\\\";N;s:3:\\\"job\\\";N;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775926049,\"delay\":null}', 0, NULL, 1775926049, 1775926049),
(12, 'default', '{\"uuid\":\"64921da3-4284-43cb-942e-67a474347367\",\"displayName\":\"App\\\\Listeners\\\\SendSaleNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Events\\\\CallQueuedListener\",\"command\":\"O:36:\\\"Illuminate\\\\Events\\\\CallQueuedListener\\\":26:{s:5:\\\"class\\\";s:34:\\\"App\\\\Listeners\\\\SendSaleNotification\\\";s:6:\\\"method\\\";s:6:\\\"handle\\\";s:4:\\\"data\\\";a:1:{i:0;O:22:\\\"App\\\\Events\\\\SaleCreated\\\":1:{s:4:\\\"sale\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\Sale\\\";s:2:\\\"id\\\";i:18;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}}}s:5:\\\"tries\\\";N;s:13:\\\"maxExceptions\\\";N;s:7:\\\"backoff\\\";N;s:10:\\\"retryUntil\\\";N;s:7:\\\"timeout\\\";N;s:13:\\\"failOnTimeout\\\";b:0;s:17:\\\"shouldBeEncrypted\\\";b:0;s:14:\\\"shouldBeUnique\\\";b:0;s:29:\\\"shouldBeUniqueUntilProcessing\\\";b:0;s:8:\\\"uniqueId\\\";N;s:9:\\\"uniqueFor\\\";N;s:3:\\\"job\\\";N;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775928736,\"delay\":null}', 0, NULL, 1775928736, 1775928736),
(13, 'default', '{\"uuid\":\"2ed3caef-89ac-4aab-87d0-9d6261d72827\",\"displayName\":\"App\\\\Listeners\\\\SendSaleNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Events\\\\CallQueuedListener\",\"command\":\"O:36:\\\"Illuminate\\\\Events\\\\CallQueuedListener\\\":26:{s:5:\\\"class\\\";s:34:\\\"App\\\\Listeners\\\\SendSaleNotification\\\";s:6:\\\"method\\\";s:6:\\\"handle\\\";s:4:\\\"data\\\";a:1:{i:0;O:22:\\\"App\\\\Events\\\\SaleCreated\\\":1:{s:4:\\\"sale\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\Sale\\\";s:2:\\\"id\\\";i:23;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}}}s:5:\\\"tries\\\";N;s:13:\\\"maxExceptions\\\";N;s:7:\\\"backoff\\\";N;s:10:\\\"retryUntil\\\";N;s:7:\\\"timeout\\\";N;s:13:\\\"failOnTimeout\\\";b:0;s:17:\\\"shouldBeEncrypted\\\";b:0;s:14:\\\"shouldBeUnique\\\";b:0;s:29:\\\"shouldBeUniqueUntilProcessing\\\";b:0;s:8:\\\"uniqueId\\\";N;s:9:\\\"uniqueFor\\\";N;s:3:\\\"job\\\";N;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775949444,\"delay\":null}', 0, NULL, 1775949444, 1775949444),
(14, 'default', '{\"uuid\":\"07d3eb64-9944-42d0-bcf8-4d612e10bb6f\",\"displayName\":\"App\\\\Listeners\\\\SendSaleNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Events\\\\CallQueuedListener\",\"command\":\"O:36:\\\"Illuminate\\\\Events\\\\CallQueuedListener\\\":26:{s:5:\\\"class\\\";s:34:\\\"App\\\\Listeners\\\\SendSaleNotification\\\";s:6:\\\"method\\\";s:6:\\\"handle\\\";s:4:\\\"data\\\";a:1:{i:0;O:22:\\\"App\\\\Events\\\\SaleCreated\\\":1:{s:4:\\\"sale\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\Sale\\\";s:2:\\\"id\\\";i:24;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}}}s:5:\\\"tries\\\";N;s:13:\\\"maxExceptions\\\";N;s:7:\\\"backoff\\\";N;s:10:\\\"retryUntil\\\";N;s:7:\\\"timeout\\\";N;s:13:\\\"failOnTimeout\\\";b:0;s:17:\\\"shouldBeEncrypted\\\";b:0;s:14:\\\"shouldBeUnique\\\";b:0;s:29:\\\"shouldBeUniqueUntilProcessing\\\";b:0;s:8:\\\"uniqueId\\\";N;s:9:\\\"uniqueFor\\\";N;s:3:\\\"job\\\";N;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775952929,\"delay\":null}', 0, NULL, 1775952929, 1775952929),
(15, 'default', '{\"uuid\":\"15ddb2b6-abea-4c2f-9326-7fe7de5a35c7\",\"displayName\":\"App\\\\Listeners\\\\SendSaleNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Events\\\\CallQueuedListener\",\"command\":\"O:36:\\\"Illuminate\\\\Events\\\\CallQueuedListener\\\":26:{s:5:\\\"class\\\";s:34:\\\"App\\\\Listeners\\\\SendSaleNotification\\\";s:6:\\\"method\\\";s:6:\\\"handle\\\";s:4:\\\"data\\\";a:1:{i:0;O:22:\\\"App\\\\Events\\\\SaleCreated\\\":1:{s:4:\\\"sale\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\Sale\\\";s:2:\\\"id\\\";i:27;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}}}s:5:\\\"tries\\\";N;s:13:\\\"maxExceptions\\\";N;s:7:\\\"backoff\\\";N;s:10:\\\"retryUntil\\\";N;s:7:\\\"timeout\\\";N;s:13:\\\"failOnTimeout\\\";b:0;s:17:\\\"shouldBeEncrypted\\\";b:0;s:14:\\\"shouldBeUnique\\\";b:0;s:29:\\\"shouldBeUniqueUntilProcessing\\\";b:0;s:8:\\\"uniqueId\\\";N;s:9:\\\"uniqueFor\\\";N;s:3:\\\"job\\\";N;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775955065,\"delay\":null}', 0, NULL, 1775955065, 1775955065),
(16, 'default', '{\"uuid\":\"91bd46cd-e17b-41c0-b904-49ebdaa41753\",\"displayName\":\"App\\\\Listeners\\\\SendSaleNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Events\\\\CallQueuedListener\",\"command\":\"O:36:\\\"Illuminate\\\\Events\\\\CallQueuedListener\\\":26:{s:5:\\\"class\\\";s:34:\\\"App\\\\Listeners\\\\SendSaleNotification\\\";s:6:\\\"method\\\";s:6:\\\"handle\\\";s:4:\\\"data\\\";a:1:{i:0;O:22:\\\"App\\\\Events\\\\SaleCreated\\\":1:{s:4:\\\"sale\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\Sale\\\";s:2:\\\"id\\\";i:29;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}}}s:5:\\\"tries\\\";N;s:13:\\\"maxExceptions\\\";N;s:7:\\\"backoff\\\";N;s:10:\\\"retryUntil\\\";N;s:7:\\\"timeout\\\";N;s:13:\\\"failOnTimeout\\\";b:0;s:17:\\\"shouldBeEncrypted\\\";b:0;s:14:\\\"shouldBeUnique\\\";b:0;s:29:\\\"shouldBeUniqueUntilProcessing\\\";b:0;s:8:\\\"uniqueId\\\";N;s:9:\\\"uniqueFor\\\";N;s:3:\\\"job\\\";N;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1775999353,\"delay\":null}', 0, NULL, 1775999353, 1775999353),
(17, 'default', '{\"uuid\":\"06e32e2d-c861-4f5f-96a3-cb0b0293b359\",\"displayName\":\"App\\\\Listeners\\\\SendSaleNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Events\\\\CallQueuedListener\",\"command\":\"O:36:\\\"Illuminate\\\\Events\\\\CallQueuedListener\\\":26:{s:5:\\\"class\\\";s:34:\\\"App\\\\Listeners\\\\SendSaleNotification\\\";s:6:\\\"method\\\";s:6:\\\"handle\\\";s:4:\\\"data\\\";a:1:{i:0;O:22:\\\"App\\\\Events\\\\SaleCreated\\\":1:{s:4:\\\"sale\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\Sale\\\";s:2:\\\"id\\\";i:30;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}}}s:5:\\\"tries\\\";N;s:13:\\\"maxExceptions\\\";N;s:7:\\\"backoff\\\";N;s:10:\\\"retryUntil\\\";N;s:7:\\\"timeout\\\";N;s:13:\\\"failOnTimeout\\\";b:0;s:17:\\\"shouldBeEncrypted\\\";b:0;s:14:\\\"shouldBeUnique\\\";b:0;s:29:\\\"shouldBeUniqueUntilProcessing\\\";b:0;s:8:\\\"uniqueId\\\";N;s:9:\\\"uniqueFor\\\";N;s:3:\\\"job\\\";N;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1776001175,\"delay\":null}', 0, NULL, 1776001175, 1776001175),
(18, 'default', '{\"uuid\":\"6ec262d5-abb5-4896-98b8-25f3ea056ad6\",\"displayName\":\"App\\\\Listeners\\\\SendSaleNotification\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Events\\\\CallQueuedListener\",\"command\":\"O:36:\\\"Illuminate\\\\Events\\\\CallQueuedListener\\\":26:{s:5:\\\"class\\\";s:34:\\\"App\\\\Listeners\\\\SendSaleNotification\\\";s:6:\\\"method\\\";s:6:\\\"handle\\\";s:4:\\\"data\\\";a:1:{i:0;O:22:\\\"App\\\\Events\\\\SaleCreated\\\":1:{s:4:\\\"sale\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:15:\\\"App\\\\Models\\\\Sale\\\";s:2:\\\"id\\\";i:31;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}}}s:5:\\\"tries\\\";N;s:13:\\\"maxExceptions\\\";N;s:7:\\\"backoff\\\";N;s:10:\\\"retryUntil\\\";N;s:7:\\\"timeout\\\";N;s:13:\\\"failOnTimeout\\\";b:0;s:17:\\\"shouldBeEncrypted\\\";b:0;s:14:\\\"shouldBeUnique\\\";b:0;s:29:\\\"shouldBeUniqueUntilProcessing\\\";b:0;s:8:\\\"uniqueId\\\";N;s:9:\\\"uniqueFor\\\";N;s:3:\\\"job\\\";N;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1776002464,\"delay\":null}', 0, NULL, 1776002464, 1776002464);

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

--
-- Dumping data for table `journal_entries`
--

INSERT INTO `journal_entries` (`id`, `company_id`, `ref`, `date`, `description`, `status`, `type`, `user_id`, `reference_type`, `reference_id`, `created_at`, `updated_at`) VALUES
(1, 2, 'AUTO-PUR-8', '2026-04-11', 'مشتريات - أمر ', 'posted', 'auto', 7, 'App\\Models\\Purchase', 8, '2026-04-11 19:39:02', '2026-04-11 19:39:02'),
(2, 2, 'AUTO-PUR-7', '2026-04-11', 'مشتريات - أمر ', 'posted', 'auto', 7, 'App\\Models\\Purchase', 7, '2026-04-11 19:39:12', '2026-04-11 19:39:12'),
(3, 2, 'AUTO-PUR-9', '2026-04-11', 'مشتريات - أمر ', 'posted', 'auto', 7, 'App\\Models\\Purchase', 9, '2026-04-11 20:26:19', '2026-04-11 20:26:19');

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

--
-- Dumping data for table `journal_entry_lines`
--

INSERT INTO `journal_entry_lines` (`id`, `journal_entry_id`, `account_id`, `debit`, `credit`, `description`) VALUES
(1, 1, 10, 25000.00, 0.00, 'مخزون مشتريات'),
(2, 1, 13, 0.00, 25000.00, 'ذمم موردين'),
(3, 2, 10, 20000.00, 0.00, 'مخزون مشتريات'),
(4, 2, 13, 0.00, 20000.00, 'ذمم موردين'),
(5, 3, 10, 160000.00, 0.00, 'مخزون مشتريات'),
(6, 3, 13, 0.00, 160000.00, 'ذمم موردين');

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
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `leave_requests`
--

CREATE TABLE `leave_requests` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `type` enum('annual','sick','emergency','unpaid','other') NOT NULL,
  `from_date` date NOT NULL,
  `to_date` date NOT NULL,
  `days` int(11) GENERATED ALWAYS AS (to_days(`to_date`) - to_days(`from_date`) + 1) STORED,
  `reason` text DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
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
(44, '2026_04_10_000001_create_new_integrations_tables', 1),
(45, '2026_04_10_000002_create_helpdesk_workflows_table', 1),
(46, '2026_04_08_231549_update_purchases_status_enum', 2),
(47, '2026_04_10_194555_update_stock_movements_type_column', 3),
(48, '2026_04_10_203303_add_warehouse_id_to_sale_items_table', 4),
(49, '2026_04_11_171819_add_due_date_tax_rate_to_sales_table', 5),
(50, '2026_04_11_184932_add_warehouse_discount_to_purchase_items_table', 6),
(51, '2026_04_11_202213_fix_purchase_items_add_warehouse_discount', 7),
(52, '2026_04_11_232302_update_sales_status_enum', 8),
(53, '2026_04_13_001833_add_quotation_statuses_to_sales_table', 9),
(54, '2026_04_13_002616_add_rating_to_suppliers_table', 10),
(55, '2026_04_13_012757_add_extra_columns_to_suppliers_table', 11),
(56, '2026_04_13_014544_add_country_to_suppliers_table', 12),
(57, '2026_04_13_020656_create_supplier_ledger_table', 13);

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
(3, 'App\\Models\\User', 8),
(4, 'App\\Models\\User', 4),
(5, 'App\\Models\\User', 5),
(6, 'App\\Models\\User', 6),
(9, 'App\\Models\\User', 7);

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
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `employee_id` bigint(20) UNSIGNED NOT NULL,
  `month` int(11) NOT NULL,
  `year` int(11) NOT NULL,
  `basic_salary` decimal(10,2) NOT NULL DEFAULT 0.00,
  `bonus` decimal(10,2) NOT NULL DEFAULT 0.00,
  `deductions` decimal(10,2) NOT NULL DEFAULT 0.00,
  `net_salary` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('draft','approved','paid') NOT NULL DEFAULT 'draft',
  `paid_at` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
(1, 'view-dashboard', 'web', '2026-04-08 17:38:05', '2026-04-08 17:38:05'),
(2, 'manage-users', 'web', '2026-04-08 17:38:05', '2026-04-08 17:38:05'),
(3, 'manage-settings', 'web', '2026-04-08 17:38:05', '2026-04-08 17:38:05'),
(4, 'manage-products', 'web', '2026-04-08 17:38:05', '2026-04-08 17:38:05'),
(5, 'manage-sales', 'web', '2026-04-08 17:38:05', '2026-04-08 17:38:05'),
(6, 'manage-purchases', 'web', '2026-04-08 17:38:05', '2026-04-08 17:38:05'),
(7, 'manage-accounting', 'web', '2026-04-08 17:38:05', '2026-04-08 17:38:05'),
(8, 'manage-hr', 'web', '2026-04-08 17:38:05', '2026-04-08 17:38:05'),
(9, 'manage-pos', 'web', '2026-04-08 17:38:05', '2026-04-08 17:38:05'),
(10, 'manage-projects', 'web', '2026-04-08 17:38:05', '2026-04-08 17:38:05'),
(11, 'manage-crm', 'web', '2026-04-08 17:38:05', '2026-04-08 17:38:05'),
(12, 'manage-warehouses', 'web', '2026-04-08 17:38:05', '2026-04-08 17:38:05'),
(13, 'manage-budgets', 'web', '2026-04-08 17:38:05', '2026-04-08 17:38:05'),
(14, 'view-reports', 'web', '2026-04-08 17:38:05', '2026-04-08 17:38:05');

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
(3, 'App\\Models\\User', 2, 'api-token', '04d36c328842e236d2515b444454d01d8d1e0bf4fc96e897b47c34c829bba03d', '[\"*\"]', '2026-04-08 19:44:38', NULL, '2026-04-08 19:18:35', '2026-04-08 19:44:38'),
(5, 'App\\Models\\User', 7, 'api-token', '15539ebddba1adb0b084529c021fc7cdbca41a95b701ac27673de0d841be5653', '[\"*\"]', NULL, NULL, '2026-04-08 19:45:55', '2026-04-08 19:45:55'),
(6, 'App\\Models\\User', 7, 'api-token', 'eac319517480190e1418650f6ab87a8e1ba79763b434f5d5e9f25ce2d62c4e46', '[\"*\"]', '2026-04-08 19:47:13', NULL, '2026-04-08 19:46:09', '2026-04-08 19:47:13'),
(7, 'App\\Models\\User', 7, 'api-token', 'badb4590c7ce776eca88cc2d4cddfa76d2117f52e601b7d38b397e061939da6a', '[\"*\"]', '2026-04-08 20:00:28', NULL, '2026-04-08 19:47:45', '2026-04-08 20:00:28'),
(8, 'App\\Models\\User', 7, 'api-token', '3f43510d9600534667da0c86d815e077996bb8aaf3cb2355ed629cd25e5f120c', '[\"*\"]', '2026-04-08 21:11:50', NULL, '2026-04-08 20:00:59', '2026-04-08 21:11:50'),
(9, 'App\\Models\\User', 7, 'api-token', '8f7a5283f0f4ab3cded3a006471716174619140f08087de8a257357302660f08', '[\"*\"]', '2026-04-08 21:20:23', NULL, '2026-04-08 21:13:00', '2026-04-08 21:20:23'),
(13, 'App\\Models\\User', 7, 'api-token', '3d51a81c0c3af8ecbc7002cd87212f3c193b9abf00eb6cec6cb6023e0bcb37f4', '[\"*\"]', '2026-04-09 10:58:43', NULL, '2026-04-09 10:30:39', '2026-04-09 10:58:43'),
(14, 'App\\Models\\User', 7, 'api-token', 'efb8659a1a5c3959b8128fc071cce3f586f7f065bbc61e9fe9649355c260ea8c', '[\"*\"]', '2026-04-09 11:22:38', NULL, '2026-04-09 10:59:02', '2026-04-09 11:22:38'),
(15, 'App\\Models\\User', 7, 'api-token', '135a461c4f552b40ce422c2acfb24ecaf7c2924eeb01613579a2ec8eec4227f3', '[\"*\"]', '2026-04-09 11:31:46', NULL, '2026-04-09 11:23:37', '2026-04-09 11:31:46'),
(16, 'App\\Models\\User', 7, 'api-token', 'a83835c0b7d20a4c0434448e8995bf0736fe636707c3f7663dc7f515be1a2dc1', '[\"*\"]', '2026-04-09 14:31:27', NULL, '2026-04-09 11:32:03', '2026-04-09 14:31:27'),
(17, 'App\\Models\\User', 7, 'api-token', 'adcfff27c7864638fe34638485c8bc046fe0d66c6aefd41c0f402490924f71ec', '[\"*\"]', '2026-04-09 14:32:08', NULL, '2026-04-09 14:32:00', '2026-04-09 14:32:08'),
(18, 'App\\Models\\User', 7, 'api-token', '7a7b1242d9ff7a8eb2100a2b2c168558e35a0ccf4e92edb2adeb5105f06cb40c', '[\"*\"]', '2026-04-09 14:39:45', NULL, '2026-04-09 14:32:07', '2026-04-09 14:39:45'),
(19, 'App\\Models\\User', 7, 'api-token', '6a1d0ed4379721df0e345645def3b1057d3c46a7fe152d605c3bcd216dfc1599', '[\"*\"]', '2026-04-09 14:40:11', NULL, '2026-04-09 14:40:04', '2026-04-09 14:40:11'),
(21, 'App\\Models\\User', 7, 'api-token', 'f9827c80f0c752950e69502b0af2638dfc7445bc9e7e62e7f5e8fdce7026320f', '[\"*\"]', '2026-04-09 14:46:33', NULL, '2026-04-09 14:46:20', '2026-04-09 14:46:33'),
(22, 'App\\Models\\User', 7, 'api-token', '6506e880414d58449d9b8639e12c44a5dc6caabe9085956cc1044acbaf89232e', '[\"*\"]', '2026-04-09 19:20:34', NULL, '2026-04-09 14:46:57', '2026-04-09 19:20:34'),
(23, 'App\\Models\\User', 7, 'api-token', 'e32c9571ac9a6a4d707832fd95d6eda90dc7186e3eb4b27d51af1de8c7ed4482', '[\"*\"]', '2026-04-09 17:39:08', NULL, '2026-04-09 17:29:10', '2026-04-09 17:39:08'),
(24, 'App\\Models\\User', 7, 'api-token', '3388d8bae9b38aaffe97d9a74016f9bbb74e159218c42cc99df1540c301db9d0', '[\"*\"]', '2026-04-09 18:02:30', NULL, '2026-04-09 17:39:26', '2026-04-09 18:02:30'),
(25, 'App\\Models\\User', 7, 'api-token', '26059774aaf3dda90fb6283668d595546b9d2324f563d7d1ae5b7de571089ebe', '[\"*\"]', '2026-04-09 17:48:30', NULL, '2026-04-09 17:47:38', '2026-04-09 17:48:30'),
(26, 'App\\Models\\User', 7, 'api-token', '7c21643c621995c37ccb0ac0cbc439142570c5fe9eabd1c65d6694cc17cfb068', '[\"*\"]', '2026-04-09 18:04:08', NULL, '2026-04-09 17:48:47', '2026-04-09 18:04:08'),
(27, 'App\\Models\\User', 7, 'api-token', '892530b2687c24bd41caf143e219885822d88be3b82fc80f0a53dbab12286c8e', '[\"*\"]', '2026-04-11 16:24:52', NULL, '2026-04-09 18:02:46', '2026-04-11 16:24:52'),
(28, 'App\\Models\\User', 7, 'api-token', 'cfae721e3bf903b692047b3204d68c2c2987f2b61bec75ddfe9159eb73c2e3bc', '[\"*\"]', '2026-04-09 18:09:53', NULL, '2026-04-09 18:06:39', '2026-04-09 18:09:53'),
(32, 'App\\Models\\User', 7, 'api-token', '5e0f817e81e8fbe2bc4e8dc86994dadc65669eea5efbab4c25ae119324675072', '[\"*\"]', '2026-04-09 18:51:20', NULL, '2026-04-09 18:26:55', '2026-04-09 18:51:20'),
(33, 'App\\Models\\User', 7, 'api-token', 'c3e6f735ed64ba34fd90cb6f6f21ca32977a51dec70d39254d4ca61c4ee6a4f9', '[\"*\"]', '2026-04-09 19:15:52', NULL, '2026-04-09 18:51:40', '2026-04-09 19:15:52'),
(36, 'App\\Models\\User', 7, 'api-token', '016c0149c7517e71d51fd6be5572745526eb098de055a8c0d62bfdbd6003a815', '[\"*\"]', '2026-04-09 19:25:08', NULL, '2026-04-09 19:24:44', '2026-04-09 19:25:08'),
(37, 'App\\Models\\User', 7, 'api-token', 'bef8e34dbacdaf5a7847e8893ba52a222c2b004c95e4c1ca44a71a09f59ebb41', '[\"*\"]', '2026-04-09 19:42:14', NULL, '2026-04-09 19:25:30', '2026-04-09 19:42:14'),
(38, 'App\\Models\\User', 7, 'api-token', 'c51e2bb1dc09054f402f513e5f4262fd5ceebcca7b0a8b1fac63fec59e96171d', '[\"*\"]', '2026-04-09 19:43:56', NULL, '2026-04-09 19:43:08', '2026-04-09 19:43:56'),
(40, 'App\\Models\\User', 7, 'api-token', 'a1a7bc360d5f83ebb56cac303bcb4c45913404cbef24319135d6edbd2c41dbb2', '[\"*\"]', '2026-04-10 13:08:04', NULL, '2026-04-10 13:07:37', '2026-04-10 13:08:04'),
(41, 'App\\Models\\User', 7, 'api-token', 'b385b289d59c4933aa5d8ce5df5f3c0d451a519658fc2efc818d310e247d3f4c', '[\"*\"]', '2026-04-10 13:25:23', NULL, '2026-04-10 13:08:34', '2026-04-10 13:25:23'),
(42, 'App\\Models\\User', 7, 'api-token', '1d6493a88098c9aba141aa797982c512fe0bca8d9550a3a6615c71b7fd731903', '[\"*\"]', '2026-04-10 13:39:30', NULL, '2026-04-10 13:25:38', '2026-04-10 13:39:30'),
(45, 'App\\Models\\User', 7, 'api-token', '98976b03fc3be89c5db80777c015c2fb2802306f71a441ccc7016ee455d658e1', '[\"*\"]', '2026-04-10 17:54:19', NULL, '2026-04-10 17:20:22', '2026-04-10 17:54:19'),
(46, 'App\\Models\\User', 7, 'api-token', '265c576ec042a00495fe2e9a43489747f39aa922bc2c2c969fb4748d647826e4', '[\"*\"]', '2026-04-10 19:24:09', NULL, '2026-04-10 19:00:15', '2026-04-10 19:24:09'),
(47, 'App\\Models\\User', 7, 'api-token', 'a5deb6feee511f8cd39e050c7fef6a3ea8af4d3b4b223e936d5e82e21199950a', '[\"*\"]', '2026-04-10 19:26:41', NULL, '2026-04-10 19:24:37', '2026-04-10 19:26:41'),
(48, 'App\\Models\\User', 7, 'api-token', '5f4295925a98b8be051b3f7348814e083ca43c010f1bc7e29d1b485bfaa47ba2', '[\"*\"]', '2026-04-10 19:27:16', NULL, '2026-04-10 19:27:02', '2026-04-10 19:27:16'),
(49, 'App\\Models\\User', 7, 'api-token', '247b0e18965b537f7449d71952f694e39f3d02c78dc681b334ffc1ca39313278', '[\"*\"]', '2026-04-10 19:36:37', NULL, '2026-04-10 19:35:16', '2026-04-10 19:36:37'),
(50, 'App\\Models\\User', 7, 'api-token', '4f2fcf70e95001cd4902940f16ee065e64787d83824ba7987720c832a2cd289b', '[\"*\"]', '2026-04-10 20:22:16', NULL, '2026-04-10 19:38:51', '2026-04-10 20:22:16'),
(51, 'App\\Models\\User', 7, 'api-token', 'ed792939d9cea684e935679edbc8ee1dc695d937f7529d83f8cd18d8b8ae1987', '[\"*\"]', '2026-04-10 20:30:40', NULL, '2026-04-10 20:22:44', '2026-04-10 20:30:40'),
(52, 'App\\Models\\User', 7, 'api-token', '6c30fcaccb5243600fc990c7d02c188e3150e8fcd67f0f7b3de5006c3f62c3b7', '[\"*\"]', '2026-04-10 20:51:48', NULL, '2026-04-10 20:30:59', '2026-04-10 20:51:48'),
(53, 'App\\Models\\User', 7, 'api-token', 'b95e52a78b30e96e4a8aacffbab2fc2caed8a46a695fd09a966a022f6f1d8c71', '[\"*\"]', '2026-04-10 21:26:40', NULL, '2026-04-10 20:32:35', '2026-04-10 21:26:40'),
(54, 'App\\Models\\User', 7, 'api-token', '679a305fd48c9ae414984f3497a6d5ea9cd7beab47c328317230bcac084ecd1a', '[\"*\"]', '2026-04-10 21:13:38', NULL, '2026-04-10 20:51:56', '2026-04-10 21:13:38'),
(55, 'App\\Models\\User', 7, 'api-token', 'dbb411edf990b8ee785a85dd7e636dd0b40dc531a6c7fed8b69f1cb84e7d6162', '[\"*\"]', '2026-04-10 21:22:53', NULL, '2026-04-10 21:13:48', '2026-04-10 21:22:53'),
(56, 'App\\Models\\User', 7, 'api-token', 'ebd5cca6bcd70d494350a572ccd5e37cc47001deaa0a54a610f7d6c579068d84', '[\"*\"]', '2026-04-10 21:23:13', NULL, '2026-04-10 21:23:07', '2026-04-10 21:23:13'),
(57, 'App\\Models\\User', 7, 'api-token', 'd3e03ad8260ed1603b2f9798cc6f940238c8a75692581c308fd80b3894a9b294', '[\"*\"]', '2026-04-10 21:26:52', NULL, '2026-04-10 21:23:19', '2026-04-10 21:26:52'),
(58, 'App\\Models\\User', 7, 'api-token', 'cfbe6086f2b10ab70824c597966085eac5f10dc476cc84c08b76e9c11c303e02', '[\"*\"]', '2026-04-10 21:34:36', NULL, '2026-04-10 21:27:18', '2026-04-10 21:34:36'),
(59, 'App\\Models\\User', 7, 'api-token', 'ea449b65cc9a1323091915f07a42c72b0c2deb1ad5e03b7c0bd14ade1be1a091', '[\"*\"]', '2026-04-10 21:35:45', NULL, '2026-04-10 21:34:52', '2026-04-10 21:35:45'),
(60, 'App\\Models\\User', 7, 'api-token', '5eab69e2815f8cd64023e732fe53cb15488c5812785b0d940d7cf4db1e32b439', '[\"*\"]', '2026-04-10 21:46:14', NULL, '2026-04-10 21:39:01', '2026-04-10 21:46:14'),
(61, 'App\\Models\\User', 7, 'api-token', '35f60bf4b853d7181fde56fc177df4008284bbacb903a38127fe7981ba37c3a6', '[\"*\"]', '2026-04-11 15:30:11', NULL, '2026-04-11 14:46:27', '2026-04-11 15:30:11'),
(62, 'App\\Models\\User', 7, 'api-token', '51c7eb8001c25f61d397b36e7ab37182e47cd5332fa566af79cf9a75dc062940', '[\"*\"]', '2026-04-11 15:30:36', NULL, '2026-04-11 15:30:29', '2026-04-11 15:30:36'),
(63, 'App\\Models\\User', 7, 'api-token', 'c31053f08a1cffc6ca65a9676c994f4bba93934e04b36de5d394549804f7f023', '[\"*\"]', '2026-04-11 15:42:36', NULL, '2026-04-11 15:30:35', '2026-04-11 15:42:36'),
(64, 'App\\Models\\User', 7, 'api-token', 'e19ff7262f523c6490ec26be5498a9168e1f8802662919b8a59433094d2d1dc6', '[\"*\"]', '2026-04-11 15:43:06', NULL, '2026-04-11 15:42:57', '2026-04-11 15:43:06'),
(65, 'App\\Models\\User', 7, 'api-token', 'dc79729f737bd29e85fabbcd5e707b4956cd786656bfb576717b78699e81e4e0', '[\"*\"]', '2026-04-11 15:48:01', NULL, '2026-04-11 15:43:04', '2026-04-11 15:48:01'),
(66, 'App\\Models\\User', 7, 'api-token', '4b87ca8f1fbf427c4a975ddc5ad1505eb3760c96dec5bccc674dc2e924e602dc', '[\"*\"]', '2026-04-11 15:58:46', NULL, '2026-04-11 15:58:39', '2026-04-11 15:58:46'),
(67, 'App\\Models\\User', 7, 'api-token', 'b43456669dbaaa4da1ade56e194488d08e125e16527785b8fbae1a6d98470d37', '[\"*\"]', '2026-04-11 16:25:05', NULL, '2026-04-11 15:58:45', '2026-04-11 16:25:05'),
(68, 'App\\Models\\User', 7, 'api-token', '1e4163004d1665e5fcfeb1b7570361f23946b01d78d0542ebe17e2243f3bbcb5', '[\"*\"]', '2026-04-11 16:28:28', NULL, '2026-04-11 16:25:35', '2026-04-11 16:28:28'),
(70, 'App\\Models\\User', 7, 'api-token', '8db83ad5129e92fb83debebc7c4923594e10f0656973d2442ef6caeb8d1b6e94', '[\"*\"]', '2026-04-11 17:57:05', NULL, '2026-04-11 17:56:22', '2026-04-11 17:57:05'),
(71, 'App\\Models\\User', 7, 'api-token', '899f75e45e2f78c873f04d3625d1377b2d9c60979858036ff1c3af86c23689d4', '[\"*\"]', '2026-04-11 18:49:52', NULL, '2026-04-11 18:26:50', '2026-04-11 18:49:52'),
(72, 'App\\Models\\User', 7, 'api-token', '65f95ba5bc9b4b57e74eca132b4184502820dc3816bff9d7bcc07fdacb6d558e', '[\"*\"]', '2026-04-11 18:54:32', NULL, '2026-04-11 18:50:15', '2026-04-11 18:54:32'),
(73, 'App\\Models\\User', 7, 'api-token', '333d2505dc469ad2c85b0bedd6ac63da7c756e6dc313d5d1fcfab4ff6daed376', '[\"*\"]', '2026-04-11 18:55:11', NULL, '2026-04-11 18:54:50', '2026-04-11 18:55:11'),
(74, 'App\\Models\\User', 7, 'api-token', '206cdc1763ac3a65665e29a002807b66ff62342ee8c2d30a309fa4792d7fb999', '[\"*\"]', '2026-04-11 19:01:04', NULL, '2026-04-11 19:00:56', '2026-04-11 19:01:04'),
(75, 'App\\Models\\User', 7, 'api-token', '20e742c4938b2b885797a43649a44f5db02cfdad868e6657bfa1ccaab50bfc64', '[\"*\"]', '2026-04-11 19:01:19', NULL, '2026-04-11 19:01:02', '2026-04-11 19:01:19'),
(76, 'App\\Models\\User', 7, 'api-token', '6908c422040f8e298a7f7b4c79dfd87ecd493824dad76e11fec36033c8c3be24', '[\"*\"]', '2026-04-11 19:13:09', NULL, '2026-04-11 19:12:52', '2026-04-11 19:13:09'),
(77, 'App\\Models\\User', 7, 'api-token', '0524f691b5fe741abf6ad99a5220923d9bde50558970095e008500fffae8dab2', '[\"*\"]', '2026-04-11 19:47:41', NULL, '2026-04-11 19:36:08', '2026-04-11 19:47:41'),
(78, 'App\\Models\\User', 7, 'api-token', '38db8e09d0b74f95994147118e2557cd452f9111604c44511afb3927ef867ca8', '[\"*\"]', '2026-04-11 20:09:55', NULL, '2026-04-11 19:49:59', '2026-04-11 20:09:55'),
(80, 'App\\Models\\User', 7, 'api-token', '37950d2467c89fcc3cfb4525baae17fb14fefe1e07dc4be21d2f26aafcccc3f8', '[\"*\"]', '2026-04-11 20:18:55', NULL, '2026-04-11 20:18:45', '2026-04-11 20:18:55'),
(81, 'App\\Models\\User', 7, 'api-token', 'c5132d0dafb5753f2544d1856d8e0d74ab4164e5f2cf834ce99c1cf2ffbf0566', '[\"*\"]', '2026-04-11 21:14:51', NULL, '2026-04-11 20:19:19', '2026-04-11 21:14:51'),
(82, 'App\\Models\\User', 7, 'api-token', '782cf68568c36a78e66c083a650f99fd96e8129d78eec2cb5ca2d9e30175313c', '[\"*\"]', '2026-04-11 21:15:17', NULL, '2026-04-11 21:15:09', '2026-04-11 21:15:17'),
(83, 'App\\Models\\User', 7, 'api-token', 'd24a67f2a32dd4da16882880048519cf742476f1f24931ac13d1dad32055cf54', '[\"*\"]', '2026-04-11 21:18:05', NULL, '2026-04-11 21:15:15', '2026-04-11 21:18:05'),
(84, 'App\\Models\\User', 7, 'api-token', 'e97ab2479165e67345024abc4401d02fc774df5bb1fe2dd1efdf15f2864f21d6', '[\"*\"]', '2026-04-11 22:10:15', NULL, '2026-04-11 21:26:09', '2026-04-11 22:10:15'),
(85, 'App\\Models\\User', 7, 'api-token', 'ddb98798a989eec3f9c67e57422c6da88dd7311cb3a717a6cae83463254cba06', '[\"*\"]', '2026-04-11 22:10:35', NULL, '2026-04-11 22:10:28', '2026-04-11 22:10:35'),
(86, 'App\\Models\\User', 7, 'api-token', '266629f4bcba223cf8c42fafa094862264bfe26a65945a807bc925135b765eeb', '[\"*\"]', '2026-04-12 11:37:56', NULL, '2026-04-11 22:10:36', '2026-04-12 11:37:56'),
(87, 'App\\Models\\User', 7, 'api-token', 'd0f5f55fdb2c9d21f7ee1ded3e49df80772de8883edd4aa5f6429423b37a2171', '[\"*\"]', '2026-04-12 22:03:47', NULL, '2026-04-12 11:38:19', '2026-04-12 22:03:47'),
(88, 'App\\Models\\User', 7, 'api-token', '1f604a58bd53c23f9eb3aa94082f713251c1a4542d70206a56c51ae74d4d9838', '[\"*\"]', '2026-04-12 22:27:00', NULL, '2026-04-12 22:04:43', '2026-04-12 22:27:00'),
(89, 'App\\Models\\User', 7, 'api-token', '34e289fabaf6cd48d54268f3eb5749d8057f9adc512c2031a5da1cd719fd1605', '[\"*\"]', '2026-04-12 22:52:32', NULL, '2026-04-12 22:27:09', '2026-04-12 22:52:32'),
(90, 'App\\Models\\User', 7, 'api-token', 'ac0bd71ad3139ad0ec607b83e13c4dd8fb2dddcb56d2fdcbe6b6c8109b60bc17', '[\"*\"]', '2026-04-12 23:28:59', NULL, '2026-04-12 22:53:32', '2026-04-12 23:28:59'),
(91, 'App\\Models\\User', 7, 'api-token', '8c67f65d4299526bafa1ec63b91523e59e167e9ada6e93fbc3183df700e9c5f9', '[\"*\"]', '2026-04-12 23:38:36', NULL, '2026-04-12 23:29:45', '2026-04-12 23:38:36'),
(92, 'App\\Models\\User', 7, 'api-token', '60b9e94a0d02dc9d6783743016b68f1c4f15dbd237886abe78d267ae0071b33e', '[\"*\"]', '2026-04-13 00:31:08', NULL, '2026-04-12 23:39:30', '2026-04-13 00:31:08'),
(93, 'App\\Models\\User', 7, 'api-token', '659ca7f64d3a06328590b0558569ff88816a8075e4f3e125e6db11221398566b', '[\"*\"]', '2026-04-13 00:58:31', NULL, '2026-04-13 00:31:22', '2026-04-13 00:58:31');

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
(1, 1, 1, NULL, 'saas', NULL, '1010', NULL, 'piece', 1000.00, 500.00, 0.00, 100.000, 0.000, 0.00, 'saas', NULL, NULL, 1, '2026-04-08 19:38:17', '2026-04-08 17:53:40', '2026-04-08 19:38:17'),
(2, 1, 1, NULL, 'saas', NULL, '123', NULL, 'piece', 1000.00, 500.00, 0.00, 100.000, 0.000, 0.00, 'saas', NULL, NULL, 1, '2026-04-08 19:29:00', '2026-04-08 19:19:44', '2026-04-08 19:29:00'),
(3, 1, 1, NULL, 'ezz', NULL, '2020', NULL, 'piece', 100.00, 50.00, 0.00, 100.000, 0.000, 0.00, 'ss', NULL, NULL, 1, NULL, '2026-04-08 19:38:11', '2026-04-08 19:38:11'),
(4, 1, 2, NULL, 'saas', NULL, '3030', NULL, 'piece', 1000.00, 500.00, 0.00, 300.000, 0.000, 0.00, '101sas', NULL, NULL, 1, NULL, '2026-04-08 19:41:37', '2026-04-08 19:44:24'),
(13, 2, 3, 5, 'lap top', NULL, 'SKU-MNTIGOBV', NULL, 'piece', 7500.00, 5000.00, 0.00, 75.000, 100.000, 0.00, 'lap top used', NULL, NULL, 1, NULL, '2026-04-10 21:02:14', '2026-04-12 21:55:42'),
(14, 2, 6, NULL, 'apple', NULL, 'SKU-69DACA5B06190', NULL, 'piece', 0.00, 400.00, 0.00, 400.000, 0.000, 0.00, NULL, NULL, NULL, 1, NULL, '2026-04-11 20:25:31', '2026-04-11 20:26:19'),
(15, 2, 6, 6, 'apple', NULL, 'SKU-MNUWTD3Q', NULL, 'piece', 800.00, 400.00, 0.00, 403.000, 0.000, 0.00, NULL, NULL, NULL, 1, NULL, '2026-04-11 20:31:47', '2026-04-11 20:31:47');

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
(8, 2, 13, 5, 55.000, '2026-04-10 21:14:16', '2026-04-12 14:47:42'),
(9, 2, 13, 6, 25.000, '2026-04-10 21:14:16', '2026-04-12 14:48:18'),
(10, 2, 14, 6, 200.000, '2026-04-11 20:30:07', '2026-04-11 20:30:29'),
(11, 2, 14, 5, 200.000, '2026-04-11 20:30:29', '2026-04-11 20:30:29');

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
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `customer_id` bigint(20) UNSIGNED DEFAULT NULL,
  `manager_id` bigint(20) UNSIGNED DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `budget` decimal(14,2) NOT NULL DEFAULT 0.00,
  `status` enum('planning','active','on_hold','completed','cancelled') NOT NULL DEFAULT 'planning',
  `progress` int(11) NOT NULL DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
(1, NULL, 2, 1, 7, 'PO-20260408-0001', 250000.00, 0.00, 0.00, 0.00, 250000.00, 'approved', NULL, NULL, 'saas', '2026-04-09 18:13:21', '2026-04-08 21:17:41', '2026-04-09 18:13:21'),
(2, NULL, 2, 2, 7, 'PO-20260409-0002', 5000.00, 0.00, 0.00, 0.00, 5000.00, 'approved', NULL, NULL, 'goher', '2026-04-10 19:01:53', '2026-04-09 10:41:50', '2026-04-10 19:01:53'),
(3, NULL, 2, 3, 7, 'PO-20260409-0003', 12500000.00, 0.00, 0.00, 0.00, 12500000.00, 'approved', '2026-04-10', NULL, 'saas', '2026-04-11 17:44:29', '2026-04-09 11:32:40', '2026-04-11 17:44:29'),
(4, NULL, 2, 3, 7, 'PO-20260410-0004', 275000.00, 0.00, 0.00, 0.00, 275000.00, 'approved', '2026-04-11', NULL, 'tarek', NULL, '2026-04-10 19:02:37', '2026-04-11 19:56:14'),
(7, NULL, 2, 4, 7, 'PO-20260411-0005', 20000.00, 0.00, 0.00, 0.00, 20000.00, 'received', '2026-04-11', NULL, 'سشس', NULL, '2026-04-11 18:28:43', '2026-04-11 19:39:12'),
(8, NULL, 2, 5, 7, 'PO-20260411-0006', 25000.00, 0.00, 0.00, 0.00, 25000.00, 'received', '2026-04-10', NULL, 'تم الموافقه', NULL, '2026-04-11 19:37:15', '2026-04-11 19:39:02'),
(9, NULL, 2, 5, 7, 'PO-20260411-0007', 160000.00, 0.00, 0.00, 0.00, 160000.00, 'received', '2026-04-12', NULL, NULL, NULL, '2026-04-11 20:25:49', '2026-04-11 20:26:19'),
(10, NULL, 2, 5, 7, 'PO-20260412-0008', 5000.00, 0.00, 0.00, 0.00, 5000.00, 'approved', '2026-04-13', NULL, NULL, NULL, '2026-04-12 13:20:45', '2026-04-12 13:20:45');

-- --------------------------------------------------------

--
-- Table structure for table `purchase_invoices`
--

CREATE TABLE `purchase_invoices` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `purchase_id` bigint(20) UNSIGNED NOT NULL,
  `supplier_id` bigint(20) UNSIGNED NOT NULL,
  `invoice_number` varchar(255) DEFAULT NULL,
  `invoice_date` date DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `status` enum('draft','matched','discrepancy','approved','paid') NOT NULL DEFAULT 'draft',
  `notes` text DEFAULT NULL,
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

-- --------------------------------------------------------

--
-- Table structure for table `purchase_items`
--

CREATE TABLE `purchase_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `purchase_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `quantity` decimal(12,3) NOT NULL,
  `unit_price` decimal(12,2) NOT NULL,
  `discount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total` decimal(12,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `warehouse_id` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `purchase_items`
--

INSERT INTO `purchase_items` (`id`, `purchase_id`, `product_id`, `name`, `quantity`, `unit_price`, `discount`, `total`, `created_at`, `updated_at`, `warehouse_id`) VALUES
(8, 7, 13, NULL, 4.000, 5000.00, 0.00, 20000.00, '2026-04-11 18:43:11', '2026-04-11 18:43:11', NULL),
(9, 8, 13, NULL, 5.000, 5000.00, 0.00, 25000.00, '2026-04-11 19:37:15', '2026-04-11 19:37:15', NULL),
(10, 4, 13, NULL, 55.000, 5000.00, 0.00, 275000.00, '2026-04-11 19:56:14', '2026-04-11 19:56:14', 6),
(11, 9, 14, NULL, 400.000, 400.00, 0.00, 160000.00, '2026-04-11 20:25:49', '2026-04-11 20:25:49', NULL),
(12, 10, 13, NULL, 1.000, 5000.00, 0.00, 5000.00, '2026-04-12 13:20:46', '2026-04-12 13:20:46', 6);

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
(1, 'super-admin', 'web', '2026-04-08 17:38:05', '2026-04-08 17:38:05'),
(2, 'manager', 'web', '2026-04-08 17:38:05', '2026-04-08 17:38:05'),
(3, 'accountant', 'web', '2026-04-08 17:38:05', '2026-04-08 17:38:05'),
(4, 'store-manager', 'web', '2026-04-08 17:38:06', '2026-04-08 17:38:06'),
(5, 'cashier', 'web', '2026-04-08 17:38:06', '2026-04-08 17:38:06'),
(6, 'sales-rep', 'web', '2026-04-08 17:38:06', '2026-04-08 17:38:06'),
(7, 'hr-manager', 'web', '2026-04-08 17:38:06', '2026-04-08 17:38:06'),
(8, 'viewer', 'web', '2026-04-08 17:38:06', '2026-04-08 17:38:06'),
(9, 'admin', 'web', '2026-04-08 19:45:55', '2026-04-08 19:45:55');

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
(14, 8);

-- --------------------------------------------------------

--
-- Table structure for table `sales`
--

CREATE TABLE `sales` (
  `id` bigint(20) UNSIGNED NOT NULL,
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
  `due_date` date DEFAULT NULL,
  `tax_rate_id` bigint(20) UNSIGNED DEFAULT NULL,
  `sale_date` date DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sales`
--

INSERT INTO `sales` (`id`, `company_id`, `customer_id`, `user_id`, `invoice_number`, `subtotal`, `tax`, `discount`, `total`, `paid_amount`, `status`, `sale_type`, `payment_method`, `payment_terms`, `valid_until`, `converted_from_id`, `notes`, `due_date`, `tax_rate_id`, `sale_date`, `deleted_at`, `created_at`, `updated_at`) VALUES
(5, 2, 2, 7, 'INV-20260408-0001', 375000.00, 0.00, 0.00, 375000.00, 0.00, 'completed', 'invoice', 'card', NULL, NULL, NULL, 'saas', NULL, NULL, NULL, '2026-04-10 12:05:24', '2026-04-08 20:54:39', '2026-04-10 12:05:24'),
(6, 2, 3, 7, 'INV-20260409-0001', 375000.00, 0.00, 0.00, 375000.00, 0.00, 'completed', 'invoice', 'cash', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-09 10:40:59', '2026-04-09 10:31:30', '2026-04-09 10:40:59'),
(7, 2, 3, 7, 'INV-20260409-0002', 7500.00, 0.00, 0.00, 7500.00, 0.00, 'pending', 'invoice', 'cash', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-09 18:20:31', '2026-04-09 18:20:06', '2026-04-09 18:20:31'),
(8, 2, 4, 7, 'INV-20260409-0003', 75000000.00, 0.00, 0.00, 75000000.00, 0.00, 'completed', 'invoice', 'cash', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-10 12:05:27', '2026-04-09 18:20:54', '2026-04-10 12:05:27'),
(10, 2, 4, 7, 'INV-20260409-0004', 7500.00, 0.00, 0.00, 7500.00, 0.00, 'completed', 'invoice', 'cash', NULL, NULL, NULL, 'saas', NULL, NULL, NULL, '2026-04-10 12:05:31', '2026-04-09 18:34:08', '2026-04-10 12:05:31'),
(11, 2, NULL, 7, 'INV-20260409-0005', 100.00, 0.00, 0.00, 100.00, 0.00, 'completed', 'invoice', 'cash', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-09 19:02:48', '2026-04-09 19:05:44'),
(12, 2, 5, 7, 'INV-20260409-0006', 1000.00, 0.00, 0.00, 1000.00, 0.00, 'completed', 'invoice', 'cash', NULL, NULL, NULL, 'samer', NULL, NULL, NULL, '2026-04-10 19:00:52', '2026-04-09 19:06:38', '2026-04-10 19:00:52'),
(13, 2, 5, 7, 'INV-20260409-0007', 400.00, 0.00, 0.00, 400.00, 0.00, 'completed', 'invoice', 'cash', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-09 19:08:48', '2026-04-09 19:43:55'),
(14, 2, 3, 7, 'INV-20260409-0008', 100.00, 0.00, 0.00, 100.00, 0.00, 'completed', 'invoice', 'cash', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-09 19:11:05', '2026-04-09 19:39:31'),
(15, 2, 4, 7, 'INV-20260410-0001', 7800.00, 0.00, 0.00, 7800.00, 0.00, 'completed', 'invoice', 'card', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-10 12:05:18', '2026-04-10 12:05:18'),
(16, 2, 4, 7, 'INV-20260410-0002', 7500.00, 0.00, 0.00, 7500.00, 0.00, 'completed', 'invoice', 'cash', NULL, NULL, NULL, 'saas', NULL, NULL, NULL, NULL, '2026-04-10 12:06:05', '2026-04-10 12:06:22'),
(17, 2, 4, 7, 'INV-20260411-0001', 37500.00, 0.00, 0.00, 37500.00, 0.00, 'completed', 'invoice', 'cash', NULL, NULL, NULL, 'saas', NULL, NULL, NULL, NULL, '2026-04-11 14:47:29', '2026-04-11 14:47:29'),
(18, 2, 5, 7, 'INV-20260411-0002', 37500.00, 0.00, 1875.00, 35625.00, 0.00, 'completed', 'invoice', 'card', NULL, NULL, NULL, NULL, '2026-04-17', NULL, NULL, NULL, '2026-04-11 15:32:16', '2026-04-11 21:26:38'),
(23, 2, 4, 7, 'INV-20260411-0003', 37500.00, 0.00, 750.00, 36750.00, 0.00, 'completed', 'invoice', 'card', NULL, NULL, NULL, 'ok', '2026-04-13', NULL, NULL, NULL, '2026-04-11 21:17:24', '2026-04-11 22:14:59'),
(24, 2, 6, 7, 'INV-20260412-0001', 37500.00, 0.00, 753.75, 36746.25, 0.00, 'completed', 'invoice', 'card', NULL, NULL, NULL, NULL, '2026-04-13', NULL, NULL, NULL, '2026-04-11 22:15:29', '2026-04-11 22:15:49'),
(27, 2, 6, 7, 'INV-20260412-0002', 750000.00, 0.00, 0.00, 750000.00, 0.00, 'completed', 'invoice', 'card', NULL, NULL, NULL, NULL, '2026-04-12', NULL, NULL, NULL, '2026-04-11 22:51:05', '2026-04-11 22:51:16'),
(29, 2, 4, 7, 'INV-20260412-0003', 37500.00, 0.00, 7.50, 37492.50, 0.00, 'refunded', 'invoice', 'card', NULL, NULL, NULL, NULL, '2026-04-13', NULL, NULL, NULL, '2026-04-12 11:09:13', '2026-04-12 11:10:06'),
(30, 2, 1, 7, 'INV-20260412-0004', 7500.00, 0.00, 0.00, 7500.00, 0.00, 'cancelled', 'invoice', 'cash', NULL, NULL, NULL, NULL, '2026-04-14', NULL, NULL, NULL, '2026-04-12 11:39:35', '2026-04-12 11:39:35'),
(31, 2, 3, 7, 'INV-20260412-0005', 7500.00, 0.00, 0.00, 7500.00, 0.00, 'completed', 'invoice', 'cash', NULL, NULL, NULL, 'تم', '2026-04-14', NULL, NULL, NULL, '2026-04-12 12:01:04', '2026-04-12 12:01:04'),
(32, 2, 5, 7, 'INV-20260412-0006', 37500.00, 0.00, 0.00, 37500.00, 0.00, 'completed', 'invoice', 'cash', NULL, NULL, NULL, 'تم', NULL, NULL, NULL, NULL, '2026-04-12 21:54:57', '2026-04-12 21:55:42'),
(33, 2, 4, 7, 'INV-20260412-0007', 7500.00, 0.00, 0.00, 7500.00, 0.00, 'completed', 'invoice', 'cash', NULL, '2026-04-15', NULL, 'jl', NULL, NULL, NULL, NULL, '2026-04-12 21:59:29', '2026-04-13 00:29:01');

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
(10, 11, NULL, NULL, NULL, 1.000, 100.00, 0.00, 100.00, '2026-04-09 19:02:48', '2026-04-09 19:02:48'),
(12, 13, NULL, NULL, NULL, 2.000, 200.00, 0.00, 400.00, '2026-04-09 19:08:48', '2026-04-09 19:08:48'),
(13, 14, NULL, NULL, NULL, 1.000, 100.00, 0.00, 100.00, '2026-04-09 19:11:05', '2026-04-09 19:11:05'),
(14, 15, NULL, NULL, NULL, 1.000, 7500.00, 0.00, 7500.00, '2026-04-10 12:05:18', '2026-04-10 12:05:18'),
(15, 15, NULL, NULL, NULL, 1.000, 200.00, 0.00, 200.00, '2026-04-10 12:05:18', '2026-04-10 12:05:18'),
(16, 15, NULL, NULL, NULL, 1.000, 100.00, 0.00, 100.00, '2026-04-10 12:05:18', '2026-04-10 12:05:18'),
(17, 16, NULL, NULL, NULL, 1.000, 7500.00, 0.00, 7500.00, '2026-04-10 12:06:05', '2026-04-10 12:06:05'),
(18, 17, 13, NULL, NULL, 5.000, 7500.00, 0.00, 37500.00, '2026-04-11 14:47:29', '2026-04-11 14:47:29'),
(19, 18, 13, NULL, NULL, 5.000, 7500.00, 0.00, 37500.00, '2026-04-11 15:32:16', '2026-04-11 15:32:16'),
(24, 23, 13, 6, NULL, 5.000, 7500.00, 0.00, 37500.00, '2026-04-11 21:17:24', '2026-04-11 21:17:24'),
(25, 24, 13, 6, NULL, 5.000, 7500.00, 0.00, 37500.00, '2026-04-11 22:15:29', '2026-04-11 22:15:29'),
(28, 27, 13, NULL, NULL, 100.000, 7500.00, 0.00, 750000.00, '2026-04-11 22:51:05', '2026-04-11 22:51:05'),
(30, 29, 13, 6, NULL, 5.000, 7500.00, 0.00, 37500.00, '2026-04-12 11:09:13', '2026-04-12 11:09:13'),
(31, 30, 13, 6, NULL, 1.000, 7500.00, 0.00, 7500.00, '2026-04-12 11:39:35', '2026-04-12 11:39:35'),
(32, 31, 13, 6, NULL, 1.000, 7500.00, 0.00, 7500.00, '2026-04-12 12:01:04', '2026-04-12 12:01:04'),
(33, 32, 13, NULL, NULL, 5.000, 7500.00, 0.00, 37500.00, '2026-04-12 21:54:57', '2026-04-12 21:54:57'),
(34, 33, 13, NULL, NULL, 1.000, 7500.00, 0.00, 7500.00, '2026-04-12 21:59:29', '2026-04-12 21:59:29');

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

--
-- Dumping data for table `sale_payments`
--

INSERT INTO `sale_payments` (`id`, `company_id`, `sale_id`, `user_id`, `amount`, `payment_method`, `reference`, `notes`, `created_at`, `updated_at`) VALUES
(1, 2, 18, 7, 35625.00, 'card', '123456', 'za', '2026-04-11 15:33:03', '2026-04-11 15:33:03'),
(2, 2, 31, 7, 7500.00, 'cash', NULL, NULL, '2026-04-12 12:11:18', '2026-04-12 12:11:18'),
(3, 2, 33, 7, 7500.00, 'cash', NULL, NULL, '2026-04-13 00:29:01', '2026-04-13 00:29:01');

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
(32, 2, 13, 5, 7, 'transfer_out', 100.000, 200.000, 100.000, 0.00, NULL, NULL, 'used', '2026-04-10 21:14:16', '2026-04-10 21:14:16'),
(33, 2, 13, 6, 7, 'transfer_in', 100.000, 0.000, 100.000, 0.00, NULL, NULL, 'used', '2026-04-10 21:14:16', '2026-04-10 21:14:16'),
(34, 2, 13, 5, 7, 'out', 100.000, 100.000, 0.000, 0.00, NULL, NULL, NULL, '2026-04-10 21:16:14', '2026-04-10 21:16:14'),
(35, 2, 13, 6, 7, 'in', 100.000, 100.000, 200.000, 0.00, NULL, NULL, NULL, '2026-04-10 21:16:44', '2026-04-10 21:16:44'),
(36, 2, 13, 6, 7, 'transfer_out', 200.000, 200.000, 0.000, 0.00, NULL, NULL, NULL, '2026-04-10 21:28:07', '2026-04-10 21:28:07'),
(37, 2, 13, 5, 7, 'transfer_in', 200.000, 0.000, 200.000, 0.00, NULL, NULL, NULL, '2026-04-10 21:28:07', '2026-04-10 21:28:07'),
(38, 2, 13, 5, 7, 'transfer_out', 200.000, 200.000, 0.000, 0.00, NULL, NULL, NULL, '2026-04-10 21:28:28', '2026-04-10 21:28:28'),
(39, 2, 13, 6, 7, 'transfer_in', 200.000, 0.000, 200.000, 0.00, NULL, NULL, NULL, '2026-04-10 21:28:28', '2026-04-10 21:28:28'),
(40, 2, 13, 6, 7, 'transfer_out', 100.000, 200.000, 100.000, 0.00, NULL, NULL, 'used', '2026-04-10 21:31:36', '2026-04-10 21:31:36'),
(41, 2, 13, 5, 7, 'transfer_in', 100.000, 0.000, 100.000, 0.00, NULL, NULL, 'used', '2026-04-10 21:31:36', '2026-04-10 21:31:36'),
(42, 2, 13, 6, 7, 'transfer_out', 50.000, 100.000, 50.000, 0.00, NULL, NULL, 'used', '2026-04-10 21:39:45', '2026-04-10 21:39:45'),
(43, 2, 13, 5, 7, 'transfer_in', 50.000, 100.000, 150.000, 0.00, NULL, NULL, 'used', '2026-04-10 21:39:45', '2026-04-10 21:39:45'),
(44, 2, 13, 5, 7, 'out', 5.000, 200.000, 195.000, 0.00, 'App\\Models\\Sale', 17, 'فاتورة INV-20260411-0001', '2026-04-11 14:47:29', '2026-04-11 14:47:29'),
(45, 2, 13, 5, 7, 'out', 5.000, 195.000, 190.000, 0.00, 'App\\Models\\Sale', 18, 'فاتورة INV-20260411-0002', '2026-04-11 15:32:16', '2026-04-11 15:32:16'),
(46, 2, 13, 5, 7, 'in', 5.000, 190.000, 195.000, 0.00, 'App\\Models\\Purchase', 8, NULL, '2026-04-11 19:39:02', '2026-04-11 19:39:02'),
(47, 2, 13, 5, 7, 'in', 4.000, 195.000, 199.000, 0.00, 'App\\Models\\Purchase', 7, NULL, '2026-04-11 19:39:12', '2026-04-11 19:39:12'),
(48, 2, 14, NULL, 7, 'in', 400.000, 0.000, 400.000, 0.00, 'App\\Models\\Purchase', 9, NULL, '2026-04-11 20:26:19', '2026-04-11 20:26:19'),
(49, 2, 14, 6, 7, 'adjustment', 0.000, 0.000, 400.000, 0.00, NULL, NULL, NULL, '2026-04-11 20:30:07', '2026-04-11 20:30:07'),
(50, 2, 14, 6, 7, 'transfer_out', 200.000, 400.000, 200.000, 0.00, NULL, NULL, NULL, '2026-04-11 20:30:29', '2026-04-11 20:30:29'),
(51, 2, 14, 5, 7, 'transfer_in', 200.000, 0.000, 200.000, 0.00, NULL, NULL, NULL, '2026-04-11 20:30:29', '2026-04-11 20:30:29'),
(52, 2, 13, 6, 7, 'transfer_out', 5.001, 50.000, 44.999, 0.00, NULL, NULL, NULL, '2026-04-11 20:50:14', '2026-04-11 20:50:14'),
(53, 2, 13, 5, 7, 'transfer_in', 5.001, 149.000, 154.001, 0.00, NULL, NULL, NULL, '2026-04-11 20:50:14', '2026-04-11 20:50:14'),
(54, 2, 13, 6, 7, 'out', 5.000, 199.000, 194.000, 0.00, 'App\\Models\\Sale', 23, 'فاتورة INV-20260411-0003', '2026-04-11 21:17:24', '2026-04-11 21:17:24'),
(55, 2, 13, 6, 7, 'out', 5.000, 194.000, 189.000, 0.00, 'App\\Models\\Sale', 24, 'فاتورة INV-20260412-0001', '2026-04-11 22:15:29', '2026-04-11 22:15:29'),
(56, 2, 13, 5, 7, 'out', 100.000, 189.000, 89.000, 0.00, 'App\\Models\\Sale', 27, 'فاتورة INV-20260412-0002', '2026-04-11 22:51:05', '2026-04-11 22:51:05'),
(57, 2, 13, 6, 7, 'out', 5.000, 89.000, 84.000, 0.00, 'App\\Models\\Sale', 29, 'فاتورة INV-20260412-0003', '2026-04-12 11:09:13', '2026-04-12 11:09:13'),
(58, 2, 13, 6, 7, 'out', 1.000, 84.000, 83.000, 0.00, 'App\\Models\\Sale', 30, 'فاتورة INV-20260412-0004', '2026-04-12 11:39:35', '2026-04-12 11:39:35'),
(59, 2, 13, 6, 7, 'out', 1.000, 83.000, 82.000, 0.00, 'App\\Models\\Sale', 31, 'فاتورة INV-20260412-0005', '2026-04-12 12:01:04', '2026-04-12 12:01:04'),
(60, 2, 13, 6, 7, 'transfer_out', 0.999, 27.999, 27.000, 0.00, NULL, NULL, NULL, '2026-04-12 14:47:42', '2026-04-12 14:47:42'),
(61, 2, 13, 5, 7, 'transfer_in', 0.999, 54.001, 55.000, 0.00, NULL, NULL, NULL, '2026-04-12 14:47:42', '2026-04-12 14:47:42'),
(62, 2, 13, 6, 7, 'out', 2.000, 27.000, 25.000, 0.00, NULL, NULL, NULL, '2026-04-12 14:48:18', '2026-04-12 14:48:18');

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

--
-- Dumping data for table `stock_transfers`
--

INSERT INTO `stock_transfers` (`id`, `company_id`, `ref`, `from_warehouse_id`, `to_warehouse_id`, `product_id`, `qty`, `status`, `user_id`, `notes`, `created_at`, `updated_at`) VALUES
(1, 2, 'TRF-69D9844868AF9', 5, 6, 13, 100.000, 'completed', 7, 'used', '2026-04-10 21:14:16', '2026-04-10 21:14:16'),
(2, 2, 'TRF-69D987870CB0E', 6, 5, 13, 200.000, 'completed', 7, NULL, '2026-04-10 21:28:07', '2026-04-10 21:28:07'),
(3, 2, 'TRF-69D9879CBBB44', 5, 6, 13, 200.000, 'completed', 7, NULL, '2026-04-10 21:28:28', '2026-04-10 21:28:28'),
(4, 2, 'TRF-69D988588581F', 6, 5, 13, 100.000, 'completed', 7, 'used', '2026-04-10 21:31:36', '2026-04-10 21:31:36'),
(5, 2, 'TRF-69D98A41844A7', 6, 5, 13, 50.000, 'completed', 7, 'used', '2026-04-10 21:39:45', '2026-04-10 21:39:45'),
(6, 2, 'TRF-69DACB859E094', 6, 5, 14, 200.000, 'completed', 7, NULL, '2026-04-11 20:30:29', '2026-04-11 20:30:29'),
(7, 2, 'TRF-69DAD0261F50E', 6, 5, 13, 5.001, 'completed', 7, NULL, '2026-04-11 20:50:14', '2026-04-11 20:50:14'),
(8, 2, 'TRF-69DBCCAE60AB4', 6, 5, 13, 0.999, 'completed', 7, NULL, '2026-04-12 14:47:42', '2026-04-12 14:47:42');

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
(1, 2, 'ezz', NULL, 'company', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'cash', NULL, NULL, NULL, 0.00, NULL, 1, '2026-04-10 12:08:26', '2026-04-08 20:21:52', '2026-04-10 12:08:26', 0),
(2, 2, 'goher', NULL, 'company', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'cash', NULL, NULL, NULL, 0.00, NULL, 1, '2026-04-10 12:08:30', '2026-04-09 10:41:33', '2026-04-10 12:08:30', 0),
(3, 2, 'tarek', NULL, 'company', 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'cash', NULL, NULL, NULL, 0.00, NULL, 1, '2026-04-12 21:36:47', '2026-04-09 14:33:08', '2026-04-12 21:36:47', 0),
(4, 2, 'mohamed', NULL, 'company', 'active', 'g@gmail.com', '10101010', '1fdfd52', NULL, NULL, NULL, NULL, NULL, NULL, 'cash', 'cash', NULL, NULL, NULL, 0.00, 'saas', 1, NULL, '2026-04-10 12:08:10', '2026-04-12 22:40:43', 5),
(5, 2, 'sameh', NULL, 'company', 'active', 'taroka430@gmail.com', '01146109626', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'cash', NULL, NULL, NULL, 0.00, NULL, 1, '2026-04-12 22:29:32', '2026-04-11 19:36:45', '2026-04-12 22:29:32', 0),
(6, 2, 'فشق', NULL, 'company', 'active', NULL, '0123123123', 'ب2ب1ث', NULL, NULL, NULL, NULL, NULL, NULL, 'cash', 'cash', NULL, NULL, NULL, 0.00, NULL, 1, '2026-04-12 22:42:24', '2026-04-12 22:42:20', '2026-04-12 22:42:24', 4),
(7, 2, 'tarek', NULL, 'individual', 'active', 'taroka40@gmail.com', '01146109626', NULL, 'tarek', 'tarek', 'cairo', 'tarek', '01146109626', NULL, 'immediate', 'cash', NULL, NULL, 'lap top', 0.00, 'tarek', 1, NULL, '2026-04-12 23:47:04', '2026-04-12 23:48:28', 5),
(8, 2, 'goher', 'SUP-0008', 'individual', 'active', 'taroka330@gmail.com', '01146109626', NULL, 'egypt', 'cairo', '5 new cairo', 'goher', '01146109626', NULL, 'net_30', 'cash', NULL, NULL, 'done', 0.00, 'done', 1, NULL, '2026-04-12 23:58:00', '2026-04-12 23:58:00', 3),
(9, 2, 'mody', 'SUP-0009', 'company', 'suspended', 'taroka@gmail.com', '01146109626', NULL, 'mody', 'mody', 'mody', 'mody', '01146109626', NULL, 'net_90', 'deferred', NULL, NULL, 'lap', 0.00, '01146109626', 1, NULL, '2026-04-12 23:59:47', '2026-04-12 23:59:47', 1);

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
(1, 9, 2, 'payment', 2000.00, 'credit', -2000.00, '123123', NULL, 7, '2026-04-13 00:52:02', '2026-04-13 00:52:02'),
(2, 9, 2, 'adjustment', 20000.00, 'debit', 18000.00, NULL, 'df', 7, '2026-04-13 00:52:27', '2026-04-13 00:52:27'),
(3, 9, 2, 'adjustment', 2000.00, 'credit', 16000.00, NULL, 'fd', 7, '2026-04-13 00:52:35', '2026-04-13 00:52:35');

-- --------------------------------------------------------

--
-- Table structure for table `support_tickets`
--

CREATE TABLE `support_tickets` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED NOT NULL,
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `admin_reply` text DEFAULT NULL,
  `priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `category` varchar(255) NOT NULL DEFAULT 'general',
  `status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
  `is_escalated` tinyint(1) NOT NULL DEFAULT 0,
  `escalated_at` timestamp NULL DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `first_response_at` timestamp NULL DEFAULT NULL,
  `response_time_hours` int(11) DEFAULT NULL,
  `attachments` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`attachments`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `sla_policy_id` bigint(20) UNSIGNED DEFAULT NULL,
  `sla_breached` tinyint(1) NOT NULL DEFAULT 0,
  `resolution_due_at` timestamp NULL DEFAULT NULL,
  `first_response_due_at` timestamp NULL DEFAULT NULL,
  `assigned_to` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  `two_factor_enabled` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `company_id`, `name`, `email`, `phone`, `email_verified_at`, `password`, `is_active`, `last_login_at`, `is_super_admin`, `remember_token`, `created_at`, `updated_at`, `two_factor_secret`, `two_factor_enabled`) VALUES
(1, NULL, 'Super Admin', 'superadmin@codesphere.io', NULL, NULL, '$2y$12$FaFv0AX9Tzj9k9Jl.HCRXeOimE9VPC0aDuNDG/1tEnQanSV8KAOYK', 1, '2026-04-09 18:23:49', 1, NULL, '2026-04-08 17:38:06', '2026-04-09 18:23:49', NULL, 0),
(2, 1, 'Admin', 'admin@codesphere.io', NULL, NULL, '$2y$12$EAIQpTbMAA8rXtWZbfNU7OgRU94E4IyfLZ7X6SiAbvAYbpaQZHju.', 1, '2026-04-09 10:30:00', 0, NULL, '2026-04-08 17:38:06', '2026-04-09 10:30:00', NULL, 0),
(3, 1, 'فاطمة محاسبة', 'fatma@codesphere.io', NULL, NULL, '$2y$12$qrr5k7rFWXoHjZUz/EbMwODl7Kot3M70W/sMpe76I6uVmTyRZEKyW', 1, NULL, 0, NULL, '2026-04-08 17:38:07', '2026-04-08 17:38:07', NULL, 0),
(4, 1, 'محمد مخازن', 'mohamad@codesphere.io', NULL, NULL, '$2y$12$tqQnnd6zFE2X2liTMFH23u/xdA1jNd9uHhwZjktPyL8A4x.UU8uS2', 1, NULL, 0, NULL, '2026-04-08 17:38:08', '2026-04-08 17:38:08', NULL, 0),
(5, 1, 'سارة كاشير', 'sara@codesphere.io', NULL, NULL, '$2y$12$xF.VruNQfVdvms3I888ig.ykdSmwvJESvMftszsawUUu/ZPx3qBBC', 1, NULL, 0, NULL, '2026-04-08 17:38:08', '2026-04-08 17:38:08', NULL, 0),
(6, 1, 'خالد مبيعات', 'khaled@codesphere.io', NULL, NULL, '$2y$12$J810AgIVdOva/tL3TLKzb.JI3kU26xFKiUIHoXgVnN5381vUjcff2', 1, NULL, 0, NULL, '2026-04-08 17:38:09', '2026-04-08 17:38:09', NULL, 0),
(7, 2, 'ezz', 'goher@gmail.com', '101010101010', NULL, '$2y$12$UTKCF3/DoHz3LNA/Y2jv3uuqKtDxaQG5NOpTKZ2aLNPu/v2QalQeS', 1, '2026-04-13 00:31:22', 0, NULL, '2026-04-08 19:45:55', '2026-04-13 00:31:22', NULL, 0),
(8, 2, 'aziz', 'aziz@a.com', 'goher@gmail.com', NULL, '$2y$12$hvWW4UtHWvnzYFAzPoxfDez/4KHIXT7y9aUvD0HeK/TcdTbTp7cke', 1, '2026-04-09 19:22:11', 0, NULL, '2026-04-09 19:21:42', '2026-04-09 19:22:11', NULL, 0);

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
(5, 2, 'المخزن الرائيسي', 'القاهره', NULL, 0, 1, '2026-04-10 21:01:29', '2026-04-10 21:01:29'),
(6, 2, 'شمال الدلتا', 'شمال الدلتا', NULL, 0, 1, '2026-04-10 21:02:34', '2026-04-10 21:45:52');

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
-- Indexes for table `appraisals`
--
ALTER TABLE `appraisals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `appraisals_company_id_foreign` (`company_id`),
  ADD KEY `appraisals_employee_id_foreign` (`employee_id`);

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
-- Indexes for table `bank_statements`
--
ALTER TABLE `bank_statements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bank_statements_company_id_foreign` (`company_id`),
  ADD KEY `bank_statements_account_id_foreign` (`account_id`),
  ADD KEY `bank_statements_journal_entry_id_foreign` (`journal_entry_id`);

--
-- Indexes for table `bom_items`
--
ALTER TABLE `bom_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bom_items_company_id_foreign` (`company_id`),
  ADD KEY `bom_items_product_id_foreign` (`product_id`),
  ADD KEY `bom_items_component_id_foreign` (`component_id`);

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
-- Indexes for table `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `companies_email_unique` (`email`);

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
  ADD KEY `knowledge_articles_company_id_foreign` (`company_id`);

--
-- Indexes for table `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leave_requests_employee_id_foreign` (`employee_id`),
  ADD KEY `leave_requests_approved_by_foreign` (`approved_by`),
  ADD KEY `leave_requests_company_id_status_index` (`company_id`,`status`);

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
  ADD KEY `idx_purchase_items_product` (`product_id`),
  ADD KEY `purchase_items_warehouse_id_foreign` (`warehouse_id`);

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
  ADD KEY `support_tickets_sla_policy_id_foreign` (`sla_policy_id`),
  ADD KEY `support_tickets_company_id_status_index` (`company_id`,`status`),
  ADD KEY `support_tickets_company_id_priority_index` (`company_id`,`priority`),
  ADD KEY `support_tickets_assigned_to_foreign` (`assigned_to`);

--
-- Indexes for table `tax_rates`
--
ALTER TABLE `tax_rates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tax_rates_company_id_index` (`company_id`);

--
-- Indexes for table `ticket_messages`
--
ALTER TABLE `ticket_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ticket_messages_ticket_id_foreign` (`ticket_id`),
  ADD KEY `ticket_messages_user_id_foreign` (`user_id`);

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
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `api_keys`
--
ALTER TABLE `api_keys`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `appraisals`
--
ALTER TABLE `appraisals`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `attendances`
--
ALTER TABLE `attendances`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

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
-- AUTO_INCREMENT for table `bank_statements`
--
ALTER TABLE `bank_statements`
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
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

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
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `companies`
--
ALTER TABLE `companies`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

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
-- AUTO_INCREMENT for table `currencies`
--
ALTER TABLE `currencies`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `erp_notifications`
--
ALTER TABLE `erp_notifications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `escalation_rules`
--
ALTER TABLE `escalation_rules`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `fixed_assets`
--
ALTER TABLE `fixed_assets`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

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
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `job_positions`
--
ALTER TABLE `job_positions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `journal_entries`
--
ALTER TABLE `journal_entries`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `journal_entry_lines`
--
ALTER TABLE `journal_entry_lines`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `knowledge_articles`
--
ALTER TABLE `knowledge_articles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `leave_requests`
--
ALTER TABLE `leave_requests`
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
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

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
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=94;

--
-- AUTO_INCREMENT for table `pipeline_stages`
--
ALTER TABLE `pipeline_stages`
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
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `product_locations`
--
ALTER TABLE `product_locations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `product_lots`
--
ALTER TABLE `product_lots`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `project_tasks`
--
ALTER TABLE `project_tasks`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `purchases`
--
ALTER TABLE `purchases`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `purchase_invoices`
--
ALTER TABLE `purchase_invoices`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `purchase_items`
--
ALTER TABLE `purchase_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `sales`
--
ALTER TABLE `sales`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `sale_items`
--
ALTER TABLE `sale_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `sale_payments`
--
ALTER TABLE `sale_payments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

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
-- AUTO_INCREMENT for table `stock_movements`
--
ALTER TABLE `stock_movements`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=63;

--
-- AUTO_INCREMENT for table `stock_transfers`
--
ALTER TABLE `stock_transfers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `subscriptions`
--
ALTER TABLE `subscriptions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `supplier_ledger`
--
ALTER TABLE `supplier_ledger`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `support_tickets`
--
ALTER TABLE `support_tickets`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tax_rates`
--
ALTER TABLE `tax_rates`
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
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

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
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

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
-- Constraints for table `appraisals`
--
ALTER TABLE `appraisals`
  ADD CONSTRAINT `appraisals_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appraisals_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE;

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
-- Constraints for table `bank_statements`
--
ALTER TABLE `bank_statements`
  ADD CONSTRAINT `bank_statements_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bank_statements_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bank_statements_journal_entry_id_foreign` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `bom_items`
--
ALTER TABLE `bom_items`
  ADD CONSTRAINT `bom_items_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bom_items_component_id_foreign` FOREIGN KEY (`component_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
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
  ADD CONSTRAINT `knowledge_articles_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD CONSTRAINT `leave_requests_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `leave_requests_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `leave_requests_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE;

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
  ADD CONSTRAINT `purchase_items_purchase_id_foreign` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `purchase_items_warehouse_id_foreign` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE SET NULL;

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
  ADD CONSTRAINT `support_tickets_sla_policy_id_foreign` FOREIGN KEY (`sla_policy_id`) REFERENCES `sla_policies` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `ticket_messages`
--
ALTER TABLE `ticket_messages`
  ADD CONSTRAINT `ticket_messages_ticket_id_foreign` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ticket_messages_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

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
-- Constraints for table `work_orders`
--
ALTER TABLE `work_orders`
  ADD CONSTRAINT `work_orders_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `work_orders_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
