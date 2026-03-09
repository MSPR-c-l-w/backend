import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Plan, Prisma } from '@prisma/client';
import { IPlanService } from 'src/plan/interfaces/plan.interface';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { CreatePlanDto, UpdatePlanDto } from 'src/plan/dtos/plan.dto';

@Injectable()
export class PlanService implements IPlanService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlans(): Promise<Plan[]> {
    const plans = await this.prisma.plan.findMany();
    if (plans.length === 0) {
      throw new NotFoundException('NO_PLANS_FOUND');
    }
    return plans;
  }

  async getPlanById(id: string): Promise<Plan> {
    const planId = parseInt(id);
    if (!Number.isInteger(planId)) {
      throw new BadRequestException('PLAN_ID_MUST_BE_A_NUMBER');
    }
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
    });
    if (!plan) {
      throw new NotFoundException(`Plan with id ${id} not found`);
    }
    return plan;
  }

  async createPlan(plan: CreatePlanDto): Promise<Plan> {
    return await this.prisma.plan.create({
      data: {
        name: plan.name,
        price: plan.price,
        features: plan.features,
      },
    });
  }

  async updatePlan(id: string, plan: UpdatePlanDto): Promise<Plan> {
    const planId = parseInt(id);
    if (!Number.isInteger(planId)) {
      throw new BadRequestException('PLAN_ID_MUST_BE_A_NUMBER');
    }
    await this.getPlanById(id);

    const data: Prisma.PlanUpdateInput = {};

    if (plan.name !== undefined) data.name = plan.name;
    if (plan.price !== undefined) data.price = plan.price;
    if (plan.features !== undefined) data.features = plan.features;

    return await this.prisma.plan.update({
      where: { id: planId },
      data,
    });
  }

  async deletePlan(id: string): Promise<Plan> {
    const planId = parseInt(id);
    if (!Number.isInteger(planId)) {
      throw new BadRequestException('PLAN_ID_MUST_BE_A_NUMBER');
    }
    await this.getPlanById(id);

    return await this.prisma.plan.delete({
      where: { id: planId },
    });
  }
}
