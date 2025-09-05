const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send welcome email
const sendWelcomeEmail = async (email, username, householdName) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Royal Groceries <noreply@royalgroceries.com>',
      to: email,
      subject: 'Welcome to Royal Groceries! 👑',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #fce7f3, #f9a8d4); border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #9d174d; margin: 0; font-size: 28px;">👑 Welcome to Royal Groceries!</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #9d174d; margin-top: 0;">Hello ${username}!</h2>
            
            <p style="color: #374151; line-height: 1.6; font-size: 16px;">
              Welcome to the <strong>${householdName}</strong> household! You can now access your shared grocery inventory, 
              leave notes for your family, and participate in household discussions.
            </p>
            
            <div style="background: #fef3f2; padding: 20px; border-radius: 8px; border-left: 4px solid #f9a8d4; margin: 20px 0;">
              <h3 style="color: #9d174d; margin-top: 0;">What you can do:</h3>
              <ul style="color: #374151; line-height: 1.8;">
                <li>📝 Add and manage grocery items</li>
                <li>💭 Leave notes for your household</li>
                <li>🗨️ Participate in household discussions</li>
                <li>🔍 Search and filter your inventory</li>
                <li>📱 Access from any device</li>
              </ul>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
              If you have any questions, feel free to reach out to your household admin.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #9d174d; font-size: 14px;">
            Made with ❤ for the royal household
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, username, resetToken) => {
  try {
    const transporter = createTransporter();
    const resetUrl = `${process.env.CORS_ORIGIN}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Royal Groceries <noreply@royalgroceries.com>',
      to: email,
      subject: 'Reset Your Royal Groceries Password 🔐',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #fce7f3, #f9a8d4); border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #9d174d; margin: 0; font-size: 28px;">🔐 Password Reset</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #9d174d; margin-top: 0;">Hello ${username}!</h2>
            
            <p style="color: #374151; line-height: 1.6; font-size: 16px;">
              You requested to reset your password for Royal Groceries. Click the button below to create a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #ec4899; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <div style="background: #fef3f2; padding: 15px; border-radius: 8px; border-left: 4px solid #f9a8d4;">
              <p style="color: #7f1d1d; margin: 0; font-size: 14px;">
                <strong>Security Note:</strong> This link will expire in 1 hour. If you didn't request this reset, 
                please ignore this email and your password will remain unchanged.
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #ec4899; word-break: break-all;">${resetUrl}</a>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #9d174d; font-size: 14px;">
            Made with ❤ for the royal household
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail
};
