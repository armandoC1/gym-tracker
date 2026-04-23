import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data
  await prisma.exerciseLog.deleteMany()
  await prisma.workout.deleteMany()
  await prisma.exercise.deleteMany()
  await prisma.routine.deleteMany()

  // ═══════════════════════════════════════════════
  // RUTINA A - Heavy Duty: Enfoque Brazos
  // ═══════════════════════════════════════════════

  const rutinaA_Lunes = await prisma.routine.create({
    data: {
      name: 'PUSH – Pecho y Tríceps',
      label: 'A',
      dayOfWeek: 'LUNES',
      color: '#ef4444',
      description: 'Enfoque: Tríceps pesado',
      exercises: {
        create: [
          {
            name: 'Flexiones con mochila',
            sets: 4,
            repsOrTime: 'Al fallo absoluto',
            weight: 'Mochila cargada',
            notes: '4 series al fallo absoluto',
            order: 1,
            videoUrl: 'https://www.youtube.com/embed/IODxDxX7oi4',
          },
          {
            name: 'Flexiones diamante',
            sets: 3,
            repsOrTime: 'Al fallo',
            notes: 'Bajada súper lenta de 4 segundos',
            order: 2,
            videoUrl: 'https://www.youtube.com/embed/J0DXe9js7OM',
          },
          {
            name: 'Extensión tras nuca a 1 mano',
            sets: 4,
            repsOrTime: 'Por brazo',
            weight: '20 lb',
            notes: 'Última serie = Drop Set: Fallo con 20 lb → quitas peso → Fallo con 10 lb',
            order: 3,
            videoUrl: 'https://www.youtube.com/embed/YbX7Wd8jQ-U',
          },
          {
            name: 'Fondos en silla',
            sets: 3,
            repsOrTime: 'Al fallo',
            notes: '3 series al fallo',
            order: 4,
            videoUrl: 'https://www.youtube.com/embed/0326dy_-CzM',
          },
          {
            name: 'Patada de tríceps',
            sets: 3,
            repsOrTime: 'Por brazo',
            weight: '20 lb',
            notes: 'Al terminar la 3ra serie haces 1 Drop Set extra con 10 lb al fallo',
            order: 5,
            videoUrl: 'https://www.youtube.com/embed/6SS6K3lAwZ8',
          },
        ],
      },
    },
  })

  const rutinaA_Miercoles = await prisma.routine.create({
    data: {
      name: 'PULL – Espalda y Bíceps',
      label: 'A',
      dayOfWeek: 'MIERCOLES',
      color: '#3b82f6',
      description: 'Enfoque: Bíceps pesado',
      exercises: {
        create: [
          {
            name: 'Remo a una mano',
            sets: 4,
            repsOrTime: '4 series por brazo',
            weight: '20 lb',
            notes: 'Pausa de 2 segundos arriba apretando la espalda',
            order: 1,
            videoUrl: 'https://www.youtube.com/embed/roCP6wCXPqo',
          },
          {
            name: 'Curl concentrado',
            sets: 4,
            repsOrTime: '4 series por brazo',
            weight: '20 lb',
            notes: 'Última serie = Drop Set: Fallo con 20 lb → Fallo con 10 lb',
            order: 2,
            videoUrl: 'https://www.youtube.com/embed/Jvj2wV0vOYU',
          },
          {
            name: 'Curl martillo cruzado al pecho',
            sets: 3,
            repsOrTime: '3 series por brazo',
            weight: '20 lb',
            order: 3,
            videoUrl: 'https://www.youtube.com/embed/TwD-YGVP4Bk',
          },
          {
            name: 'Curl 21s',
            sets: 2,
            repsOrTime: '2 rondas completas',
            notes: '7 reps de abajo a la mitad + 7 reps de la mitad arriba + 7 reps completas',
            order: 4,
            videoUrl: 'https://www.youtube.com/embed/J5GlmFrL1dM',
          },
        ],
      },
    },
  })

  const rutinaA_Jueves = await prisma.routine.create({
    data: {
      name: 'Hombro + Brazo',
      label: 'A',
      dayOfWeek: 'JUEVES',
      color: '#a855f7',
      description: 'Enfoque: Congestión brutal y bombeo',
      exercises: {
        create: [
          {
            name: 'Pike Push-ups (Flexión en V)',
            sets: 4,
            repsOrTime: 'Al fallo absoluto',
            order: 1,
            videoUrl: 'https://www.youtube.com/embed/sposDXWEB0A',
          },
          {
            name: 'Elevaciones laterales',
            sets: 4,
            repsOrTime: '4 series por brazo',
            weight: '10 lb',
            notes: 'Bajada lenta de 4 segundos',
            order: 2,
            videoUrl: 'https://www.youtube.com/embed/3VcKaXpzqRo',
          },
          {
            name: 'Superserie: Curl supino lento',
            sets: 3,
            repsOrTime: '3 rondas',
            notes: 'Sin descanso entre ejercicios – ir directo a Patada de tríceps',
            isSuperset: true,
            supersetGroup: 'superset-A-jueves',
            order: 3,
            videoUrl: 'https://www.youtube.com/embed/av7-8igSXTs',
          },
          {
            name: 'Superserie: Patada de tríceps',
            sets: 3,
            repsOrTime: '3 rondas',
            notes: 'Sin descanso entre ejercicios',
            isSuperset: true,
            supersetGroup: 'superset-A-jueves',
            order: 4,
            videoUrl: 'https://www.youtube.com/embed/6SS6K3lAwZ8',
          },
          {
            name: 'Isométrico de Bíceps',
            sets: 2,
            repsOrTime: 'Hasta el fallo',
            notes: 'Mantener a 90° hasta morir – Apretar el músculo a propósito',
            order: 5,
            videoUrl: 'https://www.youtube.com/embed/soxrZlIl35U',
          },
        ],
      },
    },
  })

  const rutinaA_Viernes = await prisma.routine.create({
    data: {
      name: 'Pierna + Core',
      label: 'A',
      dayOfWeek: 'VIERNES',
      color: '#eab308',
      description: 'Enfoque: Estímulo global y base sólida',
      exercises: {
        create: [
          {
            name: 'Sentadilla búlgara con mancuerna',
            sets: 4,
            repsOrTime: '4 series por pierna',
            order: 1,
            videoUrl: 'https://www.youtube.com/embed/2C-uNgKwPLE',
          },
          {
            name: 'Peso muerto a una pierna',
            sets: 4,
            repsOrTime: '4 series por pierna',
            order: 2,
            videoUrl: 'https://www.youtube.com/embed/vNzW7USVOhk',
          },
          {
            name: 'Sentadillas con mochila pesada',
            sets: 3,
            repsOrTime: 'Al fallo',
            weight: 'Mochila cargada',
            order: 3,
            videoUrl: 'https://www.youtube.com/embed/ultWZbUMPL8',
          },
          {
            name: 'Plancha abdominal',
            sets: 4,
            repsOrTime: 'Al fallo de tiempo',
            notes: '4 series hasta el fallo de tiempo',
            order: 4,
            videoUrl: 'https://www.youtube.com/embed/ASdvN_XEl_c',
          },
        ],
      },
    },
  })

  const rutinaA_Sabado = await prisma.routine.create({
    data: {
      name: 'ARM DAY – Destrucción Total',
      label: 'A',
      dayOfWeek: 'SABADO',
      color: '#dc2626',
      description: '🔴 El Día Clave – Destrucción total de brazos',
      exercises: {
        create: [
          {
            name: 'Superserie 1: Curl estricto',
            sets: 4,
            repsOrTime: '4 rondas al fallo',
            weight: '20 lb',
            notes: 'Sin descanso entre ejercicios – ir directo a Fondos en silla',
            isSuperset: true,
            supersetGroup: 'superset-A-sabado-1',
            order: 1,
            videoUrl: 'https://www.youtube.com/embed/av7-8igSXTs',
          },
          {
            name: 'Superserie 1: Fondos en silla',
            sets: 4,
            repsOrTime: '4 rondas al fallo',
            notes: 'Sin descanso entre ejercicios',
            isSuperset: true,
            supersetGroup: 'superset-A-sabado-1',
            order: 2,
            videoUrl: 'https://www.youtube.com/embed/0326dy_-CzM',
          },
          {
            name: 'Superserie 2: Extensión copa',
            sets: 3,
            repsOrTime: '3 rondas',
            weight: '20 lb',
            notes: 'Sin descanso entre ejercicios – ir directo a Curl martillo',
            isSuperset: true,
            supersetGroup: 'superset-A-sabado-2',
            order: 3,
            videoUrl: 'https://www.youtube.com/embed/YbX7Wd8jQ-U',
          },
          {
            name: 'Superserie 2: Curl martillo',
            sets: 3,
            repsOrTime: '3 rondas',
            weight: '20 lb',
            isSuperset: true,
            supersetGroup: 'superset-A-sabado-2',
            order: 4,
            videoUrl: 'https://www.youtube.com/embed/TwD-YGVP4Bk',
          },
          {
            name: 'FINISHER: Curl lento',
            sets: 1,
            repsOrTime: 'Al fallo absoluto',
            weight: '10 lb',
            notes: 'Sin soltar la mancuerna ni descansar → pasar directo a Isométrico',
            order: 5,
            videoUrl: 'https://www.youtube.com/embed/av7-8igSXTs',
          },
          {
            name: 'FINISHER: Curl isométrico',
            sets: 1,
            repsOrTime: 'Hasta que el brazo ceda',
            notes: 'Mantener a 90° hasta que el brazo ceda completamente',
            order: 6,
            videoUrl: 'https://www.youtube.com/embed/soxrZlIl35U',
          },
        ],
      },
    },
  })

  // ═══════════════════════════════════════════════
  // RUTINA B
  // ═══════════════════════════════════════════════

  const rutinaB_Lunes = await prisma.routine.create({
    data: {
      name: 'Tríceps + Pecho',
      label: 'B',
      dayOfWeek: 'LUNES',
      color: '#ef4444',
      description: 'Fuerza + base',
      exercises: {
        create: [
          {
            name: 'Flexiones con mochila',
            sets: 4,
            repsOrTime: 'Al fallo',
            weight: 'Mochila cargada',
            order: 1,
            videoUrl: 'https://www.youtube.com/embed/IODxDxX7oi4',
          },
          {
            name: 'Flexiones diamante',
            sets: 3,
            repsOrTime: 'Al fallo',
            order: 2,
            videoUrl: 'https://www.youtube.com/embed/J0DXe9js7OM',
          },
          {
            name: 'Extensión tras nuca',
            sets: 4,
            repsOrTime: '4 series',
            weight: '20 lb',
            notes: 'Última serie = Drop Set',
            order: 3,
            videoUrl: 'https://www.youtube.com/embed/YbX7Wd8jQ-U',
          },
          {
            name: 'Fondos en silla',
            sets: 3,
            repsOrTime: 'Al fallo',
            order: 4,
            videoUrl: 'https://www.youtube.com/embed/0326dy_-CzM',
          },
        ],
      },
    },
  })

  const rutinaB_Martes = await prisma.routine.create({
    data: {
      name: 'Bíceps + Espalda',
      label: 'B',
      dayOfWeek: 'MARTES',
      color: '#3b82f6',
      description: 'Fuerza',
      exercises: {
        create: [
          {
            name: 'Remo a una mano',
            sets: 4,
            repsOrTime: '4 series',
            weight: '20 lb',
            notes: 'Pausa arriba 2 segundos',
            order: 1,
            videoUrl: 'https://www.youtube.com/embed/roCP6wCXPqo',
          },
          {
            name: 'Curl concentrado',
            sets: 4,
            repsOrTime: '4 series',
            notes: 'Última serie = Drop Set',
            order: 2,
            videoUrl: 'https://www.youtube.com/embed/Jvj2wV0vOYU',
          },
          {
            name: 'Curl martillo',
            sets: 3,
            repsOrTime: '3 series',
            order: 3,
            videoUrl: 'https://www.youtube.com/embed/TwD-YGVP4Bk',
          },
          {
            name: 'Curl 21s',
            sets: 2,
            repsOrTime: '2 rondas',
            notes: '7 + 7 + 7 reps',
            order: 4,
            videoUrl: 'https://www.youtube.com/embed/J5GlmFrL1dM',
          },
        ],
      },
    },
  })

  const rutinaB_Miercoles = await prisma.routine.create({
    data: {
      name: 'Hombro + Brazo (Bombeo)',
      label: 'B',
      dayOfWeek: 'MIERCOLES',
      color: '#a855f7',
      description: 'Ligero pero intenso',
      exercises: {
        create: [
          {
            name: 'Pike push-ups',
            sets: 4,
            repsOrTime: 'Al fallo',
            order: 1,
            videoUrl: 'https://www.youtube.com/embed/sposDXWEB0A',
          },
          {
            name: 'Elevaciones laterales',
            sets: 4,
            repsOrTime: '4 series lentas',
            weight: '10 lb',
            order: 2,
            videoUrl: 'https://www.youtube.com/embed/3VcKaXpzqRo',
          },
          {
            name: 'Superserie: Curl supino',
            sets: 3,
            repsOrTime: '3 rondas',
            notes: 'Sin descanso – ir a Patada tríceps',
            isSuperset: true,
            supersetGroup: 'superset-B-miercoles',
            order: 3,
            videoUrl: 'https://www.youtube.com/embed/av7-8igSXTs',
          },
          {
            name: 'Superserie: Patada tríceps',
            sets: 3,
            repsOrTime: '3 rondas',
            isSuperset: true,
            supersetGroup: 'superset-B-miercoles',
            order: 4,
            videoUrl: 'https://www.youtube.com/embed/6SS6K3lAwZ8',
          },
          {
            name: 'Isométrico bíceps',
            sets: 2,
            repsOrTime: '2 rondas',
            notes: 'Mantener a 90° hasta el fallo',
            order: 5,
            videoUrl: 'https://www.youtube.com/embed/soxrZlIl35U',
          },
        ],
      },
    },
  })

  const rutinaB_Jueves = await prisma.routine.create({
    data: {
      name: 'Tríceps + Pierna',
      label: 'B',
      dayOfWeek: 'JUEVES',
      color: '#f97316',
      description: 'Segundo estímulo tríceps',
      exercises: {
        create: [
          {
            name: 'Sentadilla búlgara',
            sets: 4,
            repsOrTime: '4 series por pierna',
            order: 1,
            videoUrl: 'https://www.youtube.com/embed/2C-uNgKwPLE',
          },
          {
            name: 'Sentadilla con mochila',
            sets: 3,
            repsOrTime: '3 series',
            weight: 'Mochila cargada',
            order: 2,
            videoUrl: 'https://www.youtube.com/embed/ultWZbUMPL8',
          },
          {
            name: 'Fondos en silla',
            sets: 4,
            repsOrTime: 'Al fallo',
            order: 3,
            videoUrl: 'https://www.youtube.com/embed/0326dy_-CzM',
          },
          {
            name: 'Patada de tríceps',
            sets: 3,
            repsOrTime: '3 series + drop set',
            weight: '20 lb',
            notes: 'Última serie con drop set',
            order: 4,
            videoUrl: 'https://www.youtube.com/embed/6SS6K3lAwZ8',
          },
        ],
      },
    },
  })

  const rutinaB_Viernes = await prisma.routine.create({
    data: {
      name: 'Bíceps + Core',
      label: 'B',
      dayOfWeek: 'VIERNES',
      color: '#eab308',
      description: 'Segundo estímulo bíceps',
      exercises: {
        create: [
          {
            name: 'Curl estricto',
            sets: 4,
            repsOrTime: '4 series',
            weight: '20 lb',
            notes: 'Última serie = Drop Set',
            order: 1,
            videoUrl: 'https://www.youtube.com/embed/av7-8igSXTs',
          },
          {
            name: 'Curl martillo cruzado',
            sets: 3,
            repsOrTime: '3 series',
            order: 2,
            videoUrl: 'https://www.youtube.com/embed/TwD-YGVP4Bk',
          },
          {
            name: 'Curl lento',
            sets: 2,
            repsOrTime: 'Al fallo',
            weight: '10 lb',
            order: 3,
            videoUrl: 'https://www.youtube.com/embed/av7-8igSXTs',
          },
          {
            name: 'Plancha + crunch',
            sets: 4,
            repsOrTime: '4 series',
            notes: 'Plancha al fallo + crunches',
            order: 4,
            videoUrl: 'https://www.youtube.com/embed/ASdvN_XEl_c',
          },
        ],
      },
    },
  })

  const rutinaB_Sabado = await prisma.routine.create({
    data: {
      name: 'ARM DAY 🔥',
      label: 'B',
      dayOfWeek: 'SABADO',
      color: '#dc2626',
      description: '🔴 Día más importante – Destrucción total de brazos',
      exercises: {
        create: [
          {
            name: 'Superserie 1: Curl bíceps estricto',
            sets: 4,
            repsOrTime: 'Al fallo',
            notes: 'Sin descanso – ir a Fondos en silla',
            isSuperset: true,
            supersetGroup: 'superset-B-sabado-1',
            order: 1,
            videoUrl: 'https://www.youtube.com/embed/av7-8igSXTs',
          },
          {
            name: 'Superserie 1: Fondos en silla',
            sets: 4,
            repsOrTime: 'Al fallo',
            notes: 'Ambos al fallo',
            isSuperset: true,
            supersetGroup: 'superset-B-sabado-1',
            order: 2,
            videoUrl: 'https://www.youtube.com/embed/0326dy_-CzM',
          },
          {
            name: 'Superserie 2: Extensión copa',
            sets: 3,
            repsOrTime: '3 rondas',
            isSuperset: true,
            supersetGroup: 'superset-B-sabado-2',
            order: 3,
            videoUrl: 'https://www.youtube.com/embed/YbX7Wd8jQ-U',
          },
          {
            name: 'Superserie 2: Curl martillo',
            sets: 3,
            repsOrTime: '3 rondas',
            isSuperset: true,
            supersetGroup: 'superset-B-sabado-2',
            order: 4,
            videoUrl: 'https://www.youtube.com/embed/TwD-YGVP4Bk',
          },
          {
            name: 'FINISHER: Curl 10 lb lento',
            sets: 1,
            repsOrTime: 'Al fallo',
            weight: '10 lb',
            notes: 'Sin descanso → pasar a isométrico',
            order: 5,
            videoUrl: 'https://www.youtube.com/embed/av7-8igSXTs',
          },
          {
            name: 'FINISHER: Isométrico 90°',
            sets: 1,
            repsOrTime: 'Hasta morir',
            notes: 'Mantener hasta que el brazo ceda',
            order: 6,
            videoUrl: 'https://www.youtube.com/embed/soxrZlIl35U',
          },
        ],
      },
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log(`
  Rutina A: Lunes, Miércoles, Jueves, Viernes, Sábado
  Rutina B: Lunes, Martes, Miércoles, Jueves, Viernes, Sábado
  `)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
