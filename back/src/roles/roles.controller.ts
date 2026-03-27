import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/roles-auth.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@ApiTags('Roles')
@Controller('api/roles')
export class RolesController {
  constructor(private roleService: RolesService) {}
  @ApiBearerAuth('JWT-auth')
  // @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.roleService.createRole(dto);
  }
  // @ApiBearerAuth('JWT-auth')
  // @UseGuards(RolesGuard)
  // @Roles('ADMIN')
  @Get('/:value')
  @ApiBearerAuth('JWT-auth')
  // @UseGuards(RolesGuard)
  @Roles('ADMIN')
  getByValue(@Param('value') value: string) {
    return this.roleService.getRoleByValue(value);
  }
}
