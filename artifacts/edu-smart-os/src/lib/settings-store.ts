/**
 * Settings Store — All system settings persisted in localStorage.
 * Works 100% offline. No server required.
 */

const SETTINGS_KEY = "furqan_system_settings_v1";

export interface SystemSettings {
  /* General */
  office_name: string;
  office_subtitle: string;
  office_address: string;
  office_phone: string;
  office_email: string;
  office_whatsapp: string;

  /* Students */
  student_grades: string[];
  student_statuses: string[];
  student_levels: string[];
  student_payment_statuses: string[];

  /* Teachers */
  teacher_types: string[];
  teacher_statuses: string[];

  /* Circles */
  circle_types: string[];
  circle_days: string[];
  circle_statuses: string[];

  /* Courses */
  course_types: string[];
  course_statuses: string[];

  /* Competitions */
  competition_types: string[];
  competition_statuses: string[];
  competition_pass_score: number;

  /* Finance */
  expense_categories: string[];
  payment_methods: string[];
  invoice_statuses: string[];
  currency: string;

  /* Reports */
  report_header: string;
  report_footer: string;
  report_logo_text: string;

  /* Backup */
  auto_backup_enabled: boolean;
  auto_backup_interval_hours: number;
  max_backups: number;
}

const DEFAULTS: SystemSettings = {
  /* General */
  office_name: "مكتب الفرقان",
  office_subtitle: "لتحفيظ القرآن الكريم",
  office_address: "",
  office_phone: "",
  office_email: "",
  office_whatsapp: "201127416995",

  /* Students */
  student_grades: [
    "الصف الأول", "الصف الثاني", "الصف الثالث", "الصف الرابع",
    "الصف الخامس", "الصف السادس", "الصف السابع", "الصف الثامن",
    "الصف التاسع", "الصف العاشر", "الصف الحادي عشر", "الصف الثاني عشر",
    "خريج", "بالغ",
  ],
  student_statuses: ["نشط", "موقف", "متخرج", "منسحب"],
  student_levels: ["ممتاز", "جيد جداً", "جيد", "مقبول", "ضعيف", "مبتدئ", "متوسط", "متقدم"],
  student_payment_statuses: ["مدفوع", "غير مدفوع", "متأخر", "معفي", "مدفوع جزئياً"],

  /* Teachers */
  teacher_types: ["معلم حفظ", "معلم تجويد", "معلم تلاوة", "مشرف"],
  teacher_statuses: ["نشط", "إجازة", "موقف"],

  /* Circles */
  circle_types: ["حلقة حفظ", "حلقة مراجعة", "حلقة مكثفة", "حلقة أطفال", "حلقة كبار"],
  circle_days: ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"],
  circle_statuses: ["نشطة", "متوقفة مؤقتاً", "منتهية"],

  /* Courses */
  course_types: ["دورة حفظ مكثفة", "دورة تجويد", "دورة تلاوة", "دورة إدارية"],
  course_statuses: ["قادمة", "جارية", "منتهية", "ملغاة"],

  /* Competitions */
  competition_types: ["مسابقة حفظ", "مسابقة تلاوة", "مسابقة تجويد", "مسابقة داخلية", "مسابقة خارجية"],
  competition_statuses: ["قادمة", "جارية", "منتهية", "ملغاة"],
  competition_pass_score: 60,

  /* Finance */
  expense_categories: [
    "إيجار", "كهرباء", "مياه", "صيانة", "قرطاسية",
    "تسويق", "رواتب", "مكافآت", "متفرقات",
  ],
  payment_methods: ["نقدي", "تحويل بنكي", "محفظة إلكترونية", "شيك"],
  invoice_statuses: ["مدفوع", "غير مدفوع", "متأخر", "معفي", "مدفوع جزئياً"],
  currency: "ج.م",

  /* Reports */
  report_header: "مكتب الفرقان لتحفيظ القرآن الكريم",
  report_footer: "بإذن الله تعالى — التقارير السرية خاصة بالإدارة",
  report_logo_text: "الفرقان",

  /* Backup */
  auto_backup_enabled: true,
  auto_backup_interval_hours: 6,
  max_backups: 10,
};

export function loadSettings(): SystemSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<SystemSettings>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings: SystemSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch { /* ignore */ }
}

export function resetSettings(): void {
  try {
    localStorage.removeItem(SETTINGS_KEY);
  } catch { /* ignore */ }
}

export function getOfficeName(): string {
  return loadSettings().office_name || "مكتب الفرقان";
}
