import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import type { Socket } from 'socket.io';
import { EtlService, type PipelineId } from '../../services/etl/etl.service';

const VALID_PIPELINES: PipelineId[] = [
  'nutrition',
  'exercise',
  'health-profile',
];

@WebSocketGateway({
  cors: { origin: true },
})
export class EtlGateway implements OnGatewayInit {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EtlGateway.name);

  constructor(private readonly etlService: EtlService) {}

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

  @SubscribeMessage('subscribe')
  async handleSubscribe(
    @MessageBody() data: { pipeline?: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
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
    const pipeline = data?.pipeline;
    if (!pipeline || !VALID_PIPELINES.includes(pipeline as PipelineId)) {
      return;
    }
    await client.leave(`etl:${pipeline}`);
    this.logger.log(`Client ${client.id} unsubscribed from etl:${pipeline}`);
  }
}
