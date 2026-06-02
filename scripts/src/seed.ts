import { db } from "@workspace/db";
import {
  studentsTable,
  teachersTable,
  circlesTable,
  sessionsTable,
  sessionRecordsTable,
  invoicesTable,
  expensesTable,
  notificationsTable,
} from "@workspace/db";

async function seed() {
  console.log("🌱 Seeding database...");

  // Teachers
  const [teacher1, teacher2] = await db
    .insert(teachersTable)
    .values([
      {
        fullName: "الشيخ أحمد محمد السيد",
        phone: "01001234567",
        secondaryPhone: "01111234567",
        email: "ahmed@quran-circles.com",
        age: 45,
        address: "القاهرة - مدينة نصر",
        salary: "3500",
        hireDate: "2020-01-15",
        experience: "15 سنة في تحفيظ القرآن الكريم",
        notes: "حاصل على إجازة بالقراءات العشر",
      },
      {
        fullName: "الشيخ محمود إبراهيم حسن",
        phone: "01009876543",
        secondaryPhone: "01119876543",
        email: "mahmoud@quran-circles.com",
        age: 38,
        address: "الجيزة - المنيل",
        salary: "3000",
        hireDate: "2021-06-01",
        experience: "10 سنوات",
        notes: "متخصص في تحفيظ الأطفال",
      },
    ])
    .returning();

  console.log("✅ Teachers inserted");

  // Circles
  const [circle1, circle2, circle3] = await db
    .insert(circlesTable)
    .values([
      {
        name: "حلقة الفجر",
        description: "حلقة صباحية للطلاب المتقدمين",
        days: "الأحد - الثلاثاء - الخميس",
        time: "06:00 - 07:30",
        teacherId: teacher1.id,
        status: "نشطة",
      },
      {
        name: "حلقة النور",
        description: "حلقة مسائية للمبتدئين والمتوسطين",
        days: "الاثنين - الأربعاء",
        time: "17:00 - 18:30",
        teacherId: teacher1.id,
        status: "نشطة",
      },
      {
        name: "حلقة الأطفال",
        description: "حلقة مخصصة للأطفال من سن 6 إلى 12 سنة",
        days: "السبت - الجمعة",
        time: "15:00 - 16:00",
        teacherId: teacher2.id,
        status: "نشطة",
      },
    ])
    .returning();

  console.log("✅ Circles inserted");

  // Students
  const students = await db
    .insert(studentsTable)
    .values([
      {
        fullName: "عمر عبدالله الأحمد",
        age: 14,
        birthDate: "2010-03-15",
        grade: "الثالث الإعدادي",
        address: "القاهرة - مدينة نصر - شارع 9",
        governorate: "القاهرة",
        guardianPhone: "01001111111",
        secondaryPhone: "01111111111",
        teacherId: teacher1.id,
        circleId: circle1.id,
        paymentStatus: "مدفوع",
        paymentAmount: "150",
        isExempt: false,
        currentMemorization: "سورة البقرة - الآية 150",
        currentRevision: "الجزء الأول",
        level: "ممتاز",
        rating: 9,
        enrollmentDate: "2024-09-01",
        points: 320,
      },
      {
        fullName: "يوسف محمد الحسيني",
        age: 12,
        birthDate: "2012-07-22",
        grade: "السادس الابتدائي",
        address: "القاهرة - الدقي",
        governorate: "القاهرة",
        guardianPhone: "01002222222",
        teacherId: teacher1.id,
        circleId: circle1.id,
        paymentStatus: "مدفوع",
        paymentAmount: "150",
        isExempt: false,
        currentMemorization: "سورة آل عمران - الآية 80",
        currentRevision: "الجزء الثاني",
        level: "جيد جداً",
        rating: 8,
        enrollmentDate: "2024-09-01",
        points: 280,
      },
      {
        fullName: "فاطمة علي الزهراء",
        age: 16,
        birthDate: "2008-11-05",
        grade: "الأول الثانوي",
        address: "الجيزة - الهرم",
        governorate: "الجيزة",
        guardianPhone: "01003333333",
        teacherId: teacher1.id,
        circleId: circle2.id,
        paymentStatus: "مدفوع",
        paymentAmount: "150",
        isExempt: false,
        currentMemorization: "سورة النساء - الآية 30",
        currentRevision: "الجزء الثالث",
        level: "ممتاز",
        rating: 10,
        enrollmentDate: "2024-09-01",
        points: 410,
      },
      {
        fullName: "محمد سالم القرشي",
        age: 10,
        birthDate: "2014-02-14",
        grade: "الرابع الابتدائي",
        address: "القاهرة - عين شمس",
        governorate: "القاهرة",
        guardianPhone: "01004444444",
        teacherId: teacher2.id,
        circleId: circle3.id,
        paymentStatus: "غير مدفوع",
        paymentAmount: "100",
        isExempt: false,
        currentMemorization: "جزء عم - سورة الناس",
        currentRevision: "جزء عم",
        level: "جيد",
        rating: 7,
        enrollmentDate: "2024-10-01",
        points: 150,
      },
      {
        fullName: "سارة أحمد المنصور",
        age: 11,
        birthDate: "2013-06-30",
        grade: "الخامس الابتدائي",
        address: "القاهرة - المعادي",
        governorate: "القاهرة",
        guardianPhone: "01005555555",
        teacherId: teacher2.id,
        circleId: circle3.id,
        paymentStatus: "مدفوع",
        paymentAmount: "100",
        isExempt: false,
        currentMemorization: "جزء تبارك - سورة الملك",
        currentRevision: "جزء عم",
        level: "جيد جداً",
        rating: 8,
        enrollmentDate: "2024-09-15",
        points: 200,
      },
      {
        fullName: "زياد عبدالرحمن البكري",
        age: 15,
        birthDate: "2009-09-12",
        grade: "الثاني الإعدادي",
        address: "القاهرة - حلوان",
        governorate: "القاهرة",
        guardianPhone: "01006666666",
        teacherId: teacher1.id,
        circleId: circle2.id,
        paymentStatus: "غير مدفوع",
        paymentAmount: "150",
        isExempt: false,
        currentMemorization: "سورة البقرة - الآية 50",
        currentRevision: "الجزء الأول",
        level: "ضعيف",
        rating: 5,
        enrollmentDate: "2025-01-01",
        points: 80,
      },
      {
        fullName: "نور الدين عمر خالد",
        age: 8,
        birthDate: "2016-04-18",
        grade: "الثالث الابتدائي",
        address: "الجيزة - أكتوبر",
        governorate: "الجيزة",
        guardianPhone: "01007777777",
        teacherId: teacher2.id,
        circleId: circle3.id,
        paymentStatus: "معفي",
        paymentAmount: "0",
        isExempt: true,
        currentMemorization: "جزء عم - سورة الأعلى",
        level: "جيد",
        rating: 7,
        enrollmentDate: "2025-02-01",
        points: 120,
      },
      {
        fullName: "أيمن محمود الشريف",
        age: 13,
        birthDate: "2011-12-01",
        grade: "الأول الإعدادي",
        address: "القاهرة - شبرا",
        governorate: "القاهرة",
        guardianPhone: "01008888888",
        teacherId: teacher1.id,
        circleId: circle1.id,
        paymentStatus: "مدفوع",
        paymentAmount: "150",
        isExempt: false,
        currentMemorization: "سورة البقرة - الآية 200",
        currentRevision: "الجزء الثاني",
        level: "جيد جداً",
        rating: 8,
        enrollmentDate: "2024-09-01",
        points: 260,
      },
    ])
    .returning();

  console.log("✅ Students inserted:", students.length);

  // Sessions for this month
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dayBefore = new Date(today);
  dayBefore.setDate(dayBefore.getDate() - 3);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const [session1, session2, session3] = await db
    .insert(sessionsTable)
    .values([
      {
        circleId: circle1.id,
        teacherId: teacher1.id,
        date: lastWeek.toISOString().split("T")[0],
        day: "الأحد",
        time: "06:00 - 07:30",
        status: "مكتملة",
      },
      {
        circleId: circle2.id,
        teacherId: teacher1.id,
        date: dayBefore.toISOString().split("T")[0],
        day: "الاثنين",
        time: "17:00 - 18:30",
        status: "مكتملة",
      },
      {
        circleId: circle3.id,
        teacherId: teacher2.id,
        date: yesterday.toISOString().split("T")[0],
        day: "الخميس",
        time: "15:00 - 16:00",
        status: "مكتملة",
      },
    ])
    .returning();

  console.log("✅ Sessions inserted");

  // Session records
  const circle1Students = students.filter((s) => s.circleId === circle1.id);
  const circle2Students = students.filter((s) => s.circleId === circle2.id);
  const circle3Students = students.filter((s) => s.circleId === circle3.id);

  await db.insert(sessionRecordsTable).values([
    ...circle1Students.map((s, i) => ({
      sessionId: session1.id,
      studentId: s.id,
      isPresent: i !== 1,
      memorizationAmount: s.currentMemorization ?? null,
      revisionAmount: s.currentRevision ?? null,
      grade: 85 + i * 3,
      performanceLabel: "جيد جداً",
    })),
    ...circle2Students.map((s, i) => ({
      sessionId: session2.id,
      studentId: s.id,
      isPresent: true,
      memorizationAmount: s.currentMemorization ?? null,
      revisionAmount: s.currentRevision ?? null,
      grade: 75 + i * 5,
      performanceLabel: i === 0 ? "ممتاز" : "جيد",
    })),
    ...circle3Students.map((s, i) => ({
      sessionId: session3.id,
      studentId: s.id,
      isPresent: i !== 2,
      memorizationAmount: s.currentMemorization ?? null,
      revisionAmount: s.currentRevision ?? null,
      grade: 70 + i * 5,
      performanceLabel: "جيد",
    })),
  ]);

  console.log("✅ Session records inserted");

  // Invoices — current month
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const prevMonth = `${today.getFullYear()}-${String(today.getMonth()).padStart(2, "0")}`;

  const invoiceValues = [
    ...students.map((s) => ({
      studentId: s.id,
      month: currentMonth,
      amount: s.paymentAmount ?? "0",
      status: s.paymentStatus === "مدفوع" ? "مدفوع" : s.isExempt ? "معفي" : "غير مدفوع",
      isExempt: s.isExempt,
      paidAt:
        s.paymentStatus === "مدفوع"
          ? new Date(today.getFullYear(), today.getMonth(), 3)
          : null,
    })),
    ...students
      .filter((s) => !s.isExempt)
      .map((s) => ({
        studentId: s.id,
        month: prevMonth,
        amount: s.paymentAmount ?? "0",
        status: "مدفوع" as const,
        isExempt: false,
        paidAt: new Date(today.getFullYear(), today.getMonth() - 1, 10),
      })),
  ];

  await db.insert(invoicesTable).values(invoiceValues);
  console.log("✅ Invoices inserted");

  // Expenses
  await db.insert(expensesTable).values([
    {
      category: "مرتبات",
      description: "مرتب الشيخ أحمد - مايو 2026",
      amount: "3500",
      date: `${currentMonth}-01`,
    },
    {
      category: "مرتبات",
      description: "مرتب الشيخ محمود - مايو 2026",
      amount: "3000",
      date: `${currentMonth}-01`,
    },
    {
      category: "صيانة",
      description: "صيانة مكيفات القاعة الكبرى",
      amount: "500",
      date: `${currentMonth}-05`,
    },
    {
      category: "مستلزمات",
      description: "مصاحف وكتب تجويد",
      amount: "350",
      date: `${currentMonth}-08`,
    },
    {
      category: "كهرباء",
      description: "فاتورة الكهرباء",
      amount: "280",
      date: `${currentMonth}-10`,
    },
  ]);
  console.log("✅ Expenses inserted");

  // Notifications
  await db.insert(notificationsTable).values([
    {
      type: "غياب",
      title: "غياب طالب",
      message: `الطالب يوسف محمد تغيب عن حلقة الفجر اليوم`,
      studentId: students[1].id,
      isRead: false,
      priority: "عادي",
    },
    {
      type: "مالي",
      title: "تأخر في سداد الرسوم",
      message: `الطالب محمد سالم القرشي لم يسدد رسوم الشهر الحالي`,
      studentId: students[3].id,
      isRead: false,
      priority: "مهم",
    },
    {
      type: "مالي",
      title: "تأخر في سداد الرسوم",
      message: `الطالب زياد عبدالرحمن لم يسدد رسوم الشهر الحالي`,
      studentId: students[5].id,
      isRead: false,
      priority: "مهم",
    },
    {
      type: "أداء",
      title: "طالب يحتاج متابعة",
      message: `الطالب زياد عبدالرحمن البكري يُظهر مستوى ضعيفاً يحتاج إلى متابعة مكثفة`,
      studentId: students[5].id,
      isRead: false,
      priority: "عاجل",
    },
    {
      type: "إنجاز",
      title: "إنجاز مميز",
      message: `الطالبة فاطمة علي الزهراء حفظت الجزء الثالث كاملاً بإتقان تام`,
      studentId: students[2].id,
      isRead: true,
      priority: "عادي",
    },
    {
      type: "عام",
      title: "تذكير بالاجتماع الشهري",
      message: "اجتماع المعلمين الشهري يوم الجمعة القادم الساعة 5 مساءً",
      isRead: false,
      priority: "عادي",
    },
  ]);
  console.log("✅ Notifications inserted");

  console.log("🎉 Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
