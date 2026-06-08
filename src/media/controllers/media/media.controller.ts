import {
  BadRequestException,
  Controller,
  Inject,
  Post,
  PayloadTooLargeException,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {
  MediaKind,
  StorageService,
  UploadedMedia,
} from 'src/media/services/storage/storage.service';
import { ROUTES, SERVICES } from 'src/utils/constants';

const MAX_FILES = 10;
const ONE_MB = 1024 * 1024;

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]);

const VIDEO_MIME_TYPES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-matroska',
  'video/3gpp',
]);

function imageLimitBytes(): number {
  return parseInt(process.env.MAX_IMAGE_UPLOAD_MB ?? '10', 10) * ONE_MB;
}

function videoLimitBytes(): number {
  return parseInt(process.env.MAX_VIDEO_UPLOAD_MB ?? '100', 10) * ONE_MB;
}

function kindOf(mimetype: string): MediaKind | null {
  if (IMAGE_MIME_TYPES.has(mimetype)) return 'image';
  if (VIDEO_MIME_TYPES.has(mimetype)) return 'video';
  return null;
}

@Controller(ROUTES.MEDIA)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiTags(ROUTES.MEDIA)
export class MediaController {
  constructor(
    @Inject(SERVICES.STORAGE) private readonly storage: StorageService,
  ) {}

  @Post('upload')
  @ApiOperation({
    summary: 'Uploader des médias (photos et/ou vidéos)',
    description:
      'Multipart `files[]` (max 10). Limites : ' +
      `${process.env.MAX_IMAGE_UPLOAD_MB ?? '10'} Mo / image, ` +
      `${process.env.MAX_VIDEO_UPLOAD_MB ?? '100'} Mo / vidéo. ` +
      'Retourne la liste des médias stockés avec leur URL publique et leur type.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Médias uploadés : { files: [{ url, type }] }',
  })
  @UseInterceptors(
    FilesInterceptor('files', MAX_FILES, {
      limits: {
        fileSize:
          parseInt(process.env.MAX_VIDEO_UPLOAD_MB ?? '100', 10) * ONE_MB,
      },
    }),
  )
  async upload(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ files: UploadedMedia[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('NO_FILES_PROVIDED');
    }

    const imageLimit = imageLimitBytes();
    const videoLimit = videoLimitBytes();

    // Validation préalable de tous les fichiers avant d'en uploader un seul.
    const prepared = files.map((file) => {
      const kind = kindOf(file.mimetype);
      if (!kind) {
        throw new BadRequestException(
          `UNSUPPORTED_MEDIA_TYPE:${file.mimetype}`,
        );
      }
      const limit = kind === 'image' ? imageLimit : videoLimit;
      if (file.size > limit) {
        throw new PayloadTooLargeException(
          kind === 'image'
            ? `IMAGE_TOO_LARGE_MAX_${process.env.MAX_IMAGE_UPLOAD_MB ?? '10'}MB`
            : `VIDEO_TOO_LARGE_MAX_${process.env.MAX_VIDEO_UPLOAD_MB ?? '100'}MB`,
        );
      }
      return { file, kind };
    });

    const uploaded = await Promise.all(
      prepared.map(({ file, kind }) =>
        this.storage.upload(
          file.buffer,
          file.mimetype,
          file.originalname,
          kind,
        ),
      ),
    );

    return { files: uploaded };
  }
}
