import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
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
      expect(result.user).toEqual({
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@example.com',
        name: '관리자',
        roles: [UserRole.SITE_ADMIN],
        department: undefined,
        site: 'suwon',
        location: '수원랩',
      });
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
      expect(result.user).toEqual({
        id: '00000000-0000-0000-0000-000000000002',
        email: 'manager@example.com',
        name: '기술책임자',
        roles: [UserRole.TECHNICAL_MANAGER],
        department: 'RF팀',
        site: 'suwon',
        location: '수원랩',
      });
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
      expect(result.user).toEqual({
        id: '00000000-0000-0000-0000-000000000003',
        email: 'user@example.com',
        name: '시험실무자',
        roles: [UserRole.TEST_OPERATOR],
        department: 'RF팀',
        site: 'suwon',
        location: '수원랩',
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
        roles: [UserRole.SITE_ADMIN],
        department: 'IT',
      });
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if no Azure user is provided', () => {
      // Act & Assert
      expect(() => service.validateAzureADUser(null)).toThrow(UnauthorizedException);
    });

    it('should default to TEST_OPERATOR role if no roles provided', () => {
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
      expect(result.user.roles).toEqual([UserRole.TEST_OPERATOR]);
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
      expect(result).toEqual([UserRole.SITE_ADMIN, UserRole.TECHNICAL_MANAGER]);
    });

    it('should return TEST_OPERATOR role if no mappable roles are found', () => {
      // Arrange
      const azureRoles = ['Unknown'];

      // Using private method through any trick
      const service_any = service as any;

      // Act
      const result = service_any.mapAzureRolesToAppRoles(azureRoles);

      // Assert
      expect(result).toEqual([UserRole.TEST_OPERATOR]);
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
        UserRole.SITE_ADMIN,
        UserRole.TECHNICAL_MANAGER,
        UserRole.TEST_OPERATOR,
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
        teamId: 'rf',
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
        teamId: 'sar',
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
        teamId: 'rf',
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
        roles: [UserRole.SITE_ADMIN],
        site: 'suwon',
        location: '수원랩',
        teamId: 'rf',
      });
    });
  });
});
