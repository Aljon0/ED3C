// utils/emailService.js
export const sendBanNotificationEmail = async (userEmail) => {
    try {
      // Placeholder: integrate with Firebase Functions, SendGrid, or Nodemailer to send an email.
      // Example (Nodemailer, Firebase Cloud Function):
      await someEmailSendingFunction(userEmail, {
        subject: "Account Banned - Policy Violation",
        text: "Your account has been banned due to a violation of our policies.",
      });
    } catch (error) {
      console.error("Error sending email: ", error);
    }
  };
  