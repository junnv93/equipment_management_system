import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UsePipes,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TestSoftwareService } from './test-software.service';
import {
  CreateTestSoftwareValidationPipe,
  type CreateTestSoftwareInput,
} from './dto/create-test-software.dto';
import {
  UpdateTestSoftwareValidationPipe,
  type UpdateTestSoftwareInput,
} from './dto/update-test-software.dto';
import {
  TestSoftwareQueryValidationPipe,
  type TestSoftwareQueryInput,
} from './dto/test-software-query.dto';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission, TEST_SOFTWARE_DATA_SCOPE } from '@equipment-management/shared-constants';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { SiteScoped } from '../../common/decorators/site-scoped.decorator';
import type { AuthenticatedRequest } from '../../types/auth';
import { extractUserId } from '../../common/utils/extract-user';
import type { TestSoftware } from '@equipment-management/db/schema';
import { versionedSchema } from '../../common/dto/base-versioned.dto';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

/** Toggle availability body schema */
const toggleAvailabilitySchema = z.object({
  ...versionedSchema,
});
type ToggleAvailabilityInput = z.infer<typeof toggleAvailabilitySchema>;
const ToggleAvailabilityValidationPipe = new ZodValidationPipe(toggleAvailabilitySchema);

@Controller('test-software')
export class TestSoftwareController {
  constructor(private readonly testSoftwareService: TestSoftwareService) {}

  @Post()
  @RequirePermissions(Permission.CREATE_TEST_SOFTWARE)
  @AuditLog({ action: 'create', entityType: 'software', entityIdPath: 'response.id' })
  @UsePipes(CreateTestSoftwareValidationPipe)
  async create(
    @Body() dto: CreateTestSoftwareInput,
    @Request() req: AuthenticatedRequest
  ): Promise<TestSoftware> {
    const createdBy = extractUserId(req);
    return this.testSoftwareService.create(dto, createdBy);
  }

  @Get()
  @RequirePermissions(Permission.VIEW_TEST_SOFTWARE)
  @SiteScoped({ policy: TEST_SOFTWARE_DATA_SCOPE })
  findAll(@Query(TestSoftwareQueryValidationPipe) query: TestSoftwareQueryInput): Promise<{
    items: TestSoftware[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
    return this.testSoftwareService.findAll(query);
  }

  @Get(':uuid')
  @RequirePermissions(Permission.VIEW_TEST_SOFTWARE)
  findOne(@Param('uuid', ParseUUIDPipe) uuid: string): Promise<TestSoftware> {
    return this.testSoftwareService.findOne(uuid);
  }

  @Patch(':uuid')
  @RequirePermissions(Permission.UPDATE_TEST_SOFTWARE)
  @AuditLog({ action: 'update', entityType: 'software', entityIdPath: 'params.uuid' })
  @UsePipes(UpdateTestSoftwareValidationPipe)
  async update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: UpdateTestSoftwareInput
  ): Promise<TestSoftware> {
    return this.testSoftwareService.update(uuid, dto);
  }

  @Patch(':uuid/availability')
  @RequirePermissions(Permission.UPDATE_TEST_SOFTWARE)
  @AuditLog({ action: 'update', entityType: 'software', entityIdPath: 'params.uuid' })
  @UsePipes(ToggleAvailabilityValidationPipe)
  async toggleAvailability(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: ToggleAvailabilityInput
  ): Promise<TestSoftware> {
    return this.testSoftwareService.toggleAvailability(uuid, dto.version);
  }
}
