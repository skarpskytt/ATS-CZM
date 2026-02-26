<?php

namespace App\Notifications;

use App\Models\Applicant;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class ApplicantStatusUpdated extends Notification
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
            ->subject('Application status updated')
            ->greeting('Hi ' . $this->applicant->first_name . ',')
            ->line('Your application status has been updated.')
            ->line('New status: ' . $this->applicant->status)
            ->line('If you have questions, reply to this email.');
    }
}
