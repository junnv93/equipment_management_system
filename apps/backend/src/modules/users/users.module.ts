import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { EmailService } from '../notifications/services/email.service';
import { EmailTemplateService } from '../notifications/services/email-template.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, EmailService, EmailTemplateService],
  exports: [UsersService],
})
export class UsersModule {}
