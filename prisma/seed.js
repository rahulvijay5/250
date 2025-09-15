const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create default locations
  const locations = [
    'Farmhouse',
    'Rahul\'s Home', 
    'Tisha\'s Home'
  ]

  for (const locationName of locations) {
    await prisma.location.upsert({
      where: { name: locationName },
      update: {},
      create: { name: locationName }
    })
  }

  // Create some default players
  const players = [
    { name: 'Player 1', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=player1' },
    { name: 'Player 2', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=player2' },
    { name: 'Player 3', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=player3' },
    { name: 'Player 4', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=player4' },
    { name: 'Player 5', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=player5' },
    { name: 'Player 6', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=player6' }
  ]

  for (const player of players) {
    await prisma.player.upsert({
      where: { name: player.name },
      update: {},
      create: player
    })
  }

  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
