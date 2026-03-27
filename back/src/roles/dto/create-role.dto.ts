import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'ADMIN', description: 'admin' })
  readonly value: string;
  @ApiProperty({ example: 'ADMIN user', description: 'admin user' })
  readonly description: string;
}
