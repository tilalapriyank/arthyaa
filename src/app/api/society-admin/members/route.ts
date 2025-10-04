import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { handleFileUpload, validateFile } from '@/lib/upload';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract form data
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;
    const flatNumber = formData.get('flatNumber') as string;
    const blockNumber = formData.get('blockNumber') as string;
    const memberType = formData.get('memberType') as 'OWNER' | 'TENANT';
    const isSecretary = formData.get('isSecretary') === 'true';
    const isActive = formData.get('isActive') === 'true';
    
    // Get society admin's society ID from session
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Get user from session (you'll need to implement proper session handling)
    // For now, we'll use a placeholder
    const societyId = 'society-id-placeholder'; // Replace with actual society ID from session

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !address || !flatNumber || !blockNumber) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields' 
      }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ 
        success: false, 
        message: 'Email already exists' 
      }, { status: 400 });
    }

    // Handle file uploads for tenants
    let agreementDocumentPath = null;
    let policyVerificationDocumentPath = null;

    if (memberType === 'TENANT') {
      const agreementDocument = formData.get('agreementDocument') as File;
      const policyVerificationDocument = formData.get('policyVerificationDocument') as File;

      if (!agreementDocument || !policyVerificationDocument) {
        return NextResponse.json({ 
          success: false, 
          message: 'Required documents missing for tenant' 
        }, { status: 400 });
      }

      // Validate agreement document
      const agreementValidation = validateFile(agreementDocument, 
        ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'], 
        10
      );
      if (!agreementValidation.isValid) {
        return NextResponse.json(
          { success: false, message: `Agreement document: ${agreementValidation.error}` },
          { status: 400 }
        );
      }

      // Validate policy verification document
      const policyValidation = validateFile(policyVerificationDocument, 
        ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'], 
        10
      );
      if (!policyValidation.isValid) {
        return NextResponse.json(
          { success: false, message: `Policy verification document: ${policyValidation.error}` },
          { status: 400 }
        );
      }

      // Upload agreement document
      const agreementUploadResult = await handleFileUpload(agreementDocument, 'documents');
      if (!agreementUploadResult.success) {
        return NextResponse.json(
          { success: false, message: `Agreement document upload failed: ${agreementUploadResult.error}` },
          { status: 500 }
        );
      }
      agreementDocumentPath = agreementUploadResult.filePath;

      // Upload policy verification document
      const policyUploadResult = await handleFileUpload(policyVerificationDocument, 'documents');
      if (!policyUploadResult.success) {
        return NextResponse.json(
          { success: false, message: `Policy verification document upload failed: ${policyUploadResult.error}` },
          { status: 500 }
        );
      }
      policyVerificationDocumentPath = policyUploadResult.filePath;
    }

    // Create the member
    const member = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        role: 'MEMBER',
        status: isActive ? 'ACTIVE' : 'INACTIVE',
        isSecretary,
        memberType,
        flatNumber,
        blockNumber,
        agreementDocument: agreementDocumentPath,
        policyVerificationDocument: policyVerificationDocumentPath,
        societyId,
        // Set up OTP verification for member login
        isOtpVerified: false,
        isEmailVerified: false,
        // Generate a temporary password for initial setup
        password: null, // Members will use OTP login
      }
    });

    // Send welcome email with OTP login instructions
    await sendMemberWelcomeEmail(email, firstName, lastName, flatNumber, blockNumber);

    return NextResponse.json({
      success: true,
      message: 'Member added successfully',
      member: {
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone,
        flatNumber: member.flatNumber,
        blockNumber: member.blockNumber,
        memberType: member.memberType,
        isSecretary: member.isSecretary,
        isActive: member.status === 'ACTIVE'
      }
    });

  } catch (error) {
    console.error('Error adding member:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to add member' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Send welcome email for new members
async function sendMemberWelcomeEmail(email: string, firstName: string, lastName: string, flatNumber: string, blockNumber: string): Promise<boolean> {
  try {
    const { createTransporter } = await import('@/lib/email');
    
    const transporter = createTransporter();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const subject = 'Welcome to Your Society - Arthyaa Member Portal';

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
          .member-info { background: #fff; padding: 15px; border-left: 4px solid #4f46e5; margin: 20px 0; }
          .login-info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; }
          .login-button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Arthyaa</h1>
          </div>
          <div class="content">
            <h2>Welcome to Your Society Portal</h2>
            <p>Hi ${firstName},</p>
            <p>Welcome to your society's member portal! You have been successfully added as a member of your society.</p>
            
            <div class="member-info">
              <h3>Your Member Information:</h3>
              <p><strong>Name:</strong> ${firstName} ${lastName}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Flat Number:</strong> ${flatNumber}</p>
              <p><strong>Block Number:</strong> ${blockNumber}</p>
            </div>

            <div class="login-info">
              <h3>How to Access Your Portal</h3>
              <p>You can access your member portal using OTP (One-Time Password) authentication:</p>
              <ol style="text-align: left; max-width: 400px; margin: 0 auto;">
                <li>Visit the member login page</li>
                <li>Enter your email address</li>
                <li>Request an OTP to be sent to your registered phone number</li>
                <li>Enter the OTP to log in</li>
              </ol>
              <a href="${frontendUrl}/member/login" class="login-button">Access Member Portal</a>
            </div>

            <p>As a member, you can:</p>
            <ul>
              <li>View your dues and payment history</li>
              <li>Receive society announcements</li>
              <li>Access important documents</li>
              <li>Contact society administration</li>
            </ul>

            <p>If you have any questions, please contact your society administration.</p>
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

      Welcome to your society's member portal! You have been successfully added as a member of your society.

      Your Member Information:
      Name: ${firstName} ${lastName}
      Email: ${email}
      Flat Number: ${flatNumber}
      Block Number: ${blockNumber}

      How to Access Your Portal:
      You can access your member portal using OTP (One-Time Password) authentication:
      1. Visit the member login page
      2. Enter your email address
      3. Request an OTP to be sent to your registered phone number
      4. Enter the OTP to log in

      Access your portal at: ${frontendUrl}/member/login

      As a member, you can:
      - View your dues and payment history
      - Receive society announcements
      - Access important documents
      - Contact society administration

      If you have any questions, please contact your society administration.

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
    console.log('Member welcome email sent:', result.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send member welcome email:', error);
    return false;
  }
}
