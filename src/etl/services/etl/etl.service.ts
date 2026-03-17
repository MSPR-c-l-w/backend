import { ConflictException, Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export type PipelineId = 'nutrition' | 'exercise' | 'health-profile';

export interface EtlLogEntry {
  pipelineId: PipelineId;
  level: string;
  message: string;
  timestamp: string;
}

@Injectable()
export class EtlService {
  private readonly logSubject = new Subject<EtlLogEntry>();
  private readonly recentLogs: EtlLogEntry[] = [];
  private readonly RECENT_LOGS_LIMIT = 200;
  private readonly runningPipelines: Record<PipelineId, boolean> = {
    nutrition: false,
    exercise: false,
    'health-profile': false,
  };

  emit(pipelineId: PipelineId, level: string, message: string): void {
    const entry: EtlLogEntry = {
      pipelineId,
      level,
      message,
      timestamp: new Date().toISOString(),
    };
    this.recentLogs.push(entry);
    if (this.recentLogs.length > this.RECENT_LOGS_LIMIT) {
      this.recentLogs.splice(
        0,
        this.recentLogs.length - this.RECENT_LOGS_LIMIT,
      );
    }
    this.logSubject.next(entry);
  }

  getStream(): Subject<EtlLogEntry> {
    return this.logSubject;
  }

  getRecentLogs(options?: {
    pipelineId?: PipelineId;
    level?: string;
    limit?: number;
  }): EtlLogEntry[] {
    const limit = Math.min(200, Math.max(1, options?.limit ?? 50));
    const level = options?.level?.toLowerCase();
    const pipelineId = options?.pipelineId;

    const filtered = this.recentLogs.filter((l) => {
      if (pipelineId && l.pipelineId !== pipelineId) return false;
      if (level && l.level.toLowerCase() !== level) return false;
      return true;
    });

    return filtered.slice(-limit).reverse();
  }

  isPipelineRunning(pipelineId: PipelineId): boolean {
    return this.runningPipelines[pipelineId];
  }

  getAllPipelineStatuses(): Record<PipelineId, boolean> {
    return {
      nutrition: this.runningPipelines.nutrition,
      exercise: this.runningPipelines.exercise,
      'health-profile': this.runningPipelines['health-profile'],
    };
  }

  async runWithPipelineLock<T>(
    pipelineId: PipelineId,
    task: () => Promise<T>,
  ): Promise<T> {
    if (this.isPipelineRunning(pipelineId)) {
      throw new ConflictException(
        `Le pipeline ${pipelineId} est déjà en cours d'exécution.`,
      );
    }

    this.runningPipelines[pipelineId] = true;
    try {
      return await task();
    } finally {
      this.runningPipelines[pipelineId] = false;
    }
  }
}
