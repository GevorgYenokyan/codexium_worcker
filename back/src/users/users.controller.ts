import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { User } from './users.model';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles-auth.decorator';
import { AddRoleDto } from './dto/add-role.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { ValidationPipe } from 'src/pipes/validation.pipe';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/components/file-upload.config';
import { Response } from 'express';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { CreateMessageDto } from './dto/message.dto';
import { validateUploadedFile } from 'src/components/validateUploadedFile';

@ApiTags('create user')
@Controller('api')
export class UsersController {
  constructor(private userService: UsersService) {}
  @ApiOperation({ summary: 'create user' })
  @ApiResponse({ status: 200, type: User })
  @ApiBearerAuth('JWT-auth')
  // @UseGuards(RolesGuard)
  // @Roles('ADMIN')
  @UsePipes(ValidationPipe)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        password: { type: 'string' },
        lang: { type: 'string' },
        images: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Post('users')
  @UseInterceptors(FilesInterceptor('images', 10, multerConfig))
  async create(
    @Body() userDto: CreateUserDto,
    @UploadedFiles() images: Express.Multer.File,
  ) {
    try {
      await validateUploadedFile(images);
      return this.userService.createUser(userDto, images);
    } catch (e) {
      console.log(e);
    }
  }

  @UseGuards(RolesGuard)
  @Roles('specialist', 'ADMIN', 'simple user', 'employer')
  @ApiBearerAuth('JWT-auth')
  @Patch('users')
  update(@Body() createUserDto: CreateUserDto, @Req() req) {
    return this.userService.update(createUserDto, req);
    // return this.announcementsService.update(+id, updateAnnouncementDto, req);
  }

  @ApiOperation({ summary: 'get all users' })
  @ApiResponse({ status: 200, type: [User] })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('users')
  getAll() {
    return this.userService.getAllUsers();
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(RolesGuard)
  @Roles('specialist', 'ADMIN', 'simple user', 'employer')
  @Get('/userByID')
  findOne(@Req() req) {
    return this.userService.getUser(req?.user?.id);
  }

  @ApiOperation({ summary: 'add role' })
  @ApiResponse({ status: 200 })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post('role')
  addRole(@Body() dto: AddRoleDto) {
    return this.userService.addRole(dto);
  }

  @ApiOperation({ summary: 'ban user' })
  @ApiResponse({ status: 200 })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post('ban')
  ban(@Body() dto: BanUserDto) {
    return this.userService.ban(dto);
  }

  @ApiOperation({ summary: 'activate' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        link: { type: 'string' },
      },
    },
  })
  @Put('activate')
  // activate(@Body() body: { link: string }, @Res() res: Response) {
  //   return this.userService.activation(body.link);
  // }
  activate(@Body() body: { link: string }) {
    return this.userService.activation(body.link);
  }

  @Post('forgotPassword')
  forgotPassword(@Body() body: ForgotPasswordDto) {
    this.userService.forgotPassword(body);
    return {
      error: false,
      message: 'check your email to recover password',
    };
  }

  @UseGuards(RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles('specialist', 'ADMIN', 'simple user', 'employer')
  @Post('user/images')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('images', 5, multerConfig))
  async addProductImages(@UploadedFiles() files: any, @Req() req) {
    const id = req.user.id;
    return this.userService.addAUserImage(id, files);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(RolesGuard)
  @Roles('specialist', 'ADMIN', 'simple user', 'employer')
  @ApiBearerAuth('JWT-auth')
  @Delete('user/images/:imageId')
  async deleteProductImage(@Param('imageId') imageId: number, @Req() req) {
    return this.userService.deleteUserImage(imageId, req);
    // return this.announcementsService.deleteAnnouncementImage(imageId);
  }

  // controller
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        message: { type: 'string' },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Post('message')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async createCategory(
    @Body() createMessageDto: CreateMessageDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    await validateUploadedFile(file);
    const filePath = file ? file.path.replace(/\\/g, '/') : null;
    const mimeType = file ? file.mimetype : null;

    return this.userService.createMessage(createMessageDto, {
      filePath,
      mimeType,
    });
  }
}
