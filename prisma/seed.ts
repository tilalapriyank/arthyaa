import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create a sample society first
  const society = await prisma.society.upsert({
    where: { id: 'sample-society-1' },
    update: {},
    create: {
      id: 'sample-society-1',
      name: 'Green Valley Society',
      address: '123 Green Valley Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
    },
  });

  console.log('✅ Created sample society:', society.name);

  // Create Admin (Developer) user with your email
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'priyank1504patel@gmail.com' },
    update: {},
    create: {
      email: 'priyank1504patel@gmail.com',
      password: adminPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      firstName: 'Priyank',
      lastName: 'Patel',
      isEmailVerified: true,
    },
  });

  console.log('✅ Created Admin user:', admin.email);

  // Create Society Admin user
  const societyAdminPassword = await bcrypt.hash('SocietyAdmin@123', 12);
  const societyAdmin = await prisma.user.upsert({
    where: { email: 'society.admin@example.com' },
    update: {},
    create: {
      email: 'society.admin@example.com',
      password: societyAdminPassword,
      role: UserRole.SOCIETY_ADMIN,
      status: UserStatus.ACTIVE,
      firstName: 'Society',
      lastName: 'Admin',
      isEmailVerified: true,
      societyId: society.id,
    },
  });

  console.log('✅ Created Society Admin user:', societyAdmin.email);

  // Create Member user with your phone number
  const member = await prisma.user.upsert({
    where: { phone: '+919726319743' },
    update: {},
    create: {
      phone: '+919726319743',
      role: UserRole.MEMBER,
      status: UserStatus.ACTIVE,
      firstName: 'Test',
      lastName: 'Member',
      societyId: society.id,
      isOtpVerified: false,
    },
  });

  console.log('✅ Created Member user:', member.phone);

  // Create a Secretary Member
  const secretary = await prisma.user.upsert({
    where: { phone: '+919876543210' },
    update: {},
    create: {
      phone: '+919876543210',
      role: UserRole.MEMBER,
      status: UserStatus.ACTIVE,
      firstName: 'John',
      lastName: 'Secretary',
      isSecretary: true,
      societyId: society.id,
      isOtpVerified: true,
    },
  });

  console.log('✅ Created Secretary Member user:', secretary.phone);

  // Create additional sample members
  const sampleMembers = [
    {
      phone: '+919123456789',
      firstName: 'Alice',
      lastName: 'Johnson',
    },
    {
      phone: '+919234567890',
      firstName: 'Bob',
      lastName: 'Smith',
    },
    {
      phone: '+919345678901',
      firstName: 'Charlie',
      lastName: 'Brown',
    },
  ];

  for (const memberData of sampleMembers) {
    await prisma.user.upsert({
      where: { phone: memberData.phone },
      update: {},
      create: {
        phone: memberData.phone,
        role: UserRole.MEMBER,
        status: UserStatus.ACTIVE,
        firstName: memberData.firstName,
        lastName: memberData.lastName,
        societyId: society.id,
        isOtpVerified: true,
      },
    });
  }

  console.log('✅ Created additional sample members');

  // Create some audit log entries for demonstration
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'LOGIN_SUCCESS',
        details: { email: admin.email, method: 'email' },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      {
        userId: member.id,
        action: 'OTP_REQUEST',
        details: { phone: member.phone },
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
      },
    ],
  });

  console.log('✅ Created sample audit logs');

  // Summary
  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│                        ADMIN LOGIN                         │');
  console.log('├─────────────────────────────────────────────────────────────┤');
  console.log('│ Email:    priyank1504patel@gmail.com                       │');
  console.log('│ Password: Admin@123                                        │');
  console.log('│ Role:     ADMIN (Developer)                                │');
  console.log('├─────────────────────────────────────────────────────────────┤');
  console.log('│                   SOCIETY ADMIN LOGIN                      │');
  console.log('├─────────────────────────────────────────────────────────────┤');
  console.log('│ Email:    society.admin@example.com                       │');
  console.log('│ Password: SocietyAdmin@123                                 │');
  console.log('│ Role:     SOCIETY_ADMIN                                    │');
  console.log('├─────────────────────────────────────────────────────────────┤');
  console.log('│                      MEMBER LOGIN                          │');
  console.log('├─────────────────────────────────────────────────────────────┤');
  console.log('│ Phone:    9726319743 (Your number)                        │');
  console.log('│ Method:   OTP via Firebase                                 │');
  console.log('│ Role:     MEMBER                                           │');
  console.log('├─────────────────────────────────────────────────────────────┤');
  console.log('│                    SECRETARY LOGIN                         │');
  console.log('├─────────────────────────────────────────────────────────────┤');
  console.log('│ Phone:    9876543210                                      │');
  console.log('│ Method:   OTP via Firebase                                 │');
  console.log('│ Role:     MEMBER (Secretary)                               │');
  console.log('└─────────────────────────────────────────────────────────────┘');
  console.log('\n🔗 Dashboard URLs:');
  console.log('• Admin Dashboard:        /admin/dashboard');
  console.log('• Society Admin Dashboard: /society-admin/dashboard');
  console.log('• Member Dashboard:       /member/dashboard');
  console.log('\n🧪 To test:');
  console.log('1. Run: npm run dev');
  console.log('2. Visit: http://localhost:3000/ (Member Login) or http://localhost:3000/admin/login (Admin Login)');
  console.log('3. Test each role with the credentials above');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });