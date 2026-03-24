<?php

namespace App\Notifications;

use App\Models\Applicant;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class ApplicantSubmissionReceived extends Notification
{
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
            ->subject('✓ Application Received - Czark Mak Corporation')
            ->greeting('Hi ' . $this->applicant->first_name . ',')
            ->line('🎉 **Thank you for applying!**')
            ->line('')
            ->line('We have successfully received your application for the **' . $this->applicant->position_applied_for . '** position.')
            ->line('')
            ->line('**What happens next?**')
            ->line('✓ Our recruitment team will review your application')
            ->line('✓ We will evaluate your qualifications and experience')
            ->line('✓ If you match our requirements, we will contact you for an interview')
            ->line('')
            ->line('**Application Details:**')
            ->line('Position: **' . $this->applicant->position_applied_for . '**')
            ->line('Status: **' . ucfirst($this->applicant->status) . '**')
            ->line('Submitted: **' . now()->format('F d, Y \a\t h:i A') . '**')
            ->line('')
            ->line('If you have any questions, feel free to reach out to our HR team.')
            ->line('')
            ->action('View Application Portal', url('/'))
            ->line('')
            ->line('Best regards,')
            ->line('**Czark Mak Corporation Recruitment Team**');
    }
}
