import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public =
  (): import('/home/kmjkds/equipment_management_system/node_modules/@nestjs/common/decorators/core/set-metadata.decorator').CustomDecorator<string> =>
    SetMetadata(IS_PUBLIC_KEY, true);
