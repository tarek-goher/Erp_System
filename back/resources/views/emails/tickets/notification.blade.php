<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subject }}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 20px; direction: rtl; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .header { background: #2563eb; padding: 28px 32px; color: #fff; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
        .header p  { margin: 6px 0 0; font-size: 13px; opacity: 0.85; }
        .badge { display: inline-block; background: rgba(255,255,255,0.2); border-radius: 4px; padding: 3px 10px; font-size: 12px; margin-top: 10px; }
        .body { padding: 28px 32px; }
        .greeting { font-size: 15px; color: #374151; margin-bottom: 16px; }
        .info-box { background: #f8fafc; border-right: 4px solid #2563eb; border-radius: 4px; padding: 14px 16px; margin: 16px 0; }
        .info-box p { margin: 4px 0; font-size: 13px; color: #64748b; }
        .info-box strong { color: #1e293b; }
        .reply-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 16px; margin: 16px 0; font-size: 14px; color: #0c4a6e; white-space: pre-wrap; }
        .btn { display: inline-block; background: #2563eb; color: #fff !important; text-decoration: none; padding: 11px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; margin-top: 20px; }
        .footer { background: #f8fafc; padding: 16px 32px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>{{ $eventLabel }}</h1>
        <p>نظام الدعم الفني</p>
        <span class="badge">{{ $ticketNumber }}</span>
    </div>
    <div class="body">
        <p class="greeting">مرحباً {{ $recipientName }}،</p>

        @if($event === 'ticket_opened')
            <p style="color:#374151;font-size:14px;">تم استلام طلب الدعم الخاص بك بنجاح. سيقوم فريقنا بالمتابعة معك في أقرب وقت ممكن.</p>
        @elseif($event === 'ticket_resolved')
            <p style="color:#374151;font-size:14px;">يسعدنا إبلاغك بأنه تم حل طلبك. إذا كنت تواجه أي مشكلة أخرى، لا تتردد في التواصل معنا.</p>
        @elseif($event === 'ticket_reply')
            <p style="color:#374151;font-size:14px;">أضاف فريق الدعم رداً جديداً على طلبك:</p>
            @if($replyBody)
                <div class="reply-box">{{ $replyBody }}</div>
            @endif
        @elseif($event === 'ticket_assigned')
            <p style="color:#374151;font-size:14px;">يعمل أحد متخصصينا الآن على طلبك وسيتواصل معك قريباً.</p>
        @endif

        <div class="info-box">
            <p><strong>رقم الطلب:</strong> {{ $ticketNumber }}</p>
            <p><strong>الموضوع:</strong> {{ $ticket->subject }}</p>
            <p><strong>الأولوية:</strong>
                @switch($ticket->priority)
                    @case('urgent') عاجل @break
                    @case('high')   مرتفعة @break
                    @case('medium') متوسطة @break
                    @default        منخفضة
                @endswitch
            </p>
            <p><strong>الحالة:</strong>
                @switch($ticket->status)
                    @case('open')         مفتوح @break
                    @case('assigned')     تم التعيين @break
                    @case('in_progress')  قيد المعالجة @break
                    @case('waiting_user') في انتظارك @break
                    @case('resolved')     تم الحل @break
                    @case('closed')       مغلق @break
                    @default              {{ $ticket->status }}
                @endswitch
            </p>
        </div>

        <a href="{{ $ticketUrl }}" class="btn">عرض التذكرة</a>
    </div>
    <div class="footer">
        هذا البريد أُرسل تلقائياً، يرجى عدم الرد عليه مباشرة.
        &nbsp;·&nbsp; {{ config('app.name') }}
    </div>
</div>
</body>
</html>
