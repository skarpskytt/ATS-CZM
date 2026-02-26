<?php

namespace App\Notifications;

use App\Models\Applicant;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class ApplicantSubmissionReceived extends Notification
{
    use Queueable;

    public function __construct(private readonly Applicant $applicant)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject('We received your application')
            ->greeting('Hi ' . $this->applicant->first_name . ',')
            ->line('Thank you for applying for ' . $this->applicant->position_applied_for . '.')
            ->line('We will review your application and update you via email.')
            ->line('Current status: ' . $this->applicant->status);
    }
}
