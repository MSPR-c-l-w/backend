import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { Client as MinioClient } from 'minio';

export type MediaKind = 'image' | 'video';

export interface UploadedMedia {
  url: string;
  type: MediaKind;
}

/**
 * Service de stockage objet (MinIO / S3).
 *
 * Gère la connexion au bucket des médias des publications, l'upload des
 * fichiers (photos & vidéos) et la construction des URLs publiques.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: MinioClient;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET ?? 'posts-media';
    this.publicBaseUrl = (
      process.env.S3_PUBLIC_URL ?? 'http://localhost:9000'
    ).replace(/\/+$/, '');

    this.client = new MinioClient({
      endPoint: process.env.S3_ENDPOINT ?? 'localhost',
      port: parseInt(process.env.S3_PORT ?? '9000', 10),
      useSSL: process.env.S3_USE_SSL === 'true',
      accessKey: process.env.S3_ACCESS_KEY ?? 'minioadmin',
      secretKey: process.env.S3_SECRET_KEY ?? 'minioadmin',
      region: process.env.S3_REGION ?? 'us-east-1',
    });
  }

  /**
   * Au démarrage : crée le bucket s'il n'existe pas et le rend lisible
   * publiquement (lecture anonyme des médias). Idempotent et non bloquant :
   * en cas d'échec (MinIO non démarré), l'application continue de tourner.
   */
  async onModuleInit(): Promise<void> {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(
          this.bucket,
          process.env.S3_REGION ?? 'us-east-1',
        );
        this.logger.log(`Bucket "${this.bucket}" créé.`);
      }
      await this.client.setBucketPolicy(
        this.bucket,
        JSON.stringify(this.publicReadPolicy()),
      );
      this.logger.log(`Stockage objet prêt (bucket "${this.bucket}").`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      this.logger.warn(
        `Stockage objet indisponible au démarrage (${message}). ` +
          'Vérifiez que MinIO est lancé (docker compose -f compose.dev.yaml up -d minio).',
      );
    }
  }

  /**
   * Envoie un fichier dans le bucket et retourne son URL publique + son type.
   */
  async upload(
    buffer: Buffer,
    mimetype: string,
    originalName: string,
    kind: MediaKind,
  ): Promise<UploadedMedia> {
    const safeExt = extname(originalName).toLowerCase().slice(0, 10);
    const objectName = `${kind}s/${randomUUID()}${safeExt}`;

    try {
      await this.client.putObject(
        this.bucket,
        objectName,
        buffer,
        buffer.length,
        { 'Content-Type': mimetype },
      );
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      this.logger.error(`Échec de l'upload vers le stockage objet: ${message}`);
      throw new InternalServerErrorException('MEDIA_UPLOAD_FAILED');
    }

    return {
      url: `${this.publicBaseUrl}/${this.bucket}/${objectName}`,
      type: kind,
    };
  }

  private publicReadPolicy() {
    return {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${this.bucket}/*`],
        },
      ],
    };
  }
}
