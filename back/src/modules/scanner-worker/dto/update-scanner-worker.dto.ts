import { PartialType } from '@nestjs/swagger';
import { CreateScannerWorkerDto } from './create-scanner-worker.dto';

export class UpdateScannerWorkerDto extends PartialType(CreateScannerWorkerDto) {}
