// src/utils/emailService.js
import emailjs from '@emailjs/browser';

emailjs.init("JenhBeqLP74DilWrT");

export const sendAccountEmail = async (userEmail, isBanned) => {
  try {
    const templateParams = {
      to_email: userEmail,
      subject: isBanned ? "Account Ban Notification" : "Account Restored",
      content: isBanned 
        ? "Your account has been banned due to violation of our terms of service. If you believe this is a mistake, please contact our support team." 
        : "Your account has been unbanned and restored to full functionality. You can now log in and use all features of our platform.",
    };

    const result = await emailjs.send(
      "service_4ipsijq",
      "template_lmsrde1",
      templateParams
    );

    if (result.status === 200) {
      return { success: true };
    } else {
      throw new Error('Failed to send email');
    }
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email notification');
  }
};