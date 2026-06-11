import { Router, type IRouter } from "express";
import healthRouter from "./health";
import transactionsRouter from "./transactions";
import budgetsRouter from "./budgets";
import summaryRouter from "./summary";

const router: IRouter = Router();

router.use(healthRouter);
router.use(transactionsRouter);
router.use(budgetsRouter);
router.use(summaryRouter);

export default router;
