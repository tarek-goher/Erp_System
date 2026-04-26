<?php return array (
  'Illuminate\\Foundation\\Support\\Providers\\EventServiceProvider' => 
  array (
    'App\\Events\\CompanySettingsUpdated' => 
    array (
      0 => 'App\\Listeners\\InvalidateSlaCache@handle',
    ),
    'App\\Events\\TicketCreated' => 
    array (
      0 => 'App\\Listeners\\NotifyAdminTicketCreated@handle',
    ),
    'App\\Events\\PayrollGenerated' => 
    array (
      0 => 'App\\Listeners\\NotifyPayrollGenerated@handle',
    ),
    'App\\Events\\TicketAssigned' => 
    array (
      0 => 'App\\Listeners\\NotifyTicketAssignee@handle',
    ),
    'App\\Events\\StockLowAlert' => 
    array (
      0 => 'App\\Listeners\\SendLowStockAlert@handle',
    ),
    'App\\Events\\SaleCreated' => 
    array (
      0 => 'App\\Listeners\\SendSaleNotification@handle',
    ),
  ),
);