import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { ValidationExceptions } from 'src/exceptions/validation.exceptions';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    try {
      const obj = plainToClass(metadata.metatype, value);
      const errors = await validate(obj);
      if (errors.length) {
        const messages = errors.map((err) => {
          return `${err.property}-${Object.values(err.constraints).join(', ')}`;
        });

        throw new ValidationExceptions({ message: messages });
      }
      return value;
    } catch (e) {
      console.log(e);
    }
  }
}
