<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AdminResetPasswordNotification extends Notification
{
    use Queueable;

    public function __construct(private string $token)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $frontendBase = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');
        $email = urlencode($notifiable->getEmailForPasswordReset());
        $token = urlencode($this->token);
        $resetUrl = "{$frontendBase}/admin/reset-password?token={$token}&email={$email}";

        return (new MailMessage)
            ->subject('Reset your password')
            ->line('We received a request to reset the password for your account.')
            ->action('Reset password', $resetUrl)
            ->line('If you did not request a password reset, no further action is required.');
    }
}
