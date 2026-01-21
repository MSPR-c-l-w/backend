import { Plan } from '@prisma/client';

export interface IPlanController {
  getPlans(): Promise<Plan[]>;
  getPlanById(id: string): Promise<Plan>;
}

export interface IPlanService {
  getPlans(): Promise<Plan[]>;
  getPlanById(id: string): Promise<Plan>;
}
