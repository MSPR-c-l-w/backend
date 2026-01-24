import { Subscription } from "@prisma/client";

export interface ISubscriptionController {
    getSubscriptions():Promise<Subscription[]>;
    getSubscriptionById(id: string):Promise<Subscription>;
}

export interface ISubscriptionService {
    getSubscriptions():Promise<Subscription[]>;
    getSubscriptionById(id: string):Promise<Subscription>;
}