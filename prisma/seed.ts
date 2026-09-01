import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function ensurePublicId(current?: string | null) {
  if (current) return current
  for (let i = 0; i < 20; i++) {
    const publicId = String(Math.floor(10000000 + Math.random() * 90000000))
    const exists = await prisma.user.findUnique({ where: { publicId }, select: { id: true } })
    if (!exists) return publicId
  }
  throw new Error("publicId generation failed")
}

async function main() {
  console.log("Seeding database...")

  const adminPassword = await bcrypt.hash("admin123", 12)
  const admin = await prisma.user.upsert({
    where: { email: "admin@edutunisia.tn" },
    update: {},
    create: {
      email: "admin@edutunisia.tn",
      passwordHash: adminPassword,
      fullName: "Admin Amenallah",
      role: "ADMIN",
      phone: "20000000",
      emailVerified: new Date(),
      publicId: "10000001",
    },
  })
  if (!admin.publicId) {
    await prisma.user.update({ where: { id: admin.id }, data: { publicId: await ensurePublicId() } })
  }
  console.log("Admin:", admin.email, "publicId:", admin.publicId || "10000001")

  const teacherPassword = await bcrypt.hash("teacher123", 12)
  const teacher = await prisma.user.upsert({
    where: { email: "teacher@edutunisia.tn" },
    update: {},
    create: {
      email: "teacher@edutunisia.tn",
      passwordHash: teacherPassword,
      fullName: "Mme Fatma Ben Ali",
      role: "TEACHER",
      phone: "20000001",
      emailVerified: new Date(),
      publicId: "10000002",
    },
  })
  console.log("Teacher:", teacher.email, "publicId:", teacher.publicId)

  const studentPassword = await bcrypt.hash("student123", 12)
  const student = await prisma.user.upsert({
    where: { email: "student@edutunisia.tn" },
    update: {},
    create: {
      email: "student@edutunisia.tn",
      passwordHash: studentPassword,
      fullName: "Mohamed Salah",
      role: "STUDENT",
      phone: "20000002",
      emailVerified: new Date(),
      publicId: "10000003",
    },
  })
  console.log("Student:", student.email, "publicId:", student.publicId)

  const parentPassword = await bcrypt.hash("parent123", 12)
  const parent = await prisma.user.upsert({
    where: { email: "parent@edutunisia.tn" },
    update: {},
    create: {
      email: "parent@edutunisia.tn",
      passwordHash: parentPassword,
      fullName: "Ali Ben Salah",
      role: "PARENT",
      phone: "20000003",
      emailVerified: new Date(),
      publicId: "10000004",
    },
  })
  console.log("Parent:", parent.email, "publicId:", parent.publicId)

  // Accepted parent–student link for demos
  await prisma.parentLink.upsert({
    where: { parentId_studentId: { parentId: parent.id, studentId: student.id } },
    update: { status: "ACCEPTED" },
    create: { parentId: parent.id, studentId: student.id, status: "ACCEPTED" },
  })

  // Keep content metadata reproducible without committing the local SQLite database.
  // Matching by Arabic title lets this also backfill content created in the local admin UI.
  const contentData = [
    {
      titleAr: "الحروف العربية - الجزء الأول",
      titleFr: "Les lettres arabes — Partie 1",
      descriptionAr: "تعلم الحروف العربية من الألف إلى الزاي مع فيديوهات ممتعة",
      descriptionFr: "Apprendre les lettres arabes de alif à zay avec des vidéos ludiques",
      grade: "GRADE_1",
      subject: "ARABIC",
      contentType: "COURSE",
      isFree: true,
      youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg",
    },
    {
      titleAr: "الرياضيات - الجمع والطرح",
      titleFr: "Mathématiques — Addition et soustraction",
      descriptionAr: "تعلم عمليات الجمع والطرح للأعداد من 1 إلى 100",
      descriptionFr: "Apprendre l'addition et la soustraction des nombres de 1 à 100",
      grade: "GRADE_2",
      subject: "MATH",
      contentType: "COURSE",
      isFree: true,
      youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    },
    {
      titleAr: "كتاب القراءة - السنة الثالثة",
      titleFr: "Livre de lecture — 3ème année",
      descriptionFr: "PDF de lecture (lien Drive à ajouter plus tard)",
      grade: "GRADE_3",
      subject: "FRENCH",
      contentType: "BOOK",
      isFree: false,
      price: 5,
    },
    {
      titleAr: "قصة متحركة: الصداقة",
      titleFr: "Animation: L'amitié",
      descriptionFr: "Animation éducative (lien Drive à ajouter plus tard)",
      grade: "GRADE_1",
      subject: "CIVIC",
      contentType: "ANIMATION",
      isFree: true,
    },
    {
      titleAr: "انا و عبد القادر في المدرسة",
      titleFr: "Abdelkader et moi à l'école ",
      descriptionAr: "",
      descriptionFr: "",
      grade: "GRADE_2",
      subject: "ARABIC",
      contentType: "SERIES",
      isFree: true,
      thumbnailUrl: "",
      youtubeUrl: "",
      pdfUrl: "https://drive.google.com/file/d/1U14KLR7kyesXMnuxkn8uTD2ll6sX1KxS/view?usp=sharing",
      gifUrl: "",
    },
    {
      titleAr: "انا و عبد القادر في المقهى ",
      titleFr: "Abdelkader et moi au café ",
      descriptionAr: "",
      descriptionFr: "",
      grade: "GRADE_2",
      subject: "ARABIC",
      contentType: "SERIES",
      isFree: true,
      thumbnailUrl: "",
      youtubeUrl: "",
      pdfUrl: "https://drive.google.com/file/d/1_Cc0BUmu7RMlGC_JYUJUBKYtAOIkuaGu/view?usp=sharing",
      gifUrl: "",
    },
    {
      titleAr: "انا و عبد القادر و الكلب",
      titleFr: "Abdulkader, the Dog and I",
      descriptionAr: "",
      descriptionFr: "",
      grade: "GRADE_5",
      subject: "ENGLISH",
      contentType: "SERIES",
      isFree: true,
      thumbnailUrl: "",
      youtubeUrl: "",
      pdfUrl: "https://drive.google.com/file/d/1C09tmkUAteLDoqHxARJh605dja5rEMys/view?usp=sharing",
      gifUrl: "",
    },
    {
      titleAr: "عدة هوايات ,ايام سعيدة ",
      titleFr: "Different Hobbies, Happy Days ",
      descriptionAr: "",
      descriptionFr: "",
      grade: "GRADE_5",
      subject: "ENGLISH",
      contentType: "BOOK",
      isFree: true,
      thumbnailUrl: "",
      youtubeUrl: "",
      pdfUrl: "https://drive.google.com/file/d/10mbOLO16Ky15Wuw0-v_EftpFLpr3RqA0/view?usp=sharing",
      gifUrl: "",
    },
    {
      titleAr: "حفلة المدرسة السرية",
      titleFr: "The secret Classroom Party ",
      descriptionAr: "",
      descriptionFr: "",
      grade: "GRADE_6",
      subject: "ENGLISH",
      contentType: "BOOK",
      isFree: true,
      thumbnailUrl: "",
      youtubeUrl: "",
      pdfUrl: "https://drive.google.com/file/d/1UL_sebpf0ev83zws5qL9JetJ96Wbqjqj/view?usp=sharing",
      gifUrl: "",
    },
    {
      titleAr: "عبد القادر في الميناء",
      titleFr: "Abdelkader et moi au port",
      descriptionAr: "",
      descriptionFr: "",
      grade: "GRADE_1",
      subject: "ARABIC",
      contentType: "SERIES",
      isFree: true,
      thumbnailUrl: "",
      youtubeUrl: "",
      pdfUrl: "https://drive.google.com/file/d/1cHHuzi5rH2uPbIf60Ffaecg4muwEArbu/view?usp=sharing",
      gifUrl: "",
    },
    {
      titleAr: "انا و عبد القادر و التحدي الكبير",
      titleFr: "Abdelkader ou le grand défi",
      descriptionAr: "",
      descriptionFr: "",
      grade: "GRADE_2",
      subject: "ARABIC",
      contentType: "BOOK",
      isFree: true,
      thumbnailUrl: "",
      youtubeUrl: "",
      pdfUrl: "https://drive.google.com/file/d/19MOcCx2Q31BzHk6QTmH6XIbZ8MVGDeq-/view?usp=sharing",
      gifUrl: "",
    },
  ]

  let createdContent = 0
  let updatedContent = 0
  for (const item of contentData) {
    const existing = await prisma.content.findFirst({ where: { titleAr: item.titleAr }, select: { id: true } })
    if (existing) {
      await prisma.content.update({ where: { id: existing.id }, data: { ...item, uploadedById: admin.id, status: "PUBLISHED" } })
      updatedContent++
    } else {
      await prisma.content.create({ data: { ...item, uploadedById: admin.id, status: "PUBLISHED" } })
      createdContent++
    }
  }
  console.log(`Content metadata synchronized: ${createdContent} created, ${updatedContent} updated`)

  // Backfill publicId for any user missing it
  const missing = await prisma.user.findMany({ where: { publicId: "" } }).catch(() => [])
  // Also find via raw if needed — after migration all should have publicId

  console.log("Seed complete.")
  console.log("Accounts:")
  console.log("  admin@edutunisia.tn / admin123     (ID 10000001)")
  console.log("  teacher@edutunisia.tn / teacher123 (ID 10000002)")
  console.log("  student@edutunisia.tn / student123 (ID 10000003)")
  console.log("  parent@edutunisia.tn / parent123   (ID 10000004)")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
