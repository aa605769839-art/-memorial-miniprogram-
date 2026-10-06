import { Module } from '@nestjs/common';
import { MemorialsService } from './memorials.service';
import { MemorialsController } from './memorials.controller';
import { ImageGenerationController } from './image-generation.controller';
import { AvatarService } from './avatar.service';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { PhotosModule } from '../photos/photos.module';
import { GiftsModule } from '../gifts/gifts.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PhotosModule, GiftsModule, AuthModule],
  controllers: [MemorialsController, ImageGenerationController, MembersController],
  providers: [MemorialsService, AvatarService, MembersService],
  exports: [MemorialsService, AvatarService, MembersService],
})
export class MemorialsModule {}