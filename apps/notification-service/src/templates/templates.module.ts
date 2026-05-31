import { Global, Module } from '@nestjs/common';
import { TemplateCacheService } from './template-cache.service';
import { TemplateEngineService } from './template-engine.service';
import { TemplateRepository } from './template.repository';

@Global()
@Module({
  providers: [TemplateRepository, TemplateCacheService, TemplateEngineService],
  exports: [TemplateRepository, TemplateCacheService, TemplateEngineService],
})
export class TemplatesModule {}
