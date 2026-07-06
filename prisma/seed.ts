import { PrismaClient, Role, Grade, Subject, ContentType } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12)
  const admin = await prisma.user.upsert({
    where: { email: "admin@edutunisia.tn" },
    update: {},
    create: {
      email: "admin@edutunisia.tn",
      passwordHash: adminPassword,
      fullName: "Admin Al-Aman",
      role: Role.ADMIN,
      phone: "20000000",
      emailVerified: new Date(),
    },
  })
  console.log("Admin created:", admin.email)

  // Create a teacher user
  const teacherPassword = await bcrypt.hash("teacher123", 12)
  const teacher = await prisma.user.upsert({
    where: { email: "teacher@edutunisia.tn" },
    update: {},
    create: {
      email: "teacher@edutunisia.tn",
      passwordHash: teacherPassword,
      fullName: "Mme Fatma Ben Ali",
      role: Role.TEACHER,
      phone: "20000001",
      emailVerified: new Date(),
    },
  })
  console.log("Teacher created:", teacher.email)

  // Create a student user
  const studentPassword = await bcrypt.hash("student123", 12)
  const student = await prisma.user.upsert({
    where: { email: "student@edutunisia.tn" },
    update: {},
    create: {
      email: "student@edutunisia.tn",
      passwordHash: studentPassword,
      fullName: "Mohamed Salah",
      role: Role.STUDENT,
      phone: "20000002",
      emailVerified: new Date(),
    },
  })
  console.log("Student created:", student.email)

  // Create sample content items
  const contentData: Array<{
    titleAr: string; titleFr: string; descriptionAr: string; descriptionFr: string
    grade: Grade; subject: Subject; contentType: ContentType
    isFree: boolean; price: number | null; youtubeUrl?: string; thumbnailUrl?: string
  }> = [
    {
      titleAr: "الحروف العربية - الجزء الأول",
      titleFr: "Les lettres arabes — Partie 1",
      descriptionAr: "تعلم الحروف العربية من الألف إلى الزاي مع فيديوهات ممتعة",
      descriptionFr: "Apprendre les lettres arabes de alif à zay avec des vidéos ludiques",
      grade: Grade.GRADE_1, subject: Subject.ARABIC, contentType: ContentType.COURSE,
      isFree: true, price: null,
      youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg",
    },
    {
      titleAr: "الرياضيات - الجمع والطرح",
      titleFr: "Mathématiques — Addition et soustraction",
      descriptionAr: "تعلم عمليات الجمع والطرح للأعداد من 1 إلى 100",
      descriptionFr: "Apprendre l'addition et la soustraction des nombres de 1 à 100",
      grade: Grade.GRADE_2, subject: Subject.MATH, contentType: ContentType.COURSE,
      isFree: true, price: null,
      youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg",
    },
    {
      titleAr: "الفرنسية - أساسيات القراءة",
      titleFr: "Français — Bases de la lecture",
      descriptionAr: "تعلم قراءة النصوص البسيطة باللغة الفرنسية",
      descriptionFr: "Apprendre à lire des textes simples en français",
      grade: Grade.GRADE_3, subject: Subject.FRENCH, contentType: ContentType.COURSE,
      isFree: false, price: 10.00,
      youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg",
    },
    {
      titleAr: "كتاب الرياضيات - السنة الرابعة",
      titleFr: "Livre de mathématiques — 4ème année",
      descriptionAr: "كتاب PDF شامل لدروس الرياضيات للسنة الرابعة ابتدائي",
      descriptionFr: "Livre PDF complet de mathématiques pour la 4ème année primaire",
      grade: Grade.GRADE_4, subject: Subject.MATH, contentType: ContentType.BOOK,
      isFree: false, price: 5.00,
    },
    {
      titleAr: "سلسلة تمارين العلوم",
      titleFr: "Série d'exercices — Sciences",
      descriptionAr: "تمارين متنوعة في مادة الإيقاظ العلمي للسنة الخامسة",
      descriptionFr: "Exercices variés en sciences pour la 5ème année",
      grade: Grade.GRADE_5, subject: Subject.SCIENCE, contentType: ContentType.SERIES,
      isFree: false, price: 3.00,
    },
    {
      titleAr: "رسوم متحركة - دورة الماء في الطبيعة",
      titleFr: "Animation — Le cycle de l'eau",
      descriptionAr: "رسم متحرك يشرح دورة الماء في الطبيعة",
      descriptionFr: "Animation expliquant le cycle de l'eau dans la nature",
      grade: Grade.GRADE_3, subject: Subject.SCIENCE, contentType: ContentType.ANIMATION,
      isFree: true, price: null,
    },
    {
      titleAr: "التربية الإسلامية - الصلاة",
      titleFr: "Éducation islamique — La prière",
      descriptionAr: "تعلم كيفية أداء الصلاة بطريقة صحيحة",
      descriptionFr: "Apprendre à accomplir la prière correctement",
      grade: Grade.GRADE_2, subject: Subject.ISLAMIC, contentType: ContentType.COURSE,
      isFree: true, price: null,
      youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg",
    },
    {
      titleAr: "قواعد اللغة العربية - السنة السادسة",
      titleFr: "Grammaire arabe — 6ème année",
      descriptionAr: "دروس متقدمة في قواعد اللغة العربية",
      descriptionFr: "Cours avancés de grammaire arabe",
      grade: Grade.GRADE_6, subject: Subject.ARABIC, contentType: ContentType.COURSE,
      isFree: false, price: 8.00,
      youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg",
    },
    {
      titleAr: "كتاب التاريخ والجغرافيا",
      titleFr: "Livre d'histoire-géographie",
      descriptionAr: "كتاب PDF للتاريخ والجغرافيا للسنة الخامسة",
      descriptionFr: "Livre PDF d'histoire-géographie pour la 5ème année",
      grade: Grade.GRADE_5, subject: Subject.HISTORY, contentType: ContentType.BOOK,
      isFree: false, price: 4.00,
    },
    {
      titleAr: "التربية المدنية - حقوق الطفل",
      titleFr: "Éducation civique — Droits de l'enfant",
      descriptionAr: "تعلم حقوق الطفل وواجباته",
      descriptionFr: "Apprendre les droits et devoirs de l'enfant",
      grade: Grade.GRADE_4, subject: Subject.CIVIC, contentType: ContentType.COURSE,
      isFree: true, price: null,
      youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg",
    },
  ]

  for (const data of contentData) {
    await prisma.content.create({ data: { ...data, uploadedById: admin.id } })
  }
  console.log(`${contentData.length} content items created`)

  console.log("\nSeeding complete!")
  console.log("─".repeat(50))
  console.log("Test accounts:")
  console.log("  Admin:   admin@edutunisia.tn / admin123")
  console.log("  Teacher: teacher@edutunisia.tn / teacher123")
  console.log("  Student: student@edutunisia.tn / student123")
  console.log("─".repeat(50))
}

main()
  .catch((e) => {
    console.error("Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
