import nodemailer from 'nodemailer';

// Email configuration interface
interface EmailConfig {
  host: string;
  port: number;
  secure?: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Email template interface
interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Create email transporter
function createTransporter(): nodemailer.Transporter {
  const config: EmailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  };

  if (!config.auth.user || !config.auth.pass) {
    throw new Error('SMTP credentials not configured');
  }

  return nodemailer.createTransport(config);
}

// Password reset email template
function createPasswordResetTemplate(resetLink: string, userEmail: string): EmailTemplate {
  const subject = 'Reset Your Arthyaa Password';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your Password</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button {
          display: inline-block;
          background: #4f46e5;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
        }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Arthyaa Password Reset</h1>
        </div>
        <div class="content">
          <h2>Reset Your Password</h2>
          <p>Hi there,</p>
          <p>You requested to reset your password for your Arthyaa account (${userEmail}).</p>
          <p>Click the button below to set a new password:</p>
          <a href="${resetLink}" class="button">Reset Password</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #4f46e5;">${resetLink}</p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request this password reset, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>This is an automated email from Arthyaa. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Reset Your Arthyaa Password

    Hi there,

    You requested to reset your password for your Arthyaa account (${userEmail}).

    Click this link to set a new password: ${resetLink}

    This link will expire in 1 hour.

    If you didn't request this password reset, please ignore this email.

    This is an automated email from Arthyaa.
  `;

  return { subject, html, text };
}

// Email verification template
function createEmailVerificationTemplate(verificationLink: string, userEmail: string): EmailTemplate {
  const subject = 'Verify Your Arthyaa Email Address';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verify Your Email</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button {
          display: inline-block;
          background: #4f46e5;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
        }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Arthyaa</h1>
        </div>
        <div class="content">
          <h2>Verify Your Email Address</h2>
          <p>Hi there,</p>
          <p>Thank you for registering with Arthyaa!</p>
          <p>Please verify your email address (${userEmail}) by clicking the button below:</p>
          <a href="${verificationLink}" class="button">Verify Email</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #4f46e5;">${verificationLink}</p>
          <p>If you didn't create an account with Arthyaa, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>This is an automated email from Arthyaa. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Welcome to Arthyaa

    Hi there,

    Thank you for registering with Arthyaa!

    Please verify your email address (${userEmail}) by clicking this link: ${verificationLink}

    If you didn't create an account with Arthyaa, please ignore this email.

    This is an automated email from Arthyaa.
  `;

  return { subject, html, text };
}

// Send password reset email
export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    const transporter = createTransporter();
    const template = createPasswordResetTemplate(resetLink, email);

    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', result.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
}

// Send email verification email
export async function sendEmailVerification(email: string, verificationToken: string): Promise<boolean> {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;

    const transporter = createTransporter();
    const template = createEmailVerificationTemplate(verificationLink, email);

    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email verification sent:', result.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
}

// Send welcome email for new admin users
export async function sendWelcomeEmail(email: string, firstName: string, tempPassword?: string): Promise<boolean> {
  try {
    const transporter = createTransporter();

    const subject = 'Welcome to Arthyaa - Admin Account Created';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Arthyaa</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .credentials { background: #fff; padding: 15px; border-left: 4px solid #4f46e5; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Arthyaa</h1>
          </div>
          <div class="content">
            <h2>Admin Account Created</h2>
            <p>Hi ${firstName},</p>
            <p>Your admin account has been successfully created for the Arthyaa system.</p>
            ${tempPassword ? `
            <div class="credentials">
              <h3>Your Login Credentials:</h3>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Temporary Password:</strong> ${tempPassword}</p>
              <p><em>Please change your password after your first login.</em></p>
            </div>
            ` : ''}
            <p>You can now access the admin dashboard at: ${process.env.FRONTEND_URL}/admin/dashboard</p>
            <p>If you have any questions, please contact the system administrator.</p>
          </div>
          <div class="footer">
            <p>This is an automated email from Arthyaa. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to Arthyaa

      Hi ${firstName},

      Your admin account has been successfully created for the Arthyaa system.

      ${tempPassword ? `Your Login Credentials:
      Email: ${email}
      Temporary Password: ${tempPassword}

      Please change your password after your first login.` : ''}

      You can now access the admin dashboard at: ${process.env.FRONTEND_URL}/admin/dashboard

      If you have any questions, please contact the system administrator.

      This is an automated email from Arthyaa.
    `;

    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: email,
      subject,
      text,
      html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', result.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}

// Test email configuration
export async function testEmailConnection(): Promise<boolean> {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email connection test successful');
    return true;
  } catch (error) {
    console.error('Email connection test failed:', error);
    return false;
  }
}