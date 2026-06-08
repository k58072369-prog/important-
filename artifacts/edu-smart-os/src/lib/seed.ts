/**
 * Comprehensive demo-data seeder for EDU SMART OS.
 * Inserts teachers, circles, students, sessions, session records,
 * invoices, expenses, salary records, competitions, courses and notifications.
 * Safe to call multiple times (checks for existing data first).
 */
import { db, genId, now } from "./db";

const CODE_COUNTER_KEY = "furqan_student_code_counter";
function nextCode(): string {
  const cur = parseInt(localStorage.getItem(CODE_COUNTER_KEY) ?? "0", 10);
  const nxt = cur + 1;
  localStorage.setItem(CODE_COUNTER_KEY, String(nxt));
  return `STD-${String(nxt).padStart(5, "0")}`;
}

function d(offset = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().split("T")[0];
}
function monthStr(monthOffset = 0): string {
  const date = new Date();
  date.setMonth(date.getMonth() + monthOffset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(monthOffset = 0): string {
  const date = new Date();
  date.setMonth(date.getMonth() + monthOffset);
  return date.toLocaleDateString("ar-EG", { month: "long", year: "numeric" });
}

const SEED_KEY = "furqan_demo_seeded_v2";

export async function clearAllData(): Promise<void> {
  await Promise.all([
    db.students.clear(), db.teachers.clear(), db.circles.clear(),
    db.sessions.clear(), db.session_records.clear(),
    db.invoices.clear(), db.expenses.clear(), db.salary_records.clear(),
    db.notifications.clear(),
    db.courses.clear(), db.course_students.clear(), db.course_sessions.clear(), db.course_session_records.clear(),
    db.competitions.clear(), db.competition_levels.clear(), db.competition_enrollments.clear(), db.competition_results.clear(),
    db.monthly_reports.clear(),
  ]);
  localStorage.removeItem(SEED_KEY);
  localStorage.removeItem("furqan_demo_seeded_v1");
  localStorage.removeItem("furqan_student_code_counter");
}

export async function seedDemoData(): Promise<{ inserted: number; skipped: boolean }> {
  if (localStorage.getItem(SEED_KEY)) return { inserted: 0, skipped: true };
  localStorage.setItem(SEED_KEY, "1"); // lock early to prevent race with StrictMode double-invoke
  const existingTeachers = await db.teachers.count();
  if (existingTeachers >= 3) return { inserted: 0, skipped: true };

  let inserted = 0;

  /* ─── TEACHERS ─────────────────────────────────────────────────────────── */
  const teachers = [
    { id: genId(), full_name: "أحمد محمد السيد", phone: "01001234567", salary: 3000, hire_date: "2020-09-01", experience: "8 سنوات في التحفيظ", notes: "حافظ للقرآن الكريم كاملاً بالقراءات العشر" },
    { id: genId(), full_name: "محمود عبد الرحمن", phone: "01112345678", salary: 2800, hire_date: "2021-01-15", experience: "5 سنوات", notes: "متخصص في تعليم الأطفال" },
    { id: genId(), full_name: "يوسف إبراهيم الخطيب", phone: "01223456789", salary: 3200, hire_date: "2019-03-10", experience: "10 سنوات", notes: "إمام مسجد ومعلم متميز" },
    { id: genId(), full_name: "عمر عبد الله النور", phone: "01334567890", salary: 2600, hire_date: "2022-06-01", experience: "3 سنوات", notes: "خريج الأزهر الشريف" },
  ];
  for (const t of teachers) {
    await db.teachers.add({ ...t, created_at: now(), updated_at: now() });
    inserted++;
  }

  /* ─── CIRCLES ───────────────────────────────────────────────────────────── */
  const circles = [
    { id: genId(), name: "حلقة النور", teacher_id: teachers[0].id, teacher_name: teachers[0].full_name, days: "السبت، الاثنين، الأربعاء", time: "08:00", status: "نشطة", description: "حلقة للحفظ والمراجعة للمستوى المتقدم" },
    { id: genId(), name: "حلقة الفرقان", teacher_id: teachers[1].id, teacher_name: teachers[1].full_name, days: "الأحد، الثلاثاء، الخميس", time: "09:30", status: "نشطة", description: "حلقة للناشئين والمبتدئين" },
    { id: genId(), name: "حلقة الرحمن", teacher_id: teachers[2].id, teacher_name: teachers[2].full_name, days: "السبت، الثلاثاء، الخميس", time: "16:00", status: "نشطة", description: "حلقة المساء للطلاب الكبار" },
    { id: genId(), name: "حلقة الكوثر", teacher_id: teachers[3].id, teacher_name: teachers[3].full_name, days: "الاثنين، الأربعاء، الجمعة", time: "17:30", status: "نشطة", description: "حلقة خاصة بالأطفال من سن 6-12" },
    { id: genId(), name: "حلقة الإخلاص", teacher_id: teachers[0].id, teacher_name: teachers[0].full_name, days: "السبت، الأحد", time: "10:00", status: "متوقفة مؤقتاً", description: "حلقة مكثفة للتحضير للمسابقات" },
  ];
  for (const c of circles) {
    await db.circles.add({ ...c, student_count: 0, created_at: now(), updated_at: now() });
    inserted++;
  }

  /* ─── STUDENTS ──────────────────────────────────────────────────────────── */
  const rawStudents = [
    // Circle 0 — النور (teacher 0)
    { full_name: "عبد الله محمد علي", grade: "الصف الثامن", guardian_phone: "01001111111", circle: 0, level: "متقدم", payment_amount: 200, points: 950, rating: 9, current_memorization: "سورة البقرة - الآية 150", current_revision: "الجزء الأول" },
    { full_name: "يزيد أحمد الشريف", grade: "الصف التاسع", guardian_phone: "01002222222", circle: 0, level: "متقدم", payment_amount: 200, points: 880, rating: 8, current_memorization: "سورة آل عمران - الآية 50", current_revision: "الجزء الثاني" },
    { full_name: "حسن خالد الفار", grade: "الصف العاشر", guardian_phone: "01003333333", circle: 0, level: "متوسط", payment_amount: 200, points: 720, rating: 7, current_memorization: "سورة النساء - الآية 30", current_revision: "الجزء الثالث" },
    { full_name: "بلال عمر الحسيني", grade: "الصف السابع", guardian_phone: "01004444444", circle: 0, level: "متقدم", payment_amount: 200, points: 1020, rating: 10, current_memorization: "سورة المائدة - الآية 10", current_revision: "الجزء الرابع" },
    { full_name: "طارق سيد فريد", grade: "الصف الثامن", guardian_phone: "01005555555", circle: 0, level: "متوسط", payment_amount: 200, points: 640, rating: 7, current_memorization: "سورة الأنعام - الآية 80", current_revision: "الجزء الخامس" },
    // Circle 1 — الفرقان (teacher 1)
    { full_name: "نور الدين رامي", grade: "الصف الخامس", guardian_phone: "01011111111", circle: 1, level: "مبتدئ", payment_amount: 150, points: 340, rating: 6, current_memorization: "سورة الناس", current_revision: "جزء عم" },
    { full_name: "أيمن وليد السعدي", grade: "الصف الرابع", guardian_phone: "01012222222", circle: 1, level: "مبتدئ", payment_amount: 150, points: 290, rating: 6, current_memorization: "سورة الفلق", current_revision: "جزء عم" },
    { full_name: "جاد الله إبراهيم", grade: "الصف السادس", guardian_phone: "01013333333", circle: 1, level: "متوسط", payment_amount: 150, points: 510, rating: 7, current_memorization: "سورة الملك", current_revision: "جزء تبارك" },
    { full_name: "زياد فاروق نصر", grade: "الصف الخامس", guardian_phone: "01014444444", circle: 1, level: "مبتدئ", payment_amount: 150, is_exempt: true, points: 180, rating: 5, current_memorization: "سورة الكافرون", current_revision: "جزء عم" },
    { full_name: "معاذ حسام الدين", grade: "الصف السادس", guardian_phone: "01015555555", circle: 1, level: "متوسط", payment_amount: 150, points: 420, rating: 7, current_memorization: "سورة الرحمن - الآية 25", current_revision: "جزء الرحمن" },
    // Circle 2 — الرحمن (teacher 2)
    { full_name: "خالد مصطفى الجمل", grade: "الصف الحادي عشر", guardian_phone: "01021111111", circle: 2, level: "متقدم", payment_amount: 250, points: 870, rating: 9, current_memorization: "سورة التوبة - الآية 60", current_revision: "الجزء العاشر" },
    { full_name: "عمران علاء الدين", grade: "الصف الثاني عشر", guardian_phone: "01022222222", circle: 2, level: "متقدم", payment_amount: 250, points: 960, rating: 9, current_memorization: "سورة يونس - الآية 40", current_revision: "الجزء الحادي عشر" },
    { full_name: "سليمان رفعت باشا", grade: "الصف العاشر", guardian_phone: "01023333333", circle: 2, level: "متوسط", payment_amount: 250, points: 680, rating: 7, current_memorization: "سورة هود - الآية 20", current_revision: "الجزء الثاني عشر" },
    { full_name: "إبراهيم السيد رمضان", grade: "الصف الحادي عشر", guardian_phone: "01024444444", circle: 2, level: "متقدم", payment_amount: 250, points: 810, rating: 8, current_memorization: "سورة يوسف - الآية 55", current_revision: "الجزء الثالث عشر" },
    // Circle 3 — الكوثر (teacher 3)
    { full_name: "أنس ربيع الهلال", grade: "الصف الثالث", guardian_phone: "01031111111", circle: 3, level: "مبتدئ", payment_amount: 120, points: 210, rating: 6, current_memorization: "سورة الإخلاص", current_revision: "جزء عم" },
    { full_name: "كريم سامي المنيسي", grade: "الصف الأول", guardian_phone: "01032222222", circle: 3, level: "مبتدئ", payment_amount: 120, points: 150, rating: 5, current_memorization: "سورة الفاتحة", current_revision: "جزء عم" },
    { full_name: "حمزة طاهر عزيز", grade: "الصف الثاني", guardian_phone: "01033333333", circle: 3, level: "مبتدئ", payment_amount: 120, points: 175, rating: 6, current_memorization: "سورة الماعون", current_revision: "جزء عم" },
    { full_name: "يحيى وائل الصباح", grade: "الصف الثالث", guardian_phone: "01034444444", circle: 3, level: "مبتدئ", payment_amount: 120, is_exempt: true, points: 90, rating: 5, current_memorization: "سورة قريش", current_revision: "جزء عم" },
    { full_name: "مصعب رشيد الحموي", grade: "الصف الرابع", guardian_phone: "01035555555", circle: 3, level: "مبتدئ", payment_amount: 120, points: 270, rating: 6, current_memorization: "سورة الضحى", current_revision: "جزء عم" },
    { full_name: "ثابت كمال الكيلاني", grade: "الصف الثاني", guardian_phone: "01036666666", circle: 3, level: "مبتدئ", payment_amount: 120, points: 130, rating: 5, current_memorization: "سورة الناس", current_revision: "جزء عم" },
    // Circle 4 - mix
    { full_name: "قتيبة فهد العمري", grade: "الصف التاسع", guardian_phone: "01041111111", circle: 0, level: "متوسط", payment_amount: 200, points: 590, rating: 7, current_memorization: "سورة الأعراف - الآية 100", current_revision: "الجزء السادس" },
    { full_name: "جعفر صادق النابلسي", grade: "الصف العاشر", guardian_phone: "01042222222", circle: 2, level: "متوسط", payment_amount: 250, points: 730, rating: 8, current_memorization: "سورة إبراهيم - الآية 15", current_revision: "الجزء الرابع عشر" },
    { full_name: "عبد الرحمن لقمان", grade: "الصف الثامن", guardian_phone: "01043333333", circle: 1, level: "متوسط", payment_amount: 150, points: 480, rating: 7, current_memorization: "سورة الكهف - الآية 50", current_revision: "جزء الكهف" },
    { full_name: "سفيان ثوري مصري", grade: "الصف السابع", guardian_phone: "01044444444", circle: 0, level: "مبتدئ", payment_amount: 200, points: 310, rating: 6, current_memorization: "سورة مريم - الآية 20", current_revision: "جزء مريم" },
    { full_name: "وليد سعيد البغدادي", grade: "الصف الحادي عشر", guardian_phone: "01045555555", circle: 2, level: "متقدم", payment_amount: 250, points: 890, rating: 9, current_memorization: "سورة طه - الآية 70", current_revision: "الجزء السادس عشر" },
  ];

  const studentIds: string[] = [];
  const studentNames: string[] = [];
  const studentCircles: number[] = [];

  for (let i = 0; i < rawStudents.length; i++) {
    const rs = rawStudents[i];
    const id = genId();
    const circle = circles[rs.circle];
    const teacher = teachers[rs.circle < teachers.length ? (rs.circle === 0 ? 0 : rs.circle === 1 ? 1 : rs.circle === 2 ? 2 : 3) : 0];
    const realTeacher = rs.circle < circles.length ? teachers.find(t => t.id === circles[rs.circle].teacher_id) : teacher;
    const student_code = nextCode();
    await db.students.add({
      id,
      student_code,
      full_name: rs.full_name,
      grade: rs.grade,
      guardian_phone: rs.guardian_phone,
      circle_id: circle.id,
      circle_name: circle.name,
      teacher_id: realTeacher?.id,
      teacher_name: realTeacher?.full_name,
      payment_status: rs.is_exempt ? "معفي" : "مدفوع",
      payment_amount: rs.payment_amount,
      is_exempt: rs.is_exempt ?? false,
      level: rs.level,
      points: rs.points,
      rating: rs.rating,
      current_memorization: rs.current_memorization,
      current_revision: rs.current_revision,
      enrollment_date: d(-Math.floor(Math.random() * 300 + 30)),
      created_at: now(),
      updated_at: now(),
    });
    studentIds.push(id);
    studentNames.push(rs.full_name);
    studentCircles.push(rs.circle);
    inserted++;
  }

  /* ─── SESSIONS + RECORDS ────────────────────────────────────────────────── */
  const performanceLabels = ["ممتاز", "جيد جداً", "جيد", "مقبول", "ضعيف"];
  const memoPositions = [
    "سورة البقرة - الآية 50", "سورة البقرة - الآية 100", "سورة آل عمران - الآية 30",
    "سورة النساء - الآية 20", "سورة المائدة - الآية 15", "سورة الأنعام - الآية 40",
    "سورة الأعراف - الآية 60", "سورة الكهف - الآية 30", "سورة مريم - الآية 10",
    "سورة طه - الآية 50",
  ];

  for (let c = 0; c < circles.length - 1; c++) {
    const circle = circles[c];
    const circleStudentIds = studentIds.filter((_, i) => studentCircles[i] === c);
    const circleStudentNames = studentNames.filter((_, i) => studentCircles[i] === c);
    if (circleStudentIds.length === 0) continue;

    // 12 sessions over the past 6 weeks (Mon/Wed/Sat pattern roughly)
    for (let s = 0; s < 12; s++) {
      const daysBack = s * 4 + Math.floor(Math.random() * 3);
      const sessionDate = d(-daysBack - 1);
      const sessionId = genId();
      let presentCount = 0;

      const records: any[] = [];
      for (let si = 0; si < circleStudentIds.length; si++) {
        const absent = Math.random() < 0.15; // 85% attendance
        if (!absent) presentCount++;
        const grade = absent ? undefined : Math.floor(Math.random() * 31) + 70; // 70-100
        const perfIdx = grade
          ? grade >= 95 ? 0 : grade >= 85 ? 1 : grade >= 75 ? 2 : grade >= 65 ? 3 : 4
          : undefined;
        const memo = !absent && Math.random() > 0.3;
        const rev = !absent && Math.random() > 0.2;
        records.push({
          id: genId(),
          session_id: sessionId,
          student_id: circleStudentIds[si],
          student_name: circleStudentNames[si],
          is_present: !absent,
          grade: absent ? undefined : grade,
          performance_label: perfIdx !== undefined ? performanceLabels[perfIdx] : undefined,
          memorization_amount: memo ? `${Math.floor(Math.random() * 10 + 1)} آيات` : undefined,
          revision_amount: rev ? `${Math.floor(Math.random() * 5 + 1)} صفحات` : undefined,
          next_memorization: memo ? memoPositions[Math.floor(Math.random() * memoPositions.length)] : undefined,
          next_revision: rev ? memoPositions[Math.floor(Math.random() * memoPositions.length)] : undefined,
          notes: absent && Math.random() > 0.5 ? (Math.random() > 0.5 ? "غياب بعذر مرضي" : "غياب بدون إذن") : undefined,
          created_at: now(),
        });
      }
      await db.sessions.add({
        id: sessionId,
        circle_id: circle.id,
        circle_name: circle.name,
        teacher_id: circle.teacher_id,
        teacher_name: circle.teacher_name,
        date: sessionDate,
        status: "مكتملة",
        present_count: presentCount,
        student_count: circleStudentIds.length,
        created_at: now(),
      });
      for (const rec of records) await db.session_records.add(rec);
      inserted += 1 + records.length;
    }
  }

  /* ─── INVOICES ──────────────────────────────────────────────────────────── */
  const invoiceMonthLabels = [monthLabel(-2), monthLabel(-1), monthLabel(0)];
  const currentMonthLabel = monthLabel(0);
  for (const m of invoiceMonthLabels) {
    for (let i = 0; i < studentIds.length; i++) {
      const rs = rawStudents[i];
      if (rs.is_exempt) continue;
      const isCurrentMonth = m === currentMonthLabel;
      const paid = isCurrentMonth ? Math.random() > 0.35 : Math.random() > 0.1;
      await db.invoices.add({
        id: genId(),
        student_id: studentIds[i],
        student_name: studentNames[i],
        month: m,
        amount: rs.payment_amount,
        paid_amount: paid ? rs.payment_amount : (Math.random() > 0.5 ? Math.floor(rs.payment_amount / 2) : 0),
        status: paid ? "مدفوع" : "متأخر",
        payment_method: paid ? (Math.random() > 0.4 ? "نقدي" : "تحويل بنكي") : undefined,
        payment_date: paid ? d(-Math.floor(Math.random() * 15)) : undefined,
        created_at: now(),
        updated_at: now(),
      });
      inserted++;
    }
  }

  /* ─── SALARY RECORDS ────────────────────────────────────────────────────── */
  for (const t of teachers) {
    for (let mi = 0; mi < invoiceMonthLabels.length; mi++) {
      const m = invoiceMonthLabels[mi];
      const bonus = Math.random() > 0.6 ? Math.floor(Math.random() * 300 + 100) : 0;
      const deduction = Math.random() > 0.8 ? 100 : 0;
      const isPast = mi < 2;
      await db.salary_records.add({
        id: genId(),
        teacher_id: t.id,
        teacher_name: t.full_name,
        month: m,
        base_salary: t.salary!,
        bonuses: bonus,
        deductions: deduction,
        total_amount: t.salary! + bonus - deduction,
        payment_method: "تحويل بنكي",
        status: isPast ? "مدفوع" : "معلق",
        paid_at: isPast ? d(-Math.floor(Math.random() * 10 + 1)) : undefined,
        created_at: now(),
        updated_at: now(),
      });
      inserted++;
    }
  }

  /* ─── EXPENSES ──────────────────────────────────────────────────────────── */
  const expenses = [
    { category: "كهرباء", description: "فاتورة الكهرباء الشهرية", amount: 450 },
    { category: "مياه", description: "فاتورة المياه", amount: 120 },
    { category: "صيانة", description: "صيانة أجهزة التكييف", amount: 800 },
    { category: "قرطاسية", description: "أوراق وأقلام وملفات", amount: 230 },
    { category: "تسويق", description: "طباعة إعلانات الحلقات", amount: 350 },
    { category: "متفرقات", description: "نفقات متنوعة", amount: 180 },
    { category: "إيجار", description: "إيجار مقر الحلقات", amount: 2500 },
    { category: "صيانة", description: "تجديد مكيف السبورة البيضاء", amount: 600 },
    { category: "قرطاسية", description: "طباعة المصاحف والكتيبات", amount: 450 },
    { category: "متفرقات", description: "مكافآت الطلاب المتميزين", amount: 700 },
    { category: "إيجار", description: "إيجار قاعة الاختبارات", amount: 1200 },
    { category: "كهرباء", description: "فاتورة كهرباء الشهر الماضي", amount: 420 },
  ];
  for (let i = 0; i < expenses.length; i++) {
    await db.expenses.add({
      id: genId(),
      ...expenses[i],
      responsible: teachers[i % teachers.length].full_name,
      date: d(-Math.floor(Math.random() * 60 + 1)),
      payment_method: Math.random() > 0.5 ? "نقدي" : "تحويل بنكي",
      created_at: now(),
    });
    inserted++;
  }

  /* ─── COMPETITIONS ──────────────────────────────────────────────────────── */
  const comp1Id = genId();
  const comp2Id = genId();
  const comp3Id = genId();
  await db.competitions.add({
    id: comp1Id, name: "مسابقة رمضان للحفظ", description: "المسابقة السنوية الكبرى لحفظ القرآن الكريم بمناسبة شهر رمضان المبارك",
    start_date: d(10), end_date: d(40), status: "قادمة", level_count: 3, participant_count: 0,
    created_at: now(), updated_at: now(),
  });
  await db.competitions.add({
    id: comp2Id, name: "مسابقة الفرقان الداخلية", description: "مسابقة داخلية شهرية لتحفيز الطلاب على الحفظ والمراجعة",
    start_date: d(-30), end_date: d(-5), status: "منتهية", level_count: 2, participant_count: 0,
    created_at: now(), updated_at: now(),
  });
  await db.competitions.add({
    id: comp3Id, name: "بطولة المحافظة للتلاوة", description: "مسابقة على مستوى المحافظة في التلاوة والتجويد",
    start_date: d(60), end_date: d(90), status: "قادمة", level_count: 3, participant_count: 0,
    created_at: now(), updated_at: now(),
  });
  inserted += 3;

  // Levels
  const level1a = genId(); const level1b = genId(); const level1c = genId();
  const level2a = genId(); const level2b = genId();
  await db.competition_levels.add({ id: level1a, competition_id: comp1Id, competition_name: "مسابقة رمضان للحفظ", name: "المستوى الأول (جزء عم)", required_memorization: "جزء عم كاملاً", required_revision: "جزء تبارك", test_date: d(12), created_at: now() });
  await db.competition_levels.add({ id: level1b, competition_id: comp1Id, competition_name: "مسابقة رمضان للحفظ", name: "المستوى الثاني (خمسة أجزاء)", required_memorization: "من الجزء الأول إلى الخامس", required_revision: "جزء عم", test_date: d(18), created_at: now() });
  await db.competition_levels.add({ id: level1c, competition_id: comp1Id, competition_name: "مسابقة رمضان للحفظ", name: "المستوى الثالث (عشرة أجزاء)", required_memorization: "من الجزء الأول إلى العاشر", required_revision: "آخر خمسة أجزاء", test_date: d(25), created_at: now() });
  await db.competition_levels.add({ id: level2a, competition_id: comp2Id, competition_name: "مسابقة الفرقان الداخلية", name: "الفئة الأولى (المبتدئون)", required_memorization: "جزء عم", test_date: d(-28), created_at: now() });
  await db.competition_levels.add({ id: level2b, competition_id: comp2Id, competition_name: "مسابقة الفرقان الداخلية", name: "الفئة الثانية (المتقدمون)", required_memorization: "عشرة أجزاء على الأقل", test_date: d(-20), created_at: now() });
  inserted += 5;

  // Enrollments for comp2 (منتهية)
  const advancedStudentIdxs = [0, 1, 3, 10, 11, 13, 24]; // متقدم students
  const beginnerStudentIdxs = [5, 6, 8, 14, 15, 16, 18];
  for (const idx of advancedStudentIdxs) {
    const eid = genId();
    await db.competition_enrollments.add({
      id: eid, competition_id: comp2Id, level_id: level2b, level_name: "الفئة الثانية (المتقدمون)",
      student_id: studentIds[idx], student_name: studentNames[idx],
      enrolled_at: d(-35),
    });
    const score = Math.floor(Math.random() * 25) + 75;
    const grade = score >= 95 ? "ممتاز" : score >= 85 ? "جيد جداً" : score >= 75 ? "جيد" : "مقبول";
    await db.competition_results.add({
      id: genId(), enrollment_id: eid, competition_id: comp2Id, level_id: level2b,
      student_id: studentIds[idx], student_name: studentNames[idx],
      score, grade, degree: score,
      memorization_amount: `${Math.floor(Math.random() * 5 + 5)} آيات`,
      revision_amount: `${Math.floor(Math.random() * 3 + 2)} صفحات`,
      created_at: now(), updated_at: now(),
    });
    inserted += 2;
  }
  for (const idx of beginnerStudentIdxs) {
    const eid = genId();
    await db.competition_enrollments.add({
      id: eid, competition_id: comp2Id, level_id: level2a, level_name: "الفئة الأولى (المبتدئون)",
      student_id: studentIds[idx], student_name: studentNames[idx],
      enrolled_at: d(-35),
    });
    const score = Math.floor(Math.random() * 30) + 65;
    const grade = score >= 90 ? "ممتاز" : score >= 80 ? "جيد جداً" : score >= 70 ? "جيد" : "مقبول";
    await db.competition_results.add({
      id: genId(), enrollment_id: eid, competition_id: comp2Id, level_id: level2a,
      student_id: studentIds[idx], student_name: studentNames[idx],
      score, grade, degree: score,
      memorization_amount: `${Math.floor(Math.random() * 3 + 3)} آيات`,
      created_at: now(), updated_at: now(),
    });
    inserted += 2;
  }

  // Enrollments for comp1 (قادمة) — just enrollments, no results yet
  for (const idx of [0, 1, 3, 10, 11]) {
    await db.competition_enrollments.add({
      id: genId(), competition_id: comp1Id, level_id: level1c, level_name: "المستوى الثالث (عشرة أجزاء)",
      student_id: studentIds[idx], student_name: studentNames[idx], enrolled_at: d(-5),
    });
    inserted++;
  }
  for (const idx of [2, 4, 12, 13, 20]) {
    await db.competition_enrollments.add({
      id: genId(), competition_id: comp1Id, level_id: level1b, level_name: "المستوى الثاني (خمسة أجزاء)",
      student_id: studentIds[idx], student_name: studentNames[idx], enrolled_at: d(-5),
    });
    inserted++;
  }
  for (const idx of [5, 6, 8, 14, 15, 16]) {
    await db.competition_enrollments.add({
      id: genId(), competition_id: comp1Id, level_id: level1a, level_name: "المستوى الأول (جزء عم)",
      student_id: studentIds[idx], student_name: studentNames[idx], enrolled_at: d(-5),
    });
    inserted++;
  }

  /* ─── NOTIFICATIONS ─────────────────────────────────────────────────────── */
  const notifications = [
    { title: "غياب متكرر", message: `الطالب ${studentNames[8]} غاب 4 مرات هذا الشهر`, type: "warning", priority: "عالية", student_name: studentNames[8], student_id: studentIds[8] },
    { title: "تميز في الحفظ", message: `أتم الطالب ${studentNames[3]} حفظ الجزء الرابع بامتياز`, type: "success", priority: "عادية", student_name: studentNames[3], student_id: studentIds[3] },
    { title: "رسوم متأخرة", message: "3 طلاب لم يسددوا رسوم الشهر الماضي", type: "warning", priority: "عالية" },
    { title: "مسابقة رمضان", message: "تم فتح التسجيل في مسابقة رمضان للحفظ — انتهاء التسجيل بعد 10 أيام", type: "info", priority: "عالية" },
    { title: "جلسة جديدة", message: "تمت إضافة جلسة جديدة لحلقة النور بتاريخ اليوم", type: "info", priority: "عادية" },
    { title: "معلم متأخر", message: `المعلم ${teachers[1].full_name} تأخر في تسليم سجلات الحضور`, type: "warning", priority: "متوسطة", teacher_name: teachers[1].full_name, teacher_id: teachers[1].id },
    { title: "تقرير شهري جاهز", message: `تقارير شهر ${monthStr(-1)} جاهزة للمراجعة`, type: "info", priority: "عادية" },
    { title: "نجاح المسابقة الداخلية", message: `فاز الطالب ${studentNames[11]} بالمركز الأول في مسابقة الفرقان الداخلية`, type: "success", priority: "عالية", student_name: studentNames[11], student_id: studentIds[11] },
    { title: "تجديد إيجار المقر", message: "موعد تجديد إيجار المقر بعد 15 يوم", type: "warning", priority: "متوسطة" },
    { title: "طالب جديد", message: `تم تسجيل الطالب ${studentNames[24]} في حلقة الرحمن`, type: "success", priority: "عادية", student_name: studentNames[24], student_id: studentIds[24] },
  ];
  for (const n of notifications) {
    await db.notifications.add({
      id: genId(),
      title: n.title,
      message: n.message,
      type: n.type,
      priority: n.priority,
      is_read: Math.random() > 0.4,
      student_name: n.student_name,
      student_id: n.student_id,
      teacher_name: n.teacher_name,
      teacher_id: n.teacher_id,
      created_at: d(-Math.floor(Math.random() * 10)),
    });
    inserted++;
  }

  /* ─── COURSES ───────────────────────────────────────────────────────────── */
  const course1Id = genId();
  const course2Id = genId();
  await db.courses.add({
    id: course1Id, name: "دورة أحكام التجويد", description: "دورة شاملة في أحكام التجويد من المخارج والصفات إلى الأحكام التطبيقية",
    teacher_id: teachers[0].id, teacher_name: teachers[0].full_name,
    start_date: d(-20), end_date: d(40), seats: 20, fee: 300, status: "نشطة", student_count: 0,
    created_at: now(), updated_at: now(),
  });
  await db.courses.add({
    id: course2Id, name: "دورة القراءات العشر", description: "دورة متخصصة في القراءات العشر للحفاظ المتقدمين",
    teacher_id: teachers[2].id, teacher_name: teachers[2].full_name,
    start_date: d(30), end_date: d(120), seats: 10, fee: 500, status: "قادمة", student_count: 0,
    created_at: now(), updated_at: now(),
  });
  inserted += 2;

  // Enroll some advanced students in course1
  const courseStudents = [0, 1, 3, 10, 11, 12, 13, 24];
  for (const idx of courseStudents) {
    await db.course_students.add({
      id: genId(), course_id: course1Id,
      student_id: studentIds[idx], student_name: studentNames[idx],
      enrolled_at: d(-18),
    });
    inserted++;
  }

  // Course sessions for course1
  for (let s = 0; s < 6; s++) {
    const csId = genId();
    const presentCount = Math.floor(Math.random() * 3) + courseStudents.length - 2;
    await db.course_sessions.add({
      id: csId, course_id: course1Id, course_name: "دورة أحكام التجويد",
      title: `الدرس ${s + 1}: ${["المخارج", "الصفات", "أحكام النون الساكنة", "أحكام الميم الساكنة", "المدود", "أحكام الراء"][s]}`,
      date: d(-(s * 4 + 2)),
      what_was_taught: `شرح ${["مخارج الحروف", "صفات الحروف اللازمة", "الإظهار والإخفاء والإدغام والإقلاب", "الإدغام والإظهار الشفويين", "المد الأصلي والفرعي", "أحكام الراء تفخيماً وترقيقاً"][s]}`,
      present_count: presentCount, student_count: courseStudents.length,
      created_at: now(),
    });
    for (const idx of courseStudents) {
      const absent = Math.random() < 0.15;
      await db.course_session_records.add({
        id: genId(), course_session_id: csId,
        student_id: studentIds[idx], student_name: studentNames[idx],
        status: absent ? "غياب" : "حضور",
        created_at: now(),
      });
      inserted++;
    }
    inserted++;
  }

  return { inserted, skipped: false };
}
