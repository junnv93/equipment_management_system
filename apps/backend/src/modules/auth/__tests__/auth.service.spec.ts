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
        id: '1',
        email: 'admin@example.com',
        name: '관리자',
        roles: [UserRole.ADMIN],
        department: undefined,
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
        id: '2',
        email: 'manager@example.com',
        name: '매니저',
        roles: [UserRole.MANAGER],
        department: 'IT',
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
        id: '3',
        email: 'user@example.com',
        name: '일반 사용자',
        roles: [UserRole.USER],
        department: 'RF팀',
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
        roles: [UserRole.ADMIN],
        department: 'IT',
      });
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if no Azure user is provided', () => {
      // Act & Assert
      expect(() => service.validateAzureADUser(null)).toThrow(UnauthorizedException);
    });

    it('should default to USER role if no roles provided', () => {
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
      expect(result.user.roles).toEqual([UserRole.USER]);
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
      expect(result).toEqual([UserRole.ADMIN, UserRole.MANAGER]);
    });

    it('should return USER role if no mappable roles are found', () => {
      // Arrange
      const azureRoles = ['Unknown'];
      
      // Using private method through any trick
      const service_any = service as any;

      // Act
      const result = service_any.mapAzureRolesToAppRoles(azureRoles);

      // Assert
      expect(result).toEqual([UserRole.USER]);
    });
  });
}); 