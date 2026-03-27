import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { seconds, Throttle } from '@nestjs/throttler';
import { ThrottlerIpGuard } from 'src/components/throttler-ip.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import {
  AddDomainDto,
  ReconScanDto,
  ScanIpDto,
  VerifyDomainDto,
} from './dto/create-recon.dto';
import { ReconService } from './recon.service';
import { CloudflareLeakService } from './cloudflare-leak.service';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles-auth.decorator';

@ApiTags('api/recon')
@Controller('api/recon')
@ApiBearerAuth('JWT-auth')
@UseGuards(RolesGuard)
@Roles('ADMIN')
export class ReconController {
  constructor(
    private readonly reconService: ReconService,
    private readonly cloudflareLeakService: CloudflareLeakService,
  ) {}

  // ─── Domain management ────────────────────────────────────────────────────

  // @Post('domains')
  // @ApiOperation({ summary: 'Add a domain to verify ownership' })
  // addDomain(
  //   @Body(new ValidationPipe({ whitelist: true })) dto: AddDomainDto,
  //   @Req() req,
  // ) {
  //   return this.reconService.addDomain(req.user.id, dto.domain);
  // }

  // @Post('domains/verify')
  // @HttpCode(HttpStatus.OK)
  // @UseGuards(ThrottlerIpGuard)
  // @Throttle({ medium: { limit: 10, ttl: seconds(60) } })
  // @ApiOperation({ summary: 'Check DNS TXT record and verify domain ownership' })
  // verifyDomain(
  //   @Body(new ValidationPipe({ whitelist: true })) dto: VerifyDomainDto,
  //   @Req() req,
  // ) {
  //   return this.reconService.verifyDomain(req.user.id, dto.domainId);
  // }

  // @Get('domains')
  // @ApiOperation({
  //   summary: 'List verified and pending domains for current user',
  // })
  // getUserDomains(@Req() req) {
  //   return this.reconService.getUserDomains(req.user.id);
  // }

  // @Delete('domains/:id')
  // @HttpCode(HttpStatus.NO_CONTENT)
  // @ApiOperation({ summary: 'Remove a domain' })
  // deleteDomain(@Param('id') id: string, @Req() req) {
  //   return this.reconService.deleteDomain(req.user.id, +id);
  // }

  // ─── Cloudflare real IP leak ──────────────────────────────────────────────
  @Post('cloudflare-leak')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerIpGuard)
  @Throttle({ medium: { limit: 5, ttl: seconds(60) } })
  @ApiOperation({
    summary: 'Find real IP behind Cloudflare',
    description:
      'Domain must be verified. Checks MX records, SPF, and unproxied subdomains ' +
      'to discover the real origin IP even when the domain is behind Cloudflare.',
  })
  @ApiResponse({ status: 200, description: 'Check completed' })
  @ApiResponse({ status: 403, description: 'Domain not verified or not yours' })
  async cloudflareLeakCheck(
    @Body(new ValidationPipe({ whitelist: true })) dto: AddDomainDto,
    @Req() req,
  ) {
    // const domainRecord = await this.reconService.getVerifiedDomain(
    //   req.user.id,
    //   dto.domainId,
    // );
    return this.cloudflareLeakService.findRealIp(dto.domain);
  }

  // ─── Recon scan ───────────────────────────────────────────────────────────

  // @Post('scan')
  // @HttpCode(HttpStatus.OK)
  // @UseGuards(ThrottlerIpGuard)
  // @Throttle({ medium: { limit: 2, ttl: seconds(60) } })
  // @ApiOperation({ summary: 'Run recon scan on a verified domain' })
  // @ApiResponse({ status: 200, description: 'Scan completed' })
  // @ApiResponse({ status: 403, description: 'Domain not verified or not yours' })
  // scan(
  //   @Body(new ValidationPipe({ whitelist: true })) dto: ReconScanDto,
  //   @Req() req,
  // ) {
  //   return this.reconService.scanFromPayload(
  //     dto.domainId,
  //     dto.portFrom,
  //     dto.portTo,
  //   );
  // }

  // ─── Direct IP scan (chain from cloudflare-leak result) ──────────────────

  // @Post('scan-ip')
  // @HttpCode(HttpStatus.OK)
  // @UseGuards(ThrottlerIpGuard)
  // @Throttle({ medium: { limit: 3, ttl: seconds(60) } })
  // @ApiOperation({
  //   summary: 'Port scan a specific IP address',
  //   description:
  //     'Use after cloudflare-leak to scan the real origin IP directly. ' +
  //     'Domain ownership is still required — you must own the domain served by this IP.',
  // })
  // @ApiResponse({ status: 200, description: 'Scan completed' })
  // @ApiResponse({ status: 403, description: 'Domain not verified or not yours' })
  // scanIp(
  //   @Body(new ValidationPipe({ whitelist: true })) dto: ScanIpDto,
  //   @Req() req,
  // ) {
  //   return this.reconService.scanFromPayload(
  //     req.user.id,
  //     dto.domainId,
  //     dto.ip,
  //     dto.portFrom,
  //     dto.portTo,
  //   );
  // }

  // ─── History ──────────────────────────────────────────────────────────────

  // @Get('history')
  // @ApiOperation({ summary: 'Get scan history' })
  // getHistory(@Req() req) {
  //   return this.reconService.getScanHistory(req.user.id);
  // }

  // @Get('history/:id')
  // @ApiOperation({ summary: 'Get full scan result by id' })
  // getScan(@Param('id') id: string, @Req() req) {
  //   return this.reconService.getScanById(req.user.id, +id);
  // }

  // @Delete('history/:id')
  // @HttpCode(HttpStatus.NO_CONTENT)
  // @ApiOperation({ summary: 'Delete a scan record' })
  // deleteScan(@Param('id') id: string, @Req() req) {
  //   return this.reconService.deleteScan(req.user.id, +id);
  // }
}
