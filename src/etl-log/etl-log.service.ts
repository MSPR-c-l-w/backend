import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export type PipelineId = 'nutrition' | 'exercise' | 'health-profile';

export interface EtlLogEntry {
  pipelineId: PipelineId;
  level: string;
  message: string;
  timestamp: string;
}

@Injectable()
export class EtlLogService {
  private readonly logSubject = new Subject<EtlLogEntry>();

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
}
