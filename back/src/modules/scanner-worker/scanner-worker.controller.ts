import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ScannerWorkerService } from './scanner-worker.service';

@Controller('scanner-worker')
export class ScannerWorkerController {
  constructor(private readonly scannerWorkerService: ScannerWorkerService) {}

  // @Post()
  // create(@Body() createScannerWorkerDto: CreateScannerWorkerDto) {
  //   return this.scannerWorkerService.create(createScannerWorkerDto);
  // }

  // @Get()
  // findAll() {
  //   return this.scannerWorkerService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.scannerWorkerService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateScannerWorkerDto: UpdateScannerWorkerDto) {
  //   return this.scannerWorkerService.update(+id, updateScannerWorkerDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.scannerWorkerService.remove(+id);
  // }
}
