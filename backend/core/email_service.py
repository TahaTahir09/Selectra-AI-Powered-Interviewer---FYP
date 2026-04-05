"""
Email service for sending candidate notifications
Handles acceptance and rejection emails with interview links
"""
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def send_interview_invitation_email(candidate_email, candidate_name, job_title, interview_link, organization_name=None):
    """
    Send interview invitation email to candidate with interview link.
    
    Args:
        candidate_email: Email address of the candidate
        candidate_name: Full name of the candidate
        job_title: Title of the job position
        interview_link: Direct link to start the interview
        organization_name: Name of the organization (optional)
    """
    try:
        subject = f"Interview Invitation for {job_title} at Selectra AI"
        
        # Build the email message
        html_message = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
                <div style="background-color: white; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h2 style="color: #333; margin-bottom: 20px;">🎉 Interview Invitation</h2>
                    
                    <p style="color: #555; font-size: 16px; line-height: 1.6;">
                        Hi <strong>{candidate_name}</strong>,
                    </p>
                    
                    <p style="color: #555; font-size: 16px; line-height: 1.6;">
                        Congratulations! Your CV matches well with the <strong>{job_title}</strong> position. 
                        We're excited to invite you to participate in our AI-powered interview assessment.
                    </p>
                    
                    <div style="background-color: #f0f7ff; padding: 20px; border-left: 4px solid #6366f1; margin: 20px 0; border-radius: 4px;">
                        <p style="color: #333; margin: 0; font-size: 14px;">
                            📋 <strong>Interview Details:</strong><br>
                            • Position: {job_title}<br>
                            • Organization: {organization_name or 'Selectra AI'}<br>
                            • Type: AI-Powered Assessment Interview<br>
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{interview_link}" style="display: inline-block; background-color: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                            Start Interview Now
                        </a>
                    </div>
                    
                    <p style="color: #555; font-size: 14px; line-height: 1.6;">
                        <strong>What to expect:</strong><br>
                        The interview will take approximately 15-20 minutes and will assess your skills, experience, and suitability for the role. 
                        You can take the interview at your convenience within the next 7 days.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    
                    <p style="color: #888; font-size: 12px; line-height: 1.6;">
                        If you have any questions or encounter issues, please don't hesitate to reach out to us.<br>
                        <br>
                        Best regards,<br>
                        <strong>Selectra AI Team</strong>
                    </p>
                </div>
            </body>
        </html>
        """
        
        # Send the email
        send_mail(
            subject=subject,
            message=f"Hi {candidate_name},\n\nCongratulations! Your CV matches well with the {job_title} position. Please visit the link below to start your AI-powered interview:\n\n{interview_link}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[candidate_email],
            html_message=html_message,
            fail_silently=False,
        )
        
        logger.info(f"✓ Interview invitation sent to {candidate_email}")
        return True
        
    except Exception as e:
        logger.error(f"✗ Error sending interview invitation to {candidate_email}: {str(e)}")
        return False


def send_rejection_email(candidate_email, candidate_name, job_title, organization_name=None):
    """
    Send rejection email to candidate with feedback on their application.
    
    Args:
        candidate_email: Email address of the candidate
        candidate_name: Full name of the candidate
        job_title: Title of the job position
        organization_name: Name of the organization (optional)
    """
    try:
        subject = f"Update on Your Application for {job_title}"
        
        html_message = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
                <div style="background-color: white; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h2 style="color: #333; margin-bottom: 20px;">Update on Your Application</h2>
                    
                    <p style="color: #555; font-size: 16px; line-height: 1.6;">
                        Hi <strong>{candidate_name}</strong>,
                    </p>
                    
                    <p style="color: #555; font-size: 16px; line-height: 1.6;">
                        Thank you for your interest in the <strong>{job_title}</strong> position at <strong>{organization_name or 'Selectra AI'}</strong>. 
                        We appreciate the time you took to apply.
                    </p>
                    
                    <div style="background-color: #fff3cd; padding: 20px; border-left: 4px solid #ff9800; margin: 20px 0; border-radius: 4px;">
                        <p style="color: #333; margin: 0; font-size: 14px;">
                            After careful review of your application and CV, we've decided to move forward with other candidates whose experience more closely aligns with our current needs.
                        </p>
                    </div>
                    
                    <p style="color: #555; font-size: 14px; line-height: 1.6;">
                        <strong>We encourage you to:</strong><br>
                        • Continue developing your skills in the technologies relevant to this role<br>
                        • Gain more experience in related areas<br>
                        • Keep an eye on our careers page for future opportunities<br>
                    </p>
                    
                    <p style="color: #555; font-size: 14px; line-height: 1.6;">
                        Your experience and background are valuable, and we believe you'll find opportunities that are a better match. 
                        Please feel free to apply to other positions on our careers page that might suit your profile.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    
                    <p style="color: #888; font-size: 12px; line-height: 1.6;">
                        If you have any questions, feel free to reach out to us.<br>
                        <br>
                        Best of luck with your career growth!<br>
                        <strong>Selectra AI Team</strong>
                    </p>
                </div>
            </body>
        </html>
        """
        
        # Send the email
        send_mail(
            subject=subject,
            message=f"Hi {candidate_name},\n\nThank you for your interest in the {job_title} position. After reviewing your application, we've decided to move forward with other candidates. We wish you all the best with your career.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[candidate_email],
            html_message=html_message,
            fail_silently=False,
        )
        
        logger.info(f"✓ Rejection email sent to {candidate_email}")
        return True
        
    except Exception as e:
        logger.error(f"✗ Error sending rejection email to {candidate_email}: {str(e)}")
        return False

