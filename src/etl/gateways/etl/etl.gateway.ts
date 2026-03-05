import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  WsException,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import type { Socket } from 'socket.io';
import { verify } from 'jsonwebtoken';
import { EtlService, type PipelineId } from '../../services/etl/etl.service';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import type { JwtPayload } from 'src/auth/strategies/jwt.strategy';

const VALID_PIPELINES: PipelineId[] = [
  'nutrition',
  'exercise',
  'health-profile',
];

const JWT_SECRET_RAW =
  process.env.JWT_SECRET ??
  (process.env.NODE_ENV === 'production' ? undefined : 'dev-secret');

if (!JWT_SECRET_RAW) {
  throw new Error('JWT_SECRET is required');
}
const JWT_SECRET: string = JWT_SECRET_RAW;

const ALLOWED_WS_ORIGINS = (
  process.env.ETL_WS_ALLOWED_ORIGINS ??
  process.env.FRONTEND_URL ??
  (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000')
)
  .split(',')
  .map((value) => value.trim())
  .filter((value) => value.length > 0);

@WebSocketGateway({
  cors: {
    origin: ALLOWED_WS_ORIGINS.length > 0 ? ALLOWED_WS_ORIGINS : false,
  },
})
export class EtlGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EtlGateway.name);

  constructor(
    private readonly etlService: EtlService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit(): void {
    this.etlService.getStream().subscribe((entry) => {
      const room = `etl:${entry.pipelineId}`;
      this.server.to(room).emit('etl:log', {
        pipelineId: entry.pipelineId,
        timestamp: entry.timestamp,
        level: entry.level,
        message: entry.message,
      });
    });
  }

  async handleConnection(client: Socket): Promise<void> {
    const origin = client.handshake.headers.origin;
    if (!this.isOriginAllowed(origin)) {
      this.logger.warn(
        `Connexion WS refusée (origin non autorisée): ${origin ?? 'unknown'}`,
      );
      client.disconnect(true);
      return;
    }

    const authorized = await this.isHandshakeAuthorized(client);
    if (!authorized) {
      this.logger.warn(
        `Connexion WS refusée (JWT/role invalide): ${client.id}`,
      );
      client.disconnect(true);
      return;
    }

    this.markClientAuthorized(client, true);
  }

  @SubscribeMessage('subscribe')
  async handleSubscribe(
    @MessageBody() data: { pipeline?: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    if (!this.isClientAuthorized(client)) {
      throw new WsException('UNAUTHORIZED');
    }
    const pipeline = data?.pipeline;
    if (!pipeline || !VALID_PIPELINES.includes(pipeline as PipelineId)) {
      this.logger.warn(
        `Client ${client.id} subscribe with invalid pipeline: ${pipeline}`,
      );
      return;
    }
    const room = `etl:${pipeline}`;
    for (const p of VALID_PIPELINES) {
      await client.leave(`etl:${p}`);
    }
    await client.join(room);
    this.logger.log(`Client ${client.id} subscribed to ${room}`);
  }

  @SubscribeMessage('unsubscribe')
  async handleUnsubscribe(
    @MessageBody() data: { pipeline?: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    if (!this.isClientAuthorized(client)) {
      throw new WsException('UNAUTHORIZED');
    }
    const pipeline = data?.pipeline;
    if (!pipeline || !VALID_PIPELINES.includes(pipeline as PipelineId)) {
      return;
    }
    await client.leave(`etl:${pipeline}`);
    this.logger.log(`Client ${client.id} unsubscribed from etl:${pipeline}`);
  }

  private isOriginAllowed(origin: string | undefined): boolean {
    if (ALLOWED_WS_ORIGINS.length === 0) {
      return process.env.NODE_ENV !== 'production';
    }
    return !!origin && ALLOWED_WS_ORIGINS.includes(origin);
  }

  private getTokenFromHandshake(client: Socket): string | null {
    const auth = client.handshake.auth as Record<string, unknown> | undefined;
    const authToken = auth?.token;
    const query = client.handshake.query as Record<string, unknown> | undefined;
    const queryToken = query?.token;
    const authorization = client.handshake.headers.authorization;

    const raw =
      (typeof authToken === 'string' && authToken) ||
      (typeof queryToken === 'string' && queryToken) ||
      (typeof authorization === 'string' && authorization) ||
      null;

    if (!raw) return null;
    if (raw.startsWith('Bearer ')) {
      return raw.slice('Bearer '.length).trim();
    }
    return raw.trim();
  }

  private async isHandshakeAuthorized(client: Socket): Promise<boolean> {
    const token = this.getTokenFromHandshake(client);
    if (!token) return false;

    let payload: JwtPayload | null = null;
    try {
      const decoded = verify(token, JWT_SECRET) as unknown;
      if (!decoded || typeof decoded !== 'object') {
        return false;
      }
      const maybePayload = decoded as Partial<JwtPayload>;
      if (typeof maybePayload.sub !== 'number') {
        return false;
      }
      payload = {
        sub: maybePayload.sub,
        email: String(maybePayload.email ?? ''),
      };
    } catch {
      return false;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    return user?.role?.name === 'ADMIN';
  }

  private isClientAuthorized(client: Socket): boolean {
    const data = client.data as unknown;
    if (!data || typeof data !== 'object') {
      return false;
    }
    return (data as { etlAuthorized?: boolean }).etlAuthorized === true;
  }

  private markClientAuthorized(client: Socket, value: boolean): void {
    const currentData = client.data as unknown;
    if (currentData && typeof currentData === 'object') {
      (currentData as { etlAuthorized?: boolean }).etlAuthorized = value;
      return;
    }
    (client as unknown as { data: { etlAuthorized: boolean } }).data = {
      etlAuthorized: value,
    };
  }
}
