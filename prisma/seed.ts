import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (in reverse order of dependencies)
  console.log('🗑️  Clearing existing data...');
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.tutorProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  // 1. Create Admin User
  console.log('👤 Creating admin user...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@skillbridge.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  });
  console.log('✅ Admin created:', admin.email);

  // 2. Create Categories
  console.log('📚 Creating categories...');
  const categories = await prisma.category.createMany({
    data: [
      {
        name: 'Mathematics',
        description: 'Algebra, Calculus, Geometry, Statistics',
        slug: 'mathematics'
      },
      {
        name: 'Science',
        description: 'Physics, Chemistry, Biology',
        slug: 'science'
      },
      {
        name: 'Programming',
        description: 'Web Development, Mobile Apps, Data Science',
        slug: 'programming'
      },
      {
        name: 'Languages',
        description: 'English, Spanish, French, Mandarin',
        slug: 'languages'
      },
      {
        name: 'Music',
        description: 'Piano, Guitar, Violin, Vocals',
        slug: 'music'
      },
      {
        name: 'Art',
        description: 'Drawing, Painting, Digital Art',
        slug: 'art'
      },
      {
        name: 'Business',
        description: 'Marketing, Finance, Management',
        slug: 'business'
      }
    ]
  });
  console.log(`✅ Created ${categories.count} categories`);

  // Fetch created categories for linking
  const allCategories = await prisma.category.findMany();
  const mathCategory = allCategories.find((c) => c.slug === 'mathematics')!;
  const programmingCategory = allCategories.find((c) => c.slug === 'programming')!;
  const languagesCategory = allCategories.find((c) => c.slug === 'languages')!;
  const musicCategory = allCategories.find((c) => c.slug === 'music')!;

  // 3. Create Sample Students
  console.log('👨‍🎓 Creating student users...');
  const student1 = await prisma.user.create({
    data: {
      email: 'john.doe@example.com',
      password: hashedPassword,
      name: 'John Doe',
      role: 'STUDENT',
      status: 'ACTIVE'
    }
  });

  const student2 = await prisma.user.create({
    data: {
      email: 'jane.smith@example.com',
      password: hashedPassword,
      name: 'Jane Smith',
      role: 'STUDENT',
      status: 'ACTIVE'
    }
  });

  const student3 = await prisma.user.create({
    data: {
      email: 'mike.wilson@example.com',
      password: hashedPassword,
      name: 'Mike Wilson',
      role: 'STUDENT',
      status: 'ACTIVE'
    }
  });
  console.log('✅ Created 3 students');

  // 4. Create Sample Tutors with Profiles
  console.log('👨‍🏫 Creating tutor users with profiles...');

  // Tutor 1 - Math Expert
  const tutor1 = await prisma.user.create({
    data: {
      email: 'sarah.anderson@example.com',
      password: hashedPassword,
      name: 'Sarah Anderson',
      role: 'TUTOR',
      status: 'ACTIVE',
      tutorProfile: {
        create: {
          bio: 'Experienced mathematics tutor with 10+ years of teaching experience. Specialized in Calculus, Algebra, and Statistics. I help students build strong fundamentals and excel in exams.',
          hourlyRate: 45.0,
          subjects: ['Calculus', 'Algebra', 'Statistics', 'Geometry'],
          experience: 10,
          rating: 4.8,
          reviewCount: 0,
          availability: {
            monday: ['09:00-12:00', '14:00-17:00'],
            wednesday: ['09:00-12:00', '14:00-17:00'],
            friday: ['09:00-12:00', '14:00-17:00']
          },
          categories: {
            connect: [{ id: mathCategory.id }]
          }
        }
      }
    }
  });

  // Tutor 2 - Programming Expert
  const tutor2 = await prisma.user.create({
    data: {
      email: 'david.chen@example.com',
      password: hashedPassword,
      name: 'David Chen',
      role: 'TUTOR',
      status: 'ACTIVE',
      tutorProfile: {
        create: {
          bio: 'Full-stack developer and coding instructor. I teach JavaScript, React, Node.js, Python, and more. Whether you\'re a beginner or looking to level up, I can help you achieve your coding goals.',
          hourlyRate: 60.0,
          subjects: ['JavaScript', 'React', 'Node.js', 'Python', 'Web Development'],
          experience: 7,
          rating: 4.9,
          reviewCount: 0,
          availability: {
            tuesday: ['10:00-13:00', '15:00-18:00'],
            thursday: ['10:00-13:00', '15:00-18:00'],
            saturday: ['10:00-16:00']
          },
          categories: {
            connect: [{ id: programmingCategory.id }]
          }
        }
      }
    }
  });

  // Tutor 3 - Language Expert
  const tutor3 = await prisma.user.create({
    data: {
      email: 'maria.garcia@example.com',
      password: hashedPassword,
      name: 'Maria Garcia',
      role: 'TUTOR',
      status: 'ACTIVE',
      tutorProfile: {
        create: {
          bio: 'Native Spanish speaker with TEFL certification. I teach Spanish and English to students of all levels. My lessons are interactive, fun, and tailored to your learning style.',
          hourlyRate: 35.0,
          subjects: ['Spanish', 'English', 'Grammar', 'Conversation'],
          experience: 5,
          rating: 4.7,
          reviewCount: 0,
          availability: {
            monday: ['08:00-12:00'],
            wednesday: ['08:00-12:00'],
            friday: ['08:00-12:00', '13:00-16:00']
          },
          categories: {
            connect: [{ id: languagesCategory.id }]
          }
        }
      }
    }
  });

  // Tutor 4 - Music Expert
  const tutor4 = await prisma.user.create({
    data: {
      email: 'emma.taylor@example.com',
      password: hashedPassword,
      name: 'Emma Taylor',
      role: 'TUTOR',
      status: 'ACTIVE',
      tutorProfile: {
        create: {
          bio: 'Professional pianist and music teacher with a degree in Music Education. I teach piano, music theory, and composition. Perfect for beginners and intermediate students.',
          hourlyRate: 50.0,
          subjects: ['Piano', 'Music Theory', 'Composition', 'Sight Reading'],
          experience: 8,
          rating: 5.0,
          reviewCount: 0,
          availability: {
            tuesday: ['14:00-18:00'],
            thursday: ['14:00-18:00'],
            saturday: ['09:00-17:00']
          },
          categories: {
            connect: [{ id: musicCategory.id }]
          }
        }
      }
    }
  });

  console.log('✅ Created 4 tutors with profiles');

  // 5. Create Sample Bookings
  console.log('📅 Creating sample bookings...');

  // Past completed bookings
  const booking1 = await prisma.booking.create({
    data: {
      studentId: student1.id,
      tutorId: tutor1.id,
      dateTime: new Date('2025-01-15T10:00:00Z'),
      duration: 60,
      status: 'COMPLETED',
      notes: 'Help with calculus homework'
    }
  });

  const booking2 = await prisma.booking.create({
    data: {
      studentId: student2.id,
      tutorId: tutor2.id,
      dateTime: new Date('2025-01-18T14:00:00Z'),
      duration: 90,
      status: 'COMPLETED',
      notes: 'Introduction to React hooks'
    }
  });

  const booking3 = await prisma.booking.create({
    data: {
      studentId: student1.id,
      tutorId: tutor3.id,
      dateTime: new Date('2025-01-20T09:00:00Z'),
      duration: 60,
      status: 'COMPLETED',
      notes: 'Spanish conversation practice'
    }
  });

  // Upcoming confirmed bookings
  const booking4 = await prisma.booking.create({
    data: {
      studentId: student3.id,
      tutorId: tutor1.id,
      dateTime: new Date('2025-02-05T10:00:00Z'),
      duration: 60,
      status: 'CONFIRMED',
      notes: 'Statistics exam preparation'
    }
  });

  const booking5 = await prisma.booking.create({
    data: {
      studentId: student2.id,
      tutorId: tutor4.id,
      dateTime: new Date('2025-02-08T15:00:00Z'),
      duration: 60,
      status: 'CONFIRMED',
      notes: 'Piano lesson - beginner level'
    }
  });

  console.log('✅ Created 5 bookings');

  // 6. Create Sample Reviews
  console.log('⭐ Creating sample reviews...');

  const review1 = await prisma.review.create({
    data: {
      bookingId: booking1.id,
      studentId: student1.id,
      tutorId: tutor1.id,
      rating: 5,
      comment: 'Sarah is an amazing tutor! She explained calculus concepts so clearly. Highly recommend!'
    }
  });

  const review2 = await prisma.review.create({
    data: {
      bookingId: booking2.id,
      studentId: student2.id,
      tutorId: tutor2.id,
      rating: 5,
      comment: 'David is incredibly knowledgeable. His React teaching style is perfect for beginners. Looking forward to more sessions!'
    }
  });

  const review3 = await prisma.review.create({
    data: {
      bookingId: booking3.id,
      studentId: student1.id,
      tutorId: tutor3.id,
      rating: 4,
      comment: 'Great conversation practice with Maria. Very patient and encouraging. Would book again!'
    }
  });

  console.log('✅ Created 3 reviews');

  // 7. Update tutor ratings based on reviews
  console.log('📊 Updating tutor ratings...');

  // Get all reviews for each tutor and calculate average
  const tutor1Reviews = await prisma.review.findMany({
    where: { tutorId: tutor1.id },
    select: { rating: true }
  });
  const tutor1AvgRating =
    tutor1Reviews.reduce((sum, r) => sum + r.rating, 0) / tutor1Reviews.length;

  const tutor2Reviews = await prisma.review.findMany({
    where: { tutorId: tutor2.id },
    select: { rating: true }
  });
  const tutor2AvgRating =
    tutor2Reviews.reduce((sum, r) => sum + r.rating, 0) / tutor2Reviews.length;

  const tutor3Reviews = await prisma.review.findMany({
    where: { tutorId: tutor3.id },
    select: { rating: true }
  });
  const tutor3AvgRating =
    tutor3Reviews.reduce((sum, r) => sum + r.rating, 0) / tutor3Reviews.length;

  await prisma.tutorProfile.update({
    where: { userId: tutor1.id },
    data: {
      rating: tutor1AvgRating,
      reviewCount: tutor1Reviews.length
    }
  });

  await prisma.tutorProfile.update({
    where: { userId: tutor2.id },
    data: {
      rating: tutor2AvgRating,
      reviewCount: tutor2Reviews.length
    }
  });

  await prisma.tutorProfile.update({
    where: { userId: tutor3.id },
    data: {
      rating: tutor3AvgRating,
      reviewCount: tutor3Reviews.length
    }
  });

  console.log('✅ Updated tutor ratings');

  console.log('\n🎉 Database seeding completed successfully!\n');
  console.log('📋 Summary:');
  console.log('   • 1 Admin user');
  console.log('   • 7 Categories');
  console.log('   • 3 Students');
  console.log('   • 4 Tutors with profiles');
  console.log('   • 5 Bookings (3 completed, 2 upcoming)');
  console.log('   • 3 Reviews\n');
  console.log('🔑 Login Credentials:');
  console.log('   Admin: admin@skillbridge.com / Admin123!');
  console.log('   Student: john.doe@example.com / Admin123!');
  console.log('   Tutor: sarah.anderson@example.com / Admin123!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
