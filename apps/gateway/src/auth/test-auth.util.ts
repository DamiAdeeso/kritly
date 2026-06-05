import { TestingModuleBuilder } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt-auth.guard';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

const bypassGuard = { canActivate: () => true };

/** Bypass JWT guards in unit tests that call controller methods directly. */
export function bypassJwtAuthGuard(builder: TestingModuleBuilder): TestingModuleBuilder {
  return builder
    .overrideGuard(JwtAuthGuard)
    .useValue(bypassGuard)
    .overrideGuard(OptionalJwtAuthGuard)
    .useValue(bypassGuard);
}
