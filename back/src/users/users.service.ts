import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './users.model';
import { CreateUserDto } from './dto/create-user.dto';
import { RolesService } from 'src/roles/roles.service';
import { AddRoleDto } from './dto/add-role.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { UserImages } from './user-images.model';
import { v4 as uuidv4, v4 } from 'uuid';
import { MaileService } from 'src/mail/mail.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { deleteFile } from 'src/components/deleteFile';
import * as path from 'path';

import { CreateMessageDto } from './dto/message.dto';
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User) private userRepasitory: typeof User,
    private roleService: RolesService,
    @InjectModel(UserImages)
    private userImagesRepository: typeof UserImages,

    private readonly mailerService: MaileService,
  ) {}

  async createUser(dto: CreateUserDto, files: any) {
    try {
      const role = await this.roleService.getRoleByValue(dto.user_type);
      if (dto.googleId) {
        throw new HttpException(
          'Google registration not allowed through this endpoint',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (role.value === 'ADMIN' || !role.id) {
        throw new HttpException(
          'internal server error',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!dto.password) {
        throw new HttpException('Password is required', HttpStatus.BAD_REQUEST);
      }

      const user = await this.userRepasitory.create(dto);

      user.isActive = false;

      if (!dto.googleId) {
        const link = v4();
        const message =
          dto.lang === 'arm'
            ? 'Հարգելի ' +
              dto.name +
              ' շնորհակալություն Codexium.it կայքում գրանցվելու համար:Նույնականացումն ավարտելու համար անհրաժեշտ է անցնել ' +
              `<a href="https://codexium.it/activation/?code=${link}">այս</a>` +
              ' հղմամբ`.' +
              `<a href="https://codexium.it/activation/?code=${link}">codexium.it</a>`
            : `Dear ${dto.name},
Thank you for registering on the Codexium.it website.
To complete the verification process, please follow  <a href="https://codexium.it/activation/?code=${link}">this</a> link: <a href="https://codexium.it/activation/?code=${link}">codexium.it</a>`;
        user.$set('roles', role.id);
        user.roles = [role];
        user.activationLink = link;
        this.mailerService.sendEmail(
          message,
          user.email,
          `activation/?code=${link}`,
          'User Activation',
        );
      }
      await user.save();

      if (files && files.length > 0) {
        const images = files.map((file) => ({
          userId: user.id,
          image: file.path.replace(/\\/g, '/'),
        }));
        console.log(images);

        await this.userImagesRepository.bulkCreate(images);
      }
      return user;
    } catch (e) {
      throw new HttpException('internal server error', HttpStatus.BAD_REQUEST);
    }
  }

  async createGoogleUser(data: {
    email: string;
    name: string;
    googleId: string;
  }) {
    try {
      const role = await this.roleService.getRoleByValue('simple user');

      if (!role || !role.id) {
        throw new HttpException(
          'Role not found',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const user = await this.userRepasitory.create({
        email: data.email,
        name: data.name,
        user_type: 'simple user',
        googleId: data.googleId,
        password: null,
      });

      user.isActive = true;
      await user.$set('roles', role.id);
      user.roles = [role];
      await user.save();

      return user;
    } catch (error) {
      console.error('Create Google user error:', error);
      throw new HttpException(
        'Failed to create user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUserByGoogleId(googleId: string) {
    const user = await this.userRepasitory.findOne({
      where: { googleId },
      include: { all: true },
    });
    return user;
  }

  async update(dto: CreateUserDto, req) {
    const user = await this.getUserById(req?.user?.id);
    if (!user) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    const excludedFields = ['id', 'user_type'];

    for (const key of Object.keys(dto)) {
      if (!excludedFields.includes(key)) {
        user[key] = dto[key];
      }
    }

    await user.save();

    return user;
  }

  async getAllUsers() {
    const users = this.userRepasitory.findAll({ include: { all: true } });
    return users;
  }

  async activation(activationLink: string) {
    const user = await this.userRepasitory.findOne({
      where: { activationLink },
    });

    if (!user) {
      throw new HttpException(
        'invalid activation link',
        HttpStatus.BAD_REQUEST,
      );
    }
    user.isActive = true;
    await user.save();
    return {
      message: 'Your account has been activated successfully',
    };
  }

  async getUserByEmail(email: string) {
    const user = await this.userRepasitory.findOne({
      where: { email },
      include: { all: true },
    });
    return user;
  }

  async findOne(req) {
    const id = req.user.id;
    const user = await this.userRepasitory.findByPk(id, {});
    if (!user) {
      throw new NotFoundException('user not found');
    }
    return user;
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    try {
      const user = await this.userRepasitory.findOne({
        where: { email: dto.email },
      });

      if (!user || !user.isActive) {
        throw new NotFoundException('user not found');
      }
      const link = v4();
      user.activationLink = link;
      this.mailerService.sendEmail(
        'password recovery',
        user.email,
        `recoverPassword/?code=${link}`,
        'To recover your password, click on the Link',
      );
      user.save();
    } catch (e) {
      throw new HttpException('internal server error', HttpStatus.BAD_REQUEST);
    }
  }

  async getUserByLink(link: string) {
    const user = await this.userRepasitory.findOne({
      where: { activationLink: link },
    });

    return user;
  }

  async getUserById(id) {
    const user = await this.userRepasitory.findOne({
      where: { id },
    });

    return user;
  }

  async getUser(id) {
    const user = await this.userRepasitory.findOne({
      where: { id },
      include: [{ model: this.userImagesRepository }],
      attributes: {
        exclude: [
          'password',
          'createdAt',
          'updatedAt',
          'activationLink',
          'user_type',
        ],
      },
    });

    return user;
  }

  async addRole(dto: AddRoleDto) {
    const user = await this.userRepasitory.findByPk(dto.userId);
    const role = await this.roleService.getRoleByValue(dto.value);
    if (user || role) {
      user.$add('role', role.id);
      return dto;
    }
    throw new HttpException('user or role not found', HttpStatus.NOT_FOUND);
  }

  async ban(dto: BanUserDto) {
    const user = await this.userRepasitory.findByPk(dto.userId);
    if (!user) {
      throw new HttpException('user  not found', HttpStatus.NOT_FOUND);
    }
    user.banned = true;
    user.banReason = dto.banReason;
    user.save();
    return user;
  }

  async addAUserImage(id: number, files: any) {
    const user = await this.userRepasitory.findByPk(id);
    if (!user) {
      throw new NotFoundException('Product not found');
    }

    if (files && files.length > 0) {
      const oldImages = await this.userImagesRepository.findAll({
        where: { userId: id },
      });

      // Delete old images from the file system
      for (const image of oldImages) {
        const filePath = path.resolve(image.image);
        deleteFile(filePath);
      }

      // Remove old image references from the database
      await this.userImagesRepository.destroy({
        where: { userId: id },
      });

      const images = files.map((file) => ({
        userId: id,
        image: file.path.replace(/\\/g, '/'),
      }));

      await this.userImagesRepository.bulkCreate(images);

      return { message: 'Images added successfully' };
    }
  }

  async deleteUserImage(imageId: number, req) {
    const userId = req?.user?.id;
    const image = await this.userImagesRepository.findByPk(imageId);
    if (!image) {
      throw new NotFoundException('Image not found');
    }
    if (userId != image.userId) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    const filePath = path.resolve(image.image);
    deleteFile(filePath);

    await this.userImagesRepository.destroy({ where: { id: imageId } });
    return { message: 'Image deleted successfully' };
  }

  async createMessage(
    dto: CreateMessageDto,
    file: { filePath: string; mimeType: string } | null,
  ) {
    try {
      let fileHtml = '';

      if (file?.filePath) {
        if (file.mimeType.startsWith('image/')) {
          fileHtml = `<img src="http://codexium.it/${file.filePath}" alt="uploaded image" style="max-width:400px;"/>`;
        } else if (file.mimeType === 'application/pdf') {
          fileHtml = `<a href="http://codexium.it/${file.filePath}" target="_blank">download PDF</a>`;
        }
      }

      const message = `
      <p><strong>Name:</strong> ${dto.name}</p>
      <p><strong>Email:</strong> ${dto.email}</p>
      <p><strong>Phone:</strong> ${dto.phone}</p>
      <p><strong>Message:</strong> ${dto.message}</p>
      ${fileHtml}
    `;

      await this.mailerService.sendMessageEmail(message, dto.email, 'message');
    } catch (e) {
      throw new HttpException('internal server error', HttpStatus.BAD_REQUEST);
    }
  }
}
// {
//   "error": false,
//   "message": "check your email to recover password"
// }
