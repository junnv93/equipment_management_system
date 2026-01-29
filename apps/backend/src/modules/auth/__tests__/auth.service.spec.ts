import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService, AzureADUser } from '../auth.service';
import { LoginDto } from '../dto/login.dto';
import { UserRole } from '../rbac/roles.enum';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let configService: ConfigService;

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
              if (key === 'JWT_SECRET') return 'test-secret';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return access token and user for admin', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'admin@example.com',
        password: 'admin123',
      };

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
      expect(result.user).toMatchObject({
        email: 'admin@example.com',
        name: '관리자',
        roles: [UserRole.LAB_MANAGER],
        site: 'suwon',
        location: '수원랩',
      });
      // UUID 형식 검증
      expect(result.user.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should return access token and user for manager', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'manager@example.com',
        password: 'manager123',
      };

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
      expect(result.user).toMatchObject({
        email: 'manager@example.com',
        name: '기술책임자',
        roles: [UserRole.TECHNICAL_MANAGER],
        department: 'RF팀',
        site: 'suwon',
        location: '수원랩',
      });
      expect(result.user.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('should return access token and user for regular user', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'user@example.com',
        password: 'user123',
      };

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
      expect(result.user).toMatchObject({
        email: 'user@example.com',
        name: '시험실무자',
        roles: [UserRole.TEST_ENGINEER],
        department: 'RF팀',
        site: 'suwon',
        location: '수원랩',
      });
      expect(result.user.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
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
      expect(result.user).toEqual({
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

    it('should map LST.UIW.SAR to SAR team and Uiwang location', () => {
      // Arrange
      const azureGroups = ['LST.UIW.SAR'];

      // Using private method through any trick
      const service_any = service as any;

      // Act
      const result = service_any.mapAzureGroupsToTeamAndLocation(azureGroups);

      // Assert
      expect(result).toEqual({
        teamId: '77777777-7777-7777-7777-777777777777', // 의왕 SAR팀 UUID
        site: 'uiwang',
        location: '의왕랩',
      });
    });

    it('should return empty object if no valid group pattern found', () => {
      // Arrange
      const azureGroups = ['InvalidGroup', 'OtherGroup'];

      // Using private method through any trick
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
