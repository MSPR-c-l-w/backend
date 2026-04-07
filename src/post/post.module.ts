import { Module } from '@nestjs/common';
import { PostController } from './controllers/post/post.controller';
import { PostService } from './services/post/post.service';
import { SERVICES } from 'src/utils/constants';

@Module({
  providers: [
    PostService,
    {
      provide: SERVICES.POST,
      useClass: PostService,
    },
  ],
  controllers: [PostController],
  exports: [
    PostService,
    {
      provide: SERVICES.POST,
      useClass: PostService,
    },
  ],
})
export class PostModule {}
