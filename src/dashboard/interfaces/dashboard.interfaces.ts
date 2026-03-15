import { DashboardPilotageDto } from '../dtos/dashboard-pilotage.dto';

export interface IDashboardController {
  getPilotage(): Promise<DashboardPilotageDto>;
}

export interface IDashboardService {
  getPilotage();
}
