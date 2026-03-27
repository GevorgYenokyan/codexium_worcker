import { HttpException, HttpStatus } from '@nestjs/common';

export class ValidationExceptions extends HttpException {
  message;

  constructor(respons) {
    super(respons, HttpStatus.BAD_REQUEST);
    this.message = respons;
  }
}
