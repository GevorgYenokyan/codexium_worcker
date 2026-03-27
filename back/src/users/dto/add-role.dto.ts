import { ApiProperty } from '@nestjs/swagger';

export class AddRoleDto {
  @ApiProperty({ example: 'user', description: 'user role' })
  readonly value: string;
  @ApiProperty({ example: '1', description: 'userId' })
  readonly userId: number;
}
