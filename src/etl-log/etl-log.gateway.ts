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
import { EtlLogService, type PipelineId } from './etl-log.service';

const VALID_PIPELINES: PipelineId[] = [
  'nutrition',
  'exercise',
  'health-profile',
];

@WebSocketGateway({
  cors: { origin: true },
})
export class EtlLogGateway implements OnGatewayInit {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EtlLogGateway.name);

  constructor(private readonly etlLogService: EtlLogService) {}

  afterInit(): void {
    this.etlLogService.getStream().subscribe((entry) => {
      const room = `etl:${entry.pipelineId}`;
      this.server.to(room).emit('etl:log', {
        timestamp: entry.timestamp,
        level: entry.level,
        message: entry.message,
      });
    });
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() data: { pipeline?: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const pipeline = data?.pipeline;
    if (!pipeline || !VALID_PIPELINES.includes(pipeline as PipelineId)) {
      this.logger.warn(
        `Client ${client.id} subscribe with invalid pipeline: ${pipeline}`,
      );
      return;
    }
    const room = `etl:${pipeline}`;
    client.join(room);
    this.logger.log(`Client ${client.id} subscribed to ${room}`);
  }
}
