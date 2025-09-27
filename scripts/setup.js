const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupDatabase() {
  try {
    console.log('🚀 Setting up database...');
    
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }

    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@arthyaa.com',
        password: hashedPassword,
        role: 'ADMIN',
        firstName: 'System',
        lastName: 'Administrator',
        status: 'ACTIVE'
      }
    });

    console.log('✅ Admin user created successfully');
    console.log('📧 Email: admin@arthyaa.com');
    console.log('🔑 Password: admin123');
    console.log('⚠️  Please change the default password after first login');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase()
  .then(() => {
    console.log('🎉 Database setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });
