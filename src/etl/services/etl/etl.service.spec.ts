import { ConflictException } from '@nestjs/common';
import { EtlService } from './etl.service';

describe('EtlService', () => {
  let service: EtlService;

  beforeEach(() => {
    service = new EtlService();
  });

  it('should emit logs in stream', () => {
    const nextSpy = jest.fn();
    service.getStream().subscribe(nextSpy);

    service.emit('nutrition', 'INFO', 'hello');

    expect(nextSpy).toHaveBeenCalledTimes(1);
    expect(nextSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        pipelineId: 'nutrition',
        level: 'INFO',
        message: 'hello',
      }),
    );
  });

  it('should lock and unlock a pipeline around task', async () => {
    expect(service.isPipelineRunning('exercise')).toBe(false);

    const result = await service.runWithPipelineLock('exercise', () => {
      expect(service.isPipelineRunning('exercise')).toBe(true);
      return Promise.resolve(42);
    });

    expect(result).toBe(42);
    expect(service.isPipelineRunning('exercise')).toBe(false);
  });

  it('should unlock pipeline when task throws', async () => {
    await expect(
      service.runWithPipelineLock('health-profile', () =>
        Promise.reject(new Error('boom')),
      ),
    ).rejects.toThrow('boom');

    expect(service.isPipelineRunning('health-profile')).toBe(false);
  });

  it('should refuse concurrent launch on same pipeline', async () => {
    let release: (() => void) | null = null;
    const blocker = new Promise<void>((resolve) => {
      release = resolve;
    });

    const running = service.runWithPipelineLock('nutrition', async () => {
      await blocker;
      return 'done';
    });

    await expect(
      service.runWithPipelineLock('nutrition', () => Promise.resolve('other')),
    ).rejects.toBeInstanceOf(ConflictException);

    release?.();
    await expect(running).resolves.toBe('done');
  });

  it('should return all pipeline statuses', async () => {
    expect(service.getAllPipelineStatuses()).toEqual({
      nutrition: false,
      exercise: false,
      'health-profile': false,
    });

    const promise = service.runWithPipelineLock('exercise', () => {
      expect(service.getAllPipelineStatuses()).toEqual({
        nutrition: false,
        exercise: true,
        'health-profile': false,
      });
      return Promise.resolve(true);
    });

    await promise;
  });

  it('should keep and return recent logs (most recent first) with filters', () => {
    service.emit('nutrition', 'ERROR', 'e1');
    service.emit('exercise', 'INFO', 'i1');
    service.emit('nutrition', 'error', 'e2');

    const all = service.getRecentLogs({ limit: 10 });
    expect(all[0]).toEqual(
      expect.objectContaining({ pipelineId: 'nutrition', message: 'e2' }),
    );
    expect(all).toHaveLength(3);

    const onlyNutrition = service.getRecentLogs({ pipelineId: 'nutrition' });
    expect(onlyNutrition).toHaveLength(2);

    const onlyError = service.getRecentLogs({ level: 'ERROR' });
    expect(onlyError).toHaveLength(2);

    const limited = service.getRecentLogs({ limit: 1 });
    expect(limited).toHaveLength(1);
    expect(limited[0]).toEqual(
      expect.objectContaining({ pipelineId: 'nutrition', message: 'e2' }),
    );
  });
});
