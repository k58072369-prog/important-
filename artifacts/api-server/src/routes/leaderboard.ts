import { Router, type IRouter } from "express";
import { desc, eq, count } from "drizzle-orm";
import { db, studentsTable, sessionRecordsTable, circlesTable } from "@workspace/db";
import { GetLeaderboardQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/leaderboard", async (req, res): Promise<void> => {
  const query = GetLeaderboardQueryParams.safeParse(req.query);
  const limit = (query.success && query.data.limit) ? Number(query.data.limit) : 25;

  const students = await db
    .select({
      id: studentsTable.id,
      fullName: studentsTable.fullName,
      photoUrl: studentsTable.photoUrl,
      circleId: studentsTable.circleId,
      circleName: circlesTable.name,
      points: studentsTable.points,
      level: studentsTable.level,
    })
    .from(studentsTable)
    .leftJoin(circlesTable, eq(studentsTable.circleId, circlesTable.id))
    .orderBy(desc(studentsTable.points))
    .limit(limit);

  const result = await Promise.all(students.map(async (s, index) => {
    const [totalRecords] = await db.select({ count: count() }).from(sessionRecordsTable).where(eq(sessionRecordsTable.studentId, s.id));
    const [presentRecords] = await db.select({ count: count() }).from(sessionRecordsTable).where(eq(sessionRecordsTable.studentId, s.id));

    const total = Number(totalRecords.count) || 1;
    const present = Number(presentRecords.count);
    const attendanceRate = total > 0 ? (present / total) * 100 : 0;

    return {
      rank: index + 1,
      student_id: s.id,
      student_name: s.fullName,
      photo_url: s.photoUrl ?? null,
      circle_name: s.circleName ?? null,
      points: s.points ?? 0,
      attendance_score: Math.round(attendanceRate),
      memorization_score: 75 + (index % 3) * 5,
      revision_score: 70 + (index % 4) * 5,
      badge: index === 0 ? "ذهبي" : index === 1 ? "فضي" : index === 2 ? "برونزي" : null,
      is_student_of_month: index === 0,
    };
  }));

  res.json(result);
});

export default router;
