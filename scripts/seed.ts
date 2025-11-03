/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { PrismaClient, PlanType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Seed Subscription Plans
  console.log('📦 Seeding subscription plans...')
  
  // Create Premium Plan (Default for new artists)
  const premiumPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'Premium' },
    update: {},
    create: {
      name: 'Premium',
      type: PlanType.PREMIUM,
      description: 'Advanced features for professional artists',
      features: [
        { "index": 1, "text": "🎨 Add up to 3 styles" },
        { "index": 2, "text": "⭐ Feature 2 favourites as premium" },
        { "index": 3, "text": "🏆 Show years of experience" },
        { "index": 4, "text": "🌍 Multi-location support" },
        { "index": 5, "text": "📂 Create collections of your work" }
      ],
      monthlyPrice: 39.00,
      yearlyPrice: 390.00, // 2 months free
      maxPosts: null,
      maxCollections: null,
      maxStudioMembers: 0,
      canCreateStudio: true,
      canUploadVideos: true,
      priority: 1,
      isActive: true,
      isDefault: true,
      freeTrialDays: 30 // 1 month free trial
    }
  })

  // Create Studio Plan
  const studioPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'Studio' },
    update: {},
    create: {
      name: 'Studio',
      type: PlanType.STUDIO,
      description: 'Complete studio management solution',
      features: [
        { "index": 1, "text": "🎨 Add up to 3 styles" },
        { "index": 2, "text": "⭐ Feature 2 favourites as premium" },
        { "index": 3, "text": "🏆 Show years of experience" },
        { "index": 4, "text": "🌍 Multi-location support" },
        { "index": 5, "text": "📂 Create collections of your work" }
      ],
      monthlyPrice: 79.00,
      yearlyPrice: 790.00, // 2 months free
      maxPosts: null,
      maxCollections: null,
      maxStudioMembers: null,
      canCreateStudio: true,
      canUploadVideos: true,
      priority: 2,
      isActive: true,
      isDefault: false,
      freeTrialDays: 14 // 2 weeks free trial
    }
  })

  // Seed Tattoo Styles
  console.log('🎨 Seeding tattoo styles...')
  const tattooStyles = [
    { name: '3D', description: 'Three-dimensional realistic tattoos' },
    { name: 'Abstract', description: 'Abstract and artistic designs' },
    { name: 'Anime', description: 'Japanese anime and manga style' },
    { name: 'Black & Grey', description: 'Classic black and grey tattoos' },
    { name: 'Biomechanical', description: 'Mechanical and organic fusion' },
    { name: 'Blackwork', description: 'Bold black ink designs' },
    { name: 'Chicano', description: 'Chicano culture inspired tattoos' },
    { name: 'Color', description: 'Vibrant colorful tattoos' },
    { name: 'Cover Up', description: 'Covering existing tattoos' },
    { name: 'Dotwork', description: 'Stippling and dot technique' },
    { name: 'Fine Line', description: 'Delicate thin line work' },
    { name: 'Geometric', description: 'Geometric patterns and shapes' },
    { name: 'Horror', description: 'Horror and dark themed tattoos' },
    { name: 'Illustrative', description: 'Illustration style tattoos' },
    { name: 'Japanese', description: 'Traditional Japanese style' },
    { name: 'Lettering', description: 'Text and calligraphy' },
    { name: 'Mandala', description: 'Sacred geometric mandala designs' },
    { name: 'Minimalist', description: 'Simple and clean designs' },
    { name: 'Neo Traditional', description: 'Modern traditional style' },
    { name: 'New School', description: 'Cartoon-like vibrant style' },
    { name: 'Old School', description: 'Classic American traditional' },
    { name: 'Ornamental', description: 'Decorative ornamental designs' },
    { name: 'Portrait', description: 'Realistic portrait tattoos' },
    { name: 'Realism', description: 'Photorealistic tattoos' },
    { name: 'Religious', description: 'Religious and spiritual themes' },
    { name: 'Sketch', description: 'Sketch-like artistic style' },
    { name: 'Surrealism', description: 'Surreal and dreamlike designs' },
    { name: 'Trash Polka', description: 'Abstract realistic combination' },
    { name: 'Tribal', description: 'Traditional tribal patterns' },
    { name: 'Watercolor', description: 'Watercolor painting effect' }
  ]

  for (const style of tattooStyles) {
    await prisma.tattooStyle.upsert({
      where: { name: style.name },
      update: {},
      create: {
        name: style.name,
        description: style.description,
        imageUrl: 'https://tattooing101.com/wp-content/uploads/2023/04/sgushonka_-watercolor-tattoo.png',
        isActive: true
      }
    })
  }

  // Seed Services
  console.log('🛠️ Seeding services...')
  const services = [
    { name: 'Blast-over', description: 'Covering existing tattoos', category: 'Cover Up' },
    { name: 'Free consultation', description: 'Initial consultation at no cost', category: 'Consultation' },
    { name: 'Custom Design', description: 'Creating unique custom designs', category: 'Design' },
    { name: 'Touch-up', description: 'Refreshing existing tattoos', category: 'Maintenance' },
    { name: 'Color Touch-up', description: 'Refreshing colors in existing tattoos', category: 'Maintenance' },
    { name: 'Scar Cover-up', description: 'Covering scars with tattoos', category: 'Cover Up' },
    { name: 'Laser Removal Consultation', description: 'Advice on tattoo removal', category: 'Consultation' },
    { name: 'Piercing', description: 'Body piercing services', category: 'Piercing' },
    { name: 'Tattoo Aftercare', description: 'Post-tattoo care guidance', category: 'Aftercare' },
    { name: 'Flash Tattoos', description: 'Pre-designed tattoo options', category: 'Design' },
    { name: 'Walk-in Service', description: 'No appointment necessary', category: 'Service' },
    { name: 'Group Sessions', description: 'Multiple people getting tattooed', category: 'Service' },
    { name: 'Memorial Tattoos', description: 'Commemorative tattoos', category: 'Specialty' },
    { name: 'Wedding Tattoos', description: 'Wedding-related tattoos', category: 'Specialty' },
    { name: 'Couple Tattoos', description: 'Matching tattoos for couples', category: 'Specialty' }
  ]

  for (const service of services) {
    await prisma.service.upsert({
      where: { name: service.name },
      update: {},
      create: {
        name: service.name,
        description: service.description,
        category: service.category,
        isActive: true
      }
    })
  }

  // Seed Body Parts
  console.log('👤 Seeding body parts...')
  const bodyParts = [
    'Behind the ear',
    'Ears',
    'Face',
    'Neck',
    'Chest',
    'Back',
    'Shoulder',
    'Upper arm',
    'Lower arm',
    'Forearm',
    'Wrist',
    'Hand',
    'Fingers',
    'Stomach',
    'Side/Ribs',
    'Hip',
    'Thigh',
    'Upper leg',
    'Lower leg',
    'Knee',
    'Calf',
    'Ankle',
    'Foot',
    'Toes',
    'Full sleeve',
    'Half sleeve',
    'Full back',
    'Full chest',
    'Full leg'
  ]

  for (const bodyPart of bodyParts) {
    await prisma.bodyPart.upsert({
      where: { name: bodyPart },
      update: {},
      create: {
        name: bodyPart,
        isActive: true
      }
    })
  }

  // Seed Italian Provinces (sample - you can add all 110 provinces)
  console.log('🇮🇹 Seeding Italian provinces and municipalities...')
  const provinces = [
    {
      name: 'Agrigento',
      code: 'AG',
      municipalities: ['Agrigento', 'Aragona', 'Bivona', 'Burgio', 'Calamonaci', 'Caltabellotta', 'Camastra', 'Cammarata', 'Campobello di Licata', 'Canicattì']
    },
    {
      name: 'Alessandria',
      code: 'AL',
      municipalities: ['Alessandria', 'Acqui Terme', 'Arquata Scrivia', 'Basaluzzo', 'Bistagno', 'Bosco Marengo', 'Cantalupo Ligure', 'Capriata d\'Orba', 'Carcare', 'Casale Monferrato']
    },
    {
      name: 'Roma',
      code: 'RM',
      municipalities: ['Roma', 'Albano Laziale', 'Anzio', 'Ardea', 'Ariccia', 'Bracciano', 'Campagnano di Roma', 'Castel Gandolfo', 'Ciampino', 'Civitavecchia']
    },
    {
      name: 'Milano',
      code: 'MI',
      municipalities: ['Milano', 'Abbiategrasso', 'Arese', 'Assago', 'Baranzate', 'Basiano', 'Basiglio', 'Bellinzago Lombardo', 'Bernate Ticino', 'Besate']
    },
    {
      name: 'Napoli',
      code: 'NA',
      municipalities: ['Napoli', 'Acerra', 'Afragola', 'Agerola', 'Anacapri', 'Bacoli', 'Barano d\'Ischia', 'Boscoreale', 'Boscotrecase', 'Brusciano']
    },
    {
      name: 'Torino',
      code: 'TO',
      municipalities: ['Torino', 'Airasca', 'Ala di Stura', 'Albiano d\'Ivrea', 'Alice Superiore', 'Almese', 'Alpette', 'Alpignano', 'Andezeno', 'Andrate']
    },
    {
      name: 'Palermo',
      code: 'PA',
      municipalities: ['Palermo', 'Alia', 'Alimena', 'Aliminusa', 'Altavilla Milicia', 'Altofonte', 'Bagheria', 'Balestrate', 'Baucina', 'Belmonte Mezzagno']
    },
    {
      name: 'Genova',
      code: 'GE',
      municipalities: ['Genova', 'Arenzano', 'Avegno', 'Bargagli', 'Bogliasco', 'Borzonasca', 'Busalla', 'Camogli', 'Campo Ligure', 'Campomorone']
    },
    {
      name: 'Bologna',
      code: 'BO',
      municipalities: ['Bologna', 'Anzola dell\'Emilia', 'Argelato', 'Baricella', 'Bazzano', 'Bentivoglio', 'Budrio', 'Calderara di Reno', 'Camugnano', 'Casalecchio di Reno']
    },
    {
      name: 'Firenze',
      code: 'FI',
      municipalities: ['Firenze', 'Bagno a Ripoli', 'Barberino di Mugello', 'Barberino Val d\'Elsa', 'Borgo San Lorenzo', 'Calenzano', 'Campi Bisenzio', 'Capraia e Limite', 'Castelfiorentino', 'Cerreto Guidi']
    }
  ]

  for (const provinceData of provinces) {
    const province = await prisma.province.upsert({
      where: { name: provinceData.name },
      update: {},
      create: {
        name: provinceData.name,
        code: provinceData.code,
        country: 'Italy',
        imageUrl: 'https://cdn.mappr.co/wp-content/uploads/2021/01/image-969.jpeg',
        isActive: true
      }
    })

    // Seed municipalities for this province
    for (const municipalityName of provinceData.municipalities) {
      const existingMunicipality = await prisma.municipality.findFirst({
        where: {
          name: municipalityName,
          provinceId: province.id
        }
      })

      if (!existingMunicipality) {
        await prisma.municipality.create({
          data: {
            name: municipalityName,
            provinceId: province.id,
            imageUrl: 'https://cdn.mappr.co/wp-content/uploads/2021/01/image-969.jpeg',
            isActive: true
          }
        })
      }
    }
  }

  console.log('✅ Database seeding completed successfully!')
  console.log(`📊 Seeded:`)
  console.log(`   • 2 Subscription Plans (Premium & Studio)`)
  console.log(`   • 30 Tattoo Styles`)
  console.log(`   • 15 Services`)
  console.log(`   • 29 Body Parts`)
  console.log(`   • 10 Provinces`)
  console.log(`   • 100 Municipalities`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
