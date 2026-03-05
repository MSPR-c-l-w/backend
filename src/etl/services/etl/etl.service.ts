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
  private readonly runningPipelines: Record<PipelineId, boolean> = {
    nutrition: false,
    exercise: false,
    'health-profile': false,
  };

  emit(pipelineId: PipelineId, level: string, message: string): void {
    this.logSubject.next({
      pipelineId,
      level,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  getStream(): Subject<EtlLogEntry> {
    return this.logSubject;
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
