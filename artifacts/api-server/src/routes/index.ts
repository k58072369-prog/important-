import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import studentsRouter from "./students";
import teachersRouter from "./teachers";
import circlesRouter from "./circles";
import sessionsRouter from "./sessions";
import financeRouter from "./finance";
import notificationsRouter from "./notifications";
import leaderboardRouter from "./leaderboard";
import reportsRouter from "./reports";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(studentsRouter);
router.use(teachersRouter);
router.use(circlesRouter);
router.use(sessionsRouter);
router.use(financeRouter);
router.use(notificationsRouter);
router.use(leaderboardRouter);
router.use(reportsRouter);
router.use(storageRouter);

export default router;
