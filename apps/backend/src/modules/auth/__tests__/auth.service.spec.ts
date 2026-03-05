import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthService, AzureADUser } from '../auth.service';
import { LoginDto } from '../dto/login.dto';
import { UserRole } from '../rbac/roles.enum';
import { UsersService } from '../../users/users.service';
import { TOKEN_BLACKLIST } from '../blacklist/token-blacklist.interface';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let _configService: ConfigService;
  let usersService: UsersService;

  const mockDbUser = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'admin@example.com',
    name: '관리자 (DB)',
    role: 'lab_manager',
    site: 'suwon',
    location: '수원랩',
    position: 'Lab Manager',
    teamId: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1',
    isActive: true,
    lastLogin: null,
    deletedAt: null,
    equipmentCount: 0,
    rentalsCount: 0,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-token'),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              // Azure AD 팀 ID 매핑 — 서비스의 configService.get() 호출에 대응
              const AZURE_TEAM_IDS: Record<string, string> = {
                AZURE_TEAM_ID_SUW_RF: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1',
                AZURE_TEAM_ID_SUW_SAR: '7fd28076-fd5e-4d36-b051-bbf8a97b82db',
                AZURE_TEAM_ID_SUW_EMC: 'bb6c860d-9d7c-4e2d-b289-2b2e416ec289',
                AZURE_TEAM_ID_SUW_AUTO: 'f0a32655-00f9-4ecd-b43c-af4faed499b6',
                AZURE_TEAM_ID_UIW_RF: 'a1b2c3d4-e5f6-4789-abcd-ef0123456789',
                AZURE_TEAM_ID_PYT_AUTO: 'b2c3d4e5-f6a7-4890-bcde-f01234567890',
              };
              if (key === 'JWT_SECRET') return 'test-secret';
              if (key in AZURE_TEAM_IDS) return AZURE_TEAM_IDS[key];
              return null;
            }),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: TOKEN_BLACKLIST,
          useValue: {
            add: jest.fn(),
            isBlacklisted: jest.fn().mockResolvedValue(false),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    _configService = module.get<ConfigService>(ConfigService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return DB user data when user exists in DB', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'admin@example.com',
        password: 'admin123',
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockDbUser as any);

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toHaveProperty('access_token');
      expect(result.user).toMatchObject({
        id: mockDbUser.id,
        email: mockDbUser.email,
        name: mockDbUser.name,
        roles: [mockDbUser.role],
        site: 'suwon',
        location: '수원랩',
        teamId: mockDbUser.teamId,
      });
      expect(usersService.findByEmail).toHaveBeenCalledWith('admin@example.com');
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should fallback to defaults when user not in DB', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'admin@example.com',
        password: 'admin123',
      };
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toHaveProperty('access_token');
      expect(result.user).toMatchObject({
        email: 'admin@example.com',
        name: '관리자',
        roles: [UserRole.LAB_MANAGER],
      });
      // Fallback should not have site/teamId
      expect(result.user.site).toBeUndefined();
      expect(result.user.teamId).toBeUndefined();
    });

    it('should authenticate manager with correct password', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'manager@example.com',
        password: 'manager123',
      };
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result.user).toMatchObject({
        email: 'manager@example.com',
        name: '기술책임자',
        roles: [UserRole.TECHNICAL_MANAGER],
      });
    });

    it('should authenticate user with correct password', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'user@example.com',
        password: 'user123',
      };
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result.user).toMatchObject({
        email: 'user@example.com',
        name: '시험실무자',
        roles: [UserRole.TEST_ENGINEER],
      });
    });

    it('should throw UnauthorizedException with invalid credentials', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'wrong@example.com',
        password: 'wrongpassword',
      };

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should lock account after MAX_LOGIN_ATTEMPTS consecutive failures', async () => {
      const wrongDto: LoginDto = { email: 'admin@example.com', password: 'wrong' };

      // 4회 실패 → 각각 'Invalid email or password.'
      for (let i = 0; i < 4; i++) {
        await expect(service.login(wrongDto)).rejects.toThrow('Invalid email or password.');
      }

      // 5번째 실패 → 계정 잠금 메시지
      await expect(service.login(wrongDto)).rejects.toThrow(
        'Account is temporarily locked. Please try again in 15 minutes.'
      );
    });

    it('should block login attempts when account is locked (even with correct password)', async () => {
      const wrongDto: LoginDto = { email: 'admin@example.com', password: 'wrong' };

      // 5회 실패로 잠금 설정
      for (let i = 0; i < 5; i++) {
        await service.login(wrongDto).catch(() => {});
      }

      // 잠금 후 올바른 비밀번호도 차단
      const correctDto: LoginDto = { email: 'admin@example.com', password: 'admin123' };
      await expect(service.login(correctDto)).rejects.toThrow(
        'Account is temporarily locked. Please try again in 15 minutes.'
      );
    });

    it('should reset failure counter after successful login', async () => {
      const wrongDto: LoginDto = { email: 'admin@example.com', password: 'wrong' };
      const correctDto: LoginDto = { email: 'admin@example.com', password: 'admin123' };

      // 4회 실패 (카운터 누적)
      for (let i = 0; i < 4; i++) {
        await service.login(wrongDto).catch(() => {});
      }

      // 성공으로 카운터 리셋
      await service.login(correctDto);

      // 다시 4회 실패 → 잠금 안 됨 (카운터가 1부터 시작)
      for (let i = 0; i < 4; i++) {
        await expect(service.login(wrongDto)).rejects.toThrow('Invalid email or password.');
      }
    });
  });

  describe('validateAzureADUser', () => {
    it('should return access token and user for Azure AD user', () => {
      // Arrange
      const azureUser = {
        oid: 'azure-id',
        preferred_username: 'azure@example.com',
        name: 'Azure User',
        roles: ['Admin'],
        department: 'IT',
        employeeId: 'EMP123',
      };

      // Act
      const result = service.validateAzureADUser(azureUser);

      // Assert
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
      expect(result.user).toMatchObject({
        id: 'azure-id',
        email: 'azure@example.com',
        name: 'Azure User',
        roles: [UserRole.LAB_MANAGER],
        department: 'IT',
      });
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if no Azure user is provided', () => {
      // Act & Assert
      // 테스트 목적: null이 전달될 때 예외 발생 확인 (런타임에서 발생 가능한 케이스)
      expect(() => service.validateAzureADUser(null as unknown as AzureADUser)).toThrow(
        UnauthorizedException
      );
    });

    it('should default to TEST_ENGINEER role if no roles provided', () => {
      // Arrange
      const azureUser = {
        oid: 'azure-id',
        preferred_username: 'azure@example.com',
        name: 'Azure User',
        department: 'IT',
      };

      // Act
      const result = service.validateAzureADUser(azureUser);

      // Assert
      expect(result.user.roles).toEqual([UserRole.TEST_ENGINEER]);
    });
  });

  describe('mapAzureRolesToAppRoles', () => {
    it('should map Azure AD roles to app roles', () => {
      // Arrange
      const azureRoles = ['Admin', 'Manager'];

      // Using private method through any trick
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const service_any = service as any;

      // Act
      const result = service_any.mapAzureRolesToAppRoles(azureRoles);

      // Assert
      expect(result).toEqual([UserRole.LAB_MANAGER, UserRole.TECHNICAL_MANAGER]);
    });

    it('should return TEST_ENGINEER role if no mappable roles are found', () => {
      // Arrange
      const azureRoles = ['Unknown'];

      // Using private method through any trick
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const service_any = service as any;

      // Act
      const result = service_any.mapAzureRolesToAppRoles(azureRoles);

      // Assert
      expect(result).toEqual([UserRole.TEST_ENGINEER]);
    });

    it('should map new Azure AD roles correctly', () => {
      // Arrange
      const azureRoles = ['SiteAdmin', 'TechnicalManager', 'TestOperator'];

      // Using private method through any trick
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const service_any = service as any;

      // Act
      const result = service_any.mapAzureRolesToAppRoles(azureRoles);

      // Assert
      expect(result).toEqual([
        UserRole.LAB_MANAGER,
        UserRole.TECHNICAL_MANAGER,
        UserRole.TEST_ENGINEER,
      ]);
    });
  });

  describe('mapAzureGroupsToTeamAndLocation', () => {
    it('should map LST.SUW.RF to RF team and Suwon location', () => {
      // Arrange
      const azureGroups = ['LST.SUW.RF'];

      // Using private method through any trick
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const service_any = service as any;

      // Act
      const result = service_any.mapAzureGroupsToTeamAndLocation(azureGroups);

      // Assert
      expect(result).toEqual({
        teamId: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1', // 수원 RF팀 UUID
        site: 'suwon',
        location: '수원랩',
      });
    });

    it('should map LST.UIW.RF to RF team and Uiwang location', () => {
      // Arrange
      const azureGroups = ['LST.UIW.RF'];

      // Using private method through any trick
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const service_any = service as any;

      // Act
      const result = service_any.mapAzureGroupsToTeamAndLocation(azureGroups);

      // Assert
      expect(result).toEqual({
        teamId: 'a1b2c3d4-e5f6-4789-abcd-ef0123456789', // 의왕 General RF팀 UUID
        site: 'uiwang',
        location: '의왕랩',
      });
    });

    it('should return empty object if no valid group pattern found', () => {
      // Arrange
      const azureGroups = ['InvalidGroup', 'OtherGroup'];

      // Using private method through any trick
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const service_any = service as any;

      // Act
      const result = service_any.mapAzureGroupsToTeamAndLocation(azureGroups);

      // Assert
      expect(result).toEqual({});
    });

    it('should handle multiple groups and return first valid match', () => {
      // Arrange
      const azureGroups = ['LST.SUW.RF', 'LST.UIW.EMC'];

      // Using private method through any trick
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const service_any = service as any;

      // Act
      const result = service_any.mapAzureGroupsToTeamAndLocation(azureGroups);

      // Assert
      expect(result).toEqual({
        teamId: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1', // 수원 RF팀 UUID
        site: 'suwon',
        location: '수원랩',
      });
    });
  });

  describe('validateAzureADUser with site and location', () => {
    it('should include site and location from Azure groups', () => {
      // Arrange
      const azureUser = {
        oid: 'azure-id',
        preferred_username: 'azure@example.com',
        name: 'Azure User',
        roles: ['SiteAdmin'],
        groups: ['LST.SUW.RF'],
        department: 'IT',
      };

      // Act
      const result = service.validateAzureADUser(azureUser);

      // Assert
      expect(result.user).toMatchObject({
        id: 'azure-id',
        email: 'azure@example.com',
        name: 'Azure User',
        roles: [UserRole.LAB_MANAGER],
        site: 'suwon',
        location: '수원랩',
        teamId: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1', // 수원 RF팀 UUID
      });
    });
  });
});
