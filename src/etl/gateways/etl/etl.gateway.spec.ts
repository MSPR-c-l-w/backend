/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Subject } from 'rxjs';
import { EtlGateway } from './etl.gateway';
import { EtlService } from 'src/etl/services/etl/etl.service';

describe('EtlGateway', () => {
  let gateway: EtlGateway;
  let stream$: Subject<any>;
  let etlService: { getStream: jest.Mock };
  let serverToEmit: jest.Mock;

  beforeEach(() => {
    stream$ = new Subject();
    serverToEmit = jest.fn();
    etlService = {
      getStream: jest.fn(() => stream$),
    };
    gateway = new EtlGateway(etlService as unknown as EtlService);
    const toMock = jest.fn(() => ({ emit: serverToEmit }));
    gateway.server = { to: toMock } as any;
  });

  it('should forward ETL logs to pipeline room on init', () => {
    gateway.afterInit();
    stream$.next({
      pipelineId: 'exercise',
      timestamp: '2026-01-01T00:00:00.000Z',
      level: 'INFO',
      message: 'hello',
    });

    expect((gateway.server as any).to).toHaveBeenCalledWith('etl:exercise');
    expect(serverToEmit).toHaveBeenCalledWith('etl:log', {
      pipelineId: 'exercise',
      timestamp: '2026-01-01T00:00:00.000Z',
      level: 'INFO',
      message: 'hello',
    });
  });

  it('should ignore invalid subscribe pipeline', async () => {
    const warnSpy = jest
      .spyOn((gateway as any).logger, 'warn')
      .mockImplementation(() => undefined);
    const client = {
      id: 'client-1',
      join: jest.fn(),
      leave: jest.fn(),
    };

    await gateway.handleSubscribe({ pipeline: 'invalid' }, client as any);

    expect(client.join).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('should leave all rooms then join selected pipeline room', async () => {
    const logSpy = jest
      .spyOn((gateway as any).logger, 'log')
      .mockImplementation(() => undefined);
    const client = {
      id: 'client-2',
      join: jest.fn(),
      leave: jest.fn(),
    };

    await gateway.handleSubscribe({ pipeline: 'nutrition' }, client as any);

    expect(client.leave).toHaveBeenCalledTimes(3);
    expect(client.leave).toHaveBeenCalledWith('etl:nutrition');
    expect(client.leave).toHaveBeenCalledWith('etl:exercise');
    expect(client.leave).toHaveBeenCalledWith('etl:health-profile');
    expect(client.join).toHaveBeenCalledWith('etl:nutrition');
    expect(logSpy).toHaveBeenCalled();
  });

  it('should unsubscribe from valid pipeline room', async () => {
    const logSpy = jest
      .spyOn((gateway as any).logger, 'log')
      .mockImplementation(() => undefined);
    const client = {
      id: 'client-3',
      leave: jest.fn(),
    };

    await gateway.handleUnsubscribe(
      { pipeline: 'health-profile' },
      client as any,
    );

    expect(client.leave).toHaveBeenCalledWith('etl:health-profile');
    expect(logSpy).toHaveBeenCalled();
  });

  it('should ignore invalid unsubscribe pipeline', async () => {
    const client = {
      id: 'client-4',
      leave: jest.fn(),
    };

    await gateway.handleUnsubscribe({ pipeline: 'bad' }, client as any);

    expect(client.leave).not.toHaveBeenCalled();
  });
});
