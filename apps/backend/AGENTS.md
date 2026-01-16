# AGENTS.md - Backend (NestJS)

Backend-specific rules for the NestJS API server. Read root `./AGENTS.md` first.

---

## Module Context

**Role:** RESTful API server handling all business logic, authentication, and database operations.

**Port:** 3001 (development)

**Dependencies:**

- PostgreSQL via Drizzle ORM
- Azure AD for authentication
- JWT for session management

---

## Tech Stack

| Component       | Version               | Notes             |
| --------------- | --------------------- | ----------------- |
| NestJS          | ^10.0.0               | Core framework    |
| Drizzle ORM     | ^0.36.0               | Database ORM      |
| drizzle-kit     | ^0.20.13              | Migration tool    |
| PostgreSQL      | 15.x                  | Primary database  |
| Passport        | ^0.6.0                | Authentication    |
| class-validator | ^0.14.0               | DTO validation    |
| Zod             | ^3.x (via nestjs-zod) | Schema validation |

---

## Operational Commands

```bash
# From apps/backend directory
pnpm start:dev           # Start with hot reload
pnpm start:debug         # Start with debugger
pnpm build               # Build for production
pnpm start:prod          # Run production build

# Database
pnpm db:generate         # Generate Drizzle migrations
pnpm db:migrate          # Apply migrations
pnpm db:studio           # Open Drizzle Studio GUI

# Testing
pnpm test                # Unit tests
pnpm test:watch          # Watch mode
pnpm test:cov            # With coverage
pnpm test:e2e            # E2E tests
```

---

## Directory Structure

```
src/
├── main.ts              # Application entry point
├── app.module.ts        # Root module
├── common/              # Shared utilities
│   ├── cache/           # Caching service
│   ├── filters/         # Exception filters
│   ├── interceptors/    # Logging, error interceptors
│   ├── logger/          # Winston logger
│   └── pipes/           # Zod validation pipe
├── database/            # Drizzle ORM setup
│   └── drizzle/schema/  # Table definitions
├── modules/             # Feature modules
│   ├── auth/            # Authentication
│   ├── equipment/       # Equipment CRUD
│   ├── rentals/         # Rental management
│   ├── reservations/    # Reservation system
│   ├── calibration/     # Calibration tracking
│   ├── teams/           # Team management
│   ├── users/           # User management
│   ├── notifications/   # Alert system
│   └── reports/         # Reporting
└── types/               # Shared TypeScript types
```

---

## Implementation Patterns

### Module Structure

Every feature module MUST follow this structure:

```
modules/[feature]/
├── [feature].module.ts      # Module definition
├── [feature].controller.ts  # HTTP endpoints
├── [feature].service.ts     # Business logic
├── dto/
│   ├── create-[feature].dto.ts
│   ├── update-[feature].dto.ts
│   └── [feature]-query.dto.ts
├── entities/
│   └── [feature].entity.ts  # If needed beyond Drizzle schema
└── __tests__/
    ├── [feature].controller.spec.ts
    └── [feature].service.spec.ts
```

### Controller Pattern

```typescript
@ApiTags('equipment')
@Controller('api/equipment') // Note: Current implementation uses /api/equipment, not /api/v1/equipment
@UseGuards(JwtAuthGuard)
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get()
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  async findAll(@Query() query: EquipmentQueryDto) {
    return this.equipmentService.findAll(query);
  }

  @Post()
  @RequirePermissions(Permission.CREATE_EQUIPMENT)
  async create(@Body() dto: CreateEquipmentDto) {
    return this.equipmentService.create(dto);
  }
}
```

### Service Pattern

```typescript
@Injectable()
export class EquipmentService {
  constructor(
    @Inject('DRIZZLE') private readonly db: DrizzleClient,
  ) {}

  async findAll(query: EquipmentQueryDto) {
    // Use Drizzle query builder
    return this.db.select().from(equipment).where(...);
  }
}
```

### DTO Pattern

```typescript
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EquipmentStatus } from '@equipment-management/schemas';

export class CreateEquipmentDto {
  @ApiProperty({ description: 'Equipment name' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus;
}
```

---

## Database Rules

### Drizzle Schema Location

All table definitions in `src/database/drizzle/schema/`:

- `equipment.ts` - Equipment table
- `loans.ts` - Loan records
- `users.ts` - User accounts
- `teams.ts` - Team structure
- `calibrations.ts` - Calibration history
- `checkouts.ts` - Checkout records

### Migration Workflow

1. Modify schema files in `src/database/drizzle/schema/`
2. Run `pnpm db:generate` to create migration
3. Review generated SQL in `drizzle/` folder
4. Run `pnpm db:migrate` to apply

### Query Patterns

```typescript
// SELECT with conditions
const result = await this.db.select().from(equipment).where(eq(equipment.status, 'available'));

// INSERT
const [newEquipment] = await this.db.insert(equipment).values({ name, status }).returning();

// UPDATE
await this.db.update(equipment).set({ status: 'maintenance' }).where(eq(equipment.id, id));
```

---

## Authentication and Authorization

### Guard Hierarchy

1. `JwtAuthGuard` - Validates JWT token
2. `RolesGuard` - Checks user roles
3. `PermissionsGuard` - Checks specific permissions

### Permission Enum

Located at `src/modules/auth/rbac/permissions.enum.ts`:

```typescript
export enum Permission {
  VIEW_EQUIPMENT = 'view:equipment',
  CREATE_EQUIPMENT = 'create:equipment',
  UPDATE_EQUIPMENT = 'update:equipment',
  DELETE_EQUIPMENT = 'delete:equipment',
  // ... more permissions
}
```

### Public Routes

Use `@Public()` decorator to skip authentication:

```typescript
@Public()
@Get('health')
healthCheck() {
  return { status: 'ok' };
}
```

---

## Testing Strategy

### Unit Test Pattern

```typescript
describe('EquipmentService', () => {
  let service: EquipmentService;
  let mockDb: DeepMocked<DrizzleClient>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [EquipmentService, { provide: 'DRIZZLE', useValue: createMock<DrizzleClient>() }],
    }).compile();

    service = module.get(EquipmentService);
    mockDb = module.get('DRIZZLE');
  });

  it('should return equipment list', async () => {
    mockDb.select.mockReturnValue(/* chain mock */);
    const result = await service.findAll({});
    expect(result).toBeDefined();
  });
});
```

### E2E Test Pattern

```typescript
describe('Equipment API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('/api/equipment (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/equipment')
      .set('Authorization', `Bearer ${testToken}`)
      .expect(200);
  });
});
```

---

## Local Golden Rules

### Do's

- Always inject dependencies via constructor.
- Use `@ApiTags()` and `@ApiOperation()` for Swagger docs.
- Return DTOs, not raw database entities.
- Log errors using the injected `LoggerService`.
- Use transactions for multi-step database operations.

### Don'ts

- Don't use `@Res()` decorator; let NestJS handle response.
- Don't catch errors in controllers; let filters handle them.
- Don't access `process.env` directly; use `ConfigService`.
- Don't create circular dependencies between modules.
- Don't use synchronous file operations.

---

## API Response Format

```typescript
// Success response
{
  "data": { ... },
  "meta": {
    "timestamp": "2025-01-15T10:00:00Z",
    "pagination": { "total": 100, "page": 1, "pageSize": 20 }
  }
}

// Error response
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Equipment not found",
    "details": { "id": "123" }
  },
  "meta": { "timestamp": "2025-01-15T10:00:00Z" }
}
```

---

End of backend AGENTS.md.
