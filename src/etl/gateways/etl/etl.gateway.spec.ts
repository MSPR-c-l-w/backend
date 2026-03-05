/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Subject } from 'rxjs';
import { sign } from 'jsonwebtoken';
import { WsException } from '@nestjs/websockets';
import { EtlGateway } from './etl.gateway';
import { EtlService } from 'src/etl/services/etl/etl.service';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';

describe('EtlGateway', () => {
  let gateway: EtlGateway;
  let stream$: Subject<any>;
  let etlService: { getStream: jest.Mock };
  let prisma: { user: { findUnique: jest.Mock } };
  let serverToEmit: jest.Mock;

  beforeEach(() => {
    stream$ = new Subject();
    serverToEmit = jest.fn();
    etlService = {
      getStream: jest.fn(() => stream$),
    };
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
    };
    gateway = new EtlGateway(
      etlService as unknown as EtlService,
      prisma as unknown as PrismaService,
    );
    const toMock = jest.fn(() => ({ emit: serverToEmit }));
    gateway.server = { to: toMock } as any;
  });

  function adminToken(): string {
    return sign({ sub: 1, email: 'admin@example.com' }, 'dev-secret');
  }

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
      data: { etlAuthorized: true },
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
      data: { etlAuthorized: true },
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
      data: { etlAuthorized: true },
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
      data: { etlAuthorized: true },
    };

    await gateway.handleUnsubscribe({ pipeline: 'bad' }, client as any);

    expect(client.leave).not.toHaveBeenCalled();
  });

  it('should reject subscribe when socket is not authorized', async () => {
    const client = {
      id: 'client-unauth',
      join: jest.fn(),
      leave: jest.fn(),
      data: {},
    };

    await expect(
      gateway.handleSubscribe({ pipeline: 'nutrition' }, client as any),
    ).rejects.toBeInstanceOf(WsException);
  });

  it('should mark client authorized on valid handshake with ADMIN role', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: { name: 'ADMIN' } });
    const data: { etlAuthorized?: boolean } = {};
    const client = {
      id: 'client-auth',
      handshake: {
        headers: { origin: 'http://localhost:3000' },
        auth: { token: `Bearer ${adminToken()}` },
        query: {},
      },
      data,
      disconnect: jest.fn(),
    };

    await gateway.handleConnection(client as any);

    expect(client.disconnect).not.toHaveBeenCalled();
    expect(data.etlAuthorized).toBe(true);
  });

  it('should disconnect client when origin is not allowed', async () => {
    const warnSpy = jest
      .spyOn((gateway as any).logger, 'warn')
      .mockImplementation(() => undefined);
    const client = {
      id: 'client-origin',
      handshake: {
        headers: { origin: 'http://malicious.local' },
        auth: { token: `Bearer ${adminToken()}` },
        query: {},
      },
      data: {},
      disconnect: jest.fn(),
    };

    await gateway.handleConnection(client as any);

    expect(client.disconnect).toHaveBeenCalledWith(true);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('should disconnect client when role is not ADMIN', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: { name: 'COACH' } });
    const client = {
      id: 'client-role',
      handshake: {
        headers: { origin: 'http://localhost:3000' },
        auth: { token: adminToken() },
        query: {},
      },
      data: {},
      disconnect: jest.fn(),
    };

    await gateway.handleConnection(client as any);

    expect(client.disconnect).toHaveBeenCalledWith(true);
  });
});
