import { PartialType } from '@nestjs/swagger';
import { DirectAccessDto } from './create-direct-access.dto';

export class UpdateDirectAccessDto extends PartialType(DirectAccessDto) {}
