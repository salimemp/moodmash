const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Local password hashing function for seeding
async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log('Starting seeding...');

  // Clean up existing data
  await prisma.achievementUser.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.moodMashMood.deleteMany();
  await prisma.moodMash.deleteMany();
  await prisma.moodComment.deleteMany();
  await prisma.moodLike.deleteMany();
  await prisma.mood.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Create test users
  const password = await hashPassword('password123');

  const alice = await prisma.user.create({
    data: {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      password,
      image: 'https://randomuser.me/api/portraits/women/12.jpg',
      bio: 'Exploring emotions through art and music',
    },
  });

  const bob = await prisma.user.create({
    data: {
      name: 'Bob Smith',
      email: 'bob@example.com',
      password,
      image: 'https://randomuser.me/api/portraits/men/22.jpg',
      bio: 'Finding balance in a chaotic world',
    },
  });

  const charlie = await prisma.user.create({
    data: {
      name: 'Charlie Davis',
      email: 'charlie@example.com',
      password,
      image: 'https://randomuser.me/api/portraits/women/33.jpg',
      bio: 'Constantly curious about human emotions',
    },
  });

  // Create achievements
  const achievements = await Promise.all([
    prisma.achievement.create({
      data: {
        name: 'First Mood',
        description: 'Created your first mood',
        icon: '🎉',
      },
    }),
    prisma.achievement.create({
      data: {
        name: 'Mood Master',
        description: 'Created 10 moods',
        icon: '🌟',
      },
    }),
    prisma.achievement.create({
      data: {
        name: 'Popular Creator',
        description: 'Received 50 likes on your moods',
        icon: '❤️',
      },
    }),
    prisma.achievement.create({
      data: {
        name: 'Social Butterfly',
        description: 'Commented on 20 different moods',
        icon: '🦋',
      },
    }),
  ]);

  // Assign some achievements to users
  await prisma.achievementUser.create({
    data: {
      userId: alice.id,
      achievementId: achievements[0].id,
    },
  });

  await prisma.achievementUser.create({
    data: {
      userId: bob.id,
      achievementId: achievements[0].id,
    },
  });

  await prisma.achievementUser.create({
    data: {
      userId: bob.id,
      achievementId: achievements[1].id,
    },
  });

  // Create moods
  const aliceMoods = await Promise.all([
    prisma.mood.create({
      data: {
        userId: alice.id,
        gradientColors: ['#FF9843', '#FC5678'],
        emoji: '😊',
        text: 'Feeling happy and excited today!',
        isAnonymous: false,
      },
    }),
    prisma.mood.create({
      data: {
        userId: alice.id,
        gradientColors: ['#4299E1', '#3182CE'],
        emoji: '😌',
        text: 'Peaceful and relaxed after meditation',
        isAnonymous: false,
      },
    }),
  ]);

  const bobMoods = await Promise.all([
    prisma.mood.create({
      data: {
        userId: bob.id,
        gradientColors: ['#805AD5', '#6B46C1'],
        emoji: '🤔',
        text: 'Contemplating life decisions',
        isAnonymous: false,
      },
    }),
    prisma.mood.create({
      data: {
        userId: bob.id,
        gradientColors: ['#48BB78', '#38A169'],
        emoji: '🌱',
        text: 'New beginnings',
        isAnonymous: true,
      },
    }),
  ]);

  const charlieMoods = await Promise.all([
    prisma.mood.create({
      data: {
        userId: charlie.id,
        gradientColors: ['#F6AD55', '#DD6B20'],
        emoji: '🔥',
        text: 'Feeling energized and motivated',
        isAnonymous: false,
      },
    }),
    prisma.mood.create({
      data: {
        userId: charlie.id,
        gradientColors: ['#FC8181', '#E53E3E'],
        emoji: '😡',
        text: 'Frustrated with work deadlines',
        isAnonymous: true,
      },
    }),
  ]);

  // Add likes to moods
  await Promise.all([
    prisma.moodLike.create({
      data: {
        userId: bob.id,
        moodId: aliceMoods[0].id,
      },
    }),
    prisma.moodLike.create({
      data: {
        userId: charlie.id,
        moodId: aliceMoods[0].id,
      },
    }),
    prisma.moodLike.create({
      data: {
        userId: alice.id,
        moodId: bobMoods[0].id,
      },
    }),
    prisma.moodLike.create({
      data: {
        userId: charlie.id,
        moodId: bobMoods[0].id,
      },
    }),
    prisma.moodLike.create({
      data: {
        userId: alice.id,
        moodId: charlieMoods[0].id,
      },
    }),
    prisma.moodLike.create({
      data: {
        userId: bob.id,
        moodId: charlieMoods[0].id,
      },
    }),
  ]);

  // Add comments to moods
  await Promise.all([
    prisma.moodComment.create({
      data: {
        userId: bob.id,
        moodId: aliceMoods[0].id,
        text: 'Love this energy!',
      },
    }),
    prisma.moodComment.create({
      data: {
        userId: charlie.id,
        moodId: aliceMoods[0].id,
        text: 'This brightened my day!',
      },
    }),
    prisma.moodComment.create({
      data: {
        userId: alice.id,
        moodId: bobMoods[0].id,
        text: 'I feel this way sometimes too',
      },
    }),
    prisma.moodComment.create({
      data: {
        userId: alice.id,
        moodId: charlieMoods[0].id,
        text: 'So inspiring!',
      },
    }),
  ]);

  // Create a mood mash
  const moodMash = await prisma.moodMash.create({
    data: {
      userId: alice.id,
      resultGradientColors: ['#9F7AEA', '#667EEA'],
      resultEmoji: '✨',
      resultText: 'Blending emotions for a unique experience',
    },
  });

  // Add moods to the mood mash
  await Promise.all([
    prisma.moodMashMood.create({
      data: {
        moodMashId: moodMash.id,
        moodId: aliceMoods[0].id,
      },
    }),
    prisma.moodMashMood.create({
      data: {
        moodMashId: moodMash.id,
        moodId: bobMoods[0].id,
      },
    }),
  ]);

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 