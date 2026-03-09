import { Plan } from '@prisma/client';
import type { CreatePlanDto, UpdatePlanDto } from 'src/plan/dtos/plan.dto';

export interface IPlanController {
  getPlans(): Promise<Plan[]>;
  getPlanById(id: string): Promise<Plan>;
  createPlan(plan: CreatePlanDto): Promise<Plan>;
  updatePlan(id: string, plan: UpdatePlanDto): Promise<Plan>;
  deletePlan(id: string): Promise<Plan>;
}

export interface IPlanService {
  getPlans(): Promise<Plan[]>;
  getPlanById(id: string): Promise<Plan>;
  createPlan(plan: CreatePlanDto): Promise<Plan>;
  updatePlan(id: string, plan: UpdatePlanDto): Promise<Plan>;
  deletePlan(id: string): Promise<Plan>;
}
