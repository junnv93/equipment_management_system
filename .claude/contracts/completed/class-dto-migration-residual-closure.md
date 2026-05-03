# class-dto-migration-residual-closure

## Scope

- Close the stale tracker item for legacy class-validator/class-transformer DTO migration residuals.
- Do not claim that every manual Swagger response DTO has been converted to `createZodDto`.
- Preserve the existing backend policy: new request DTO validation uses Zod schemas plus `ZodValidationPipe`, and opportunistic `createZodDto` conversion remains documented for future touched modules.

## Acceptance

- Backend source and shared packages contain no imports from `class-validator`.
- Backend source and shared packages contain no imports from `class-transformer`.
- Backend source and shared packages contain no representative class-validator decorators such as `@IsString`, `@IsUUID`, `@ValidateNested`, `@Min`, or `@Max`.
- `main.ts` continues to document that global `ValidationPipe` is removed and request validation is handled by endpoint-level `ZodValidationPipe`.
- `docs/references/backend-patterns.md` remains the policy source for future opportunistic conversion triggers.

## Verification

- `rg -n "from ['\"]class-validator['\"]|from ['\"]class-transformer['\"]" apps/backend/src packages --glob '*.ts'`
- `rg -n "@(IsString|IsNumber|IsUUID|IsOptional|IsEnum|IsArray|ValidateNested|Min|Max|Length|ArrayMinSize|ArrayMaxSize)\b" apps/backend/src packages --glob '*.ts'`
- `rg -n "new ValidationPipe|ValidationPipe\(" apps/backend/src/main.ts apps/backend/src --glob '*.ts'`
