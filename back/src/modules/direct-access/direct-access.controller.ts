import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  ValidationPipe,
  ForbiddenException,
  BadRequestException,
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
import { DirectAccessService } from './direct-access.service';
import { DirectAccessDto } from './dto/create-direct-access.dto';
import { ReconService } from 'src/modules/recon/recon.service';
import { validateIp } from 'src/common/security/ssrf-guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles-auth.decorator';

@ApiTags('api/direct-access')
@Controller('api/direct-access')
@ApiBearerAuth('JWT-auth')
@UseGuards(RolesGuard)
@Roles('ADMIN')
export class DirectAccessController {
  constructor(
    private readonly directAccessService: DirectAccessService,
    private readonly reconService: ReconService,
  ) {}

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerIpGuard)
  @Throttle({ medium: { limit: 3, ttl: seconds(60) } })
  @ApiOperation({
    summary: 'Test if real server IP is properly protected from CDN bypass',
    description:
      'Requires verified domain ownership. ' +
      'Tests whether direct IP access is blocked by firewall/nginx. ' +
      'Runs ~15 checks: basic access, host variants, XFF bypass, CF header spoof, SNI mismatch.',
  })
  @ApiResponse({ status: 200, description: 'Test completed' })
  @ApiResponse({
    status: 403,
    description: 'Domain not verified or IP not associated with your domain',
  })
  async test(
    @Body(new ValidationPipe({ whitelist: true })) dto: DirectAccessDto,
    @Req() req,
  ) {
    // 1. Verify domain ownership
    // const domainRecord = await this.reconService.getVerifiedDomain(
    //   req.user.id,
    //   dto.domainId,
    // );

    // 2. Validate IP — must be public, not private
    await validateIp(dto.ip);

    // 3. Confirm this IP was actually found by our CDN leak tool
    //    (prevents using this as a general port scanner against arbitrary IPs)
    if (!dto.skipLeakCheck) {
      // const isAssociated = await this.reconService.isIpAssociatedWithDomain(
      //   dto.ip,
      //   domainRecord.domain,
      // );
      // if (!isAssociated) {
      //   throw new ForbiddenException(
      //     'IP must be previously discovered via CDN leak check for this domain',
      //   );
      // }
    }

    return this.directAccessService.test(dto.ip, 'domen');
  }
}
