import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService, AuthResponse } from '../auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { LoginDto } from '../dto/login.dto';
import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from '../rbac/roles.enum';
import { AuthenticatedRequest } from '../../../types/auth';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    roles: [UserRole.TEST_ENGINEER],
    department: 'Testing',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            validateAzureADUser: jest.fn(),
          },
        },
        {
          provide: JwtAuthGuard,
          useValue: {
            canActivate: jest.fn().mockImplementation(() => true),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedResult: AuthResponse = {
        access_token: 'test-token',
        refresh_token: 'test-refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 900,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          roles: mockUser.roles,
          department: mockUser.department,
        },
      };

      jest.spyOn(authService, 'login').mockResolvedValue(expectedResult);

      // Act
      const result = await controller.login(loginDto);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should throw UnauthorizedException with invalid credentials', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      jest
        .spyOn(authService, 'login')
        .mockRejectedValue(new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.'));

      // Act & Assert
      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      // Arrange
      const req = {
        user: {
          userId: mockUser.id,
          email: mockUser.email,
          roles: mockUser.roles,
          department: mockUser.department,
        },
      } as unknown as AuthenticatedRequest;

      const expectedProfile = {
        id: mockUser.id,
        email: mockUser.email,
        roles: mockUser.roles,
        department: mockUser.department,
      };

      // Act
      const result = controller.getProfile(req);

      // Assert
      expect(result).toEqual(expectedProfile);
    });
  });

  describe('azureLogin', () => {
    it('should validate Azure AD user successfully', async () => {
      // Arrange
      const azureUserData = {
        oid: 'azure-id',
        preferred_username: 'azure@example.com',
        name: 'Azure User',
        roles: ['Admin'],
        department: 'IT',
      };

      const req = { user: azureUserData } as unknown as AuthenticatedRequest;

      const expectedResult: AuthResponse = {
        access_token: 'azure-token',
        refresh_token: 'azure-refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 900,
        user: {
          id: 'azure-id',
          email: 'azure@example.com',
          name: 'Azure User',
          roles: [UserRole.LAB_MANAGER],
          department: 'IT',
        },
      };

      // 타입 문제를 해결하기 위해 any로 캐스팅 (테스트 환경만 해당)
      (authService.validateAzureADUser as jest.Mock).mockReturnValue(expectedResult);

      // Act
      const result = await controller.azureLogin(req);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(authService.validateAzureADUser).toHaveBeenCalledWith(azureUserData);
    });
  });

  describe('test', () => {
    it('should return test message', () => {
      // Act
      const result = controller.test();

      // Assert
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('timestamp');
    });
  });
});
