import { UserRole } from '../rbac/roles.enum';

export class UserDto {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
  department?: string;
  employeeId?: string;
}
