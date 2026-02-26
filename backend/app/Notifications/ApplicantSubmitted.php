<?php

namespace App\Notifications;

use App\Models\Applicant;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class ApplicantSubmitted extends Notification
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
            ->subject('New applicant submission')
            ->greeting('Hello')
            ->line('A new applicant has submitted an application.')
            ->line('Name: ' . $this->applicant->first_name . ' ' . $this->applicant->last_name)
            ->line('Position: ' . $this->applicant->position_applied_for)
            ->line('Email: ' . $this->applicant->email_address)
            ->line('Contact: ' . $this->applicant->contact_number)
            ->line('Status: ' . $this->applicant->status);
    }
}
