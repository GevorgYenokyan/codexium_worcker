import { PartialType } from '@nestjs/swagger';
import { ReconScanDto } from './create-recon.dto';

export class UpdateReconDto extends PartialType(ReconScanDto) {}
