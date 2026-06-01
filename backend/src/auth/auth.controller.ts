import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  SignupDto,
  LoginDto,
  GoogleAuthDto,
  ForgotPasswordDto,
  AcceptInviteDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { RequestWithUser } from '../common/interfaces/request.interface';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('verify-2fa')
  async verify2fa(@Body() body: { email: string; code: string }) {
    return this.authService.verify2fa(body.email, body.code);
  }

  @Post('google')
  async googleAuth(@Body() dto: GoogleAuthDto) {
    return this.authService.googleAuth(dto);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @UseGuards(JwtAuthGuard)
  @Post('invite-worker')
  async inviteWorker(
    @Request() req: RequestWithUser,
    @Body()
    body: { name: string; email: string; role?: string; phone?: string },
  ) {
    // Get business ID from authenticated user
    const profile = await this.authService.getProfile(req.user.sub);
    if (!profile.businessId) throw new Error('No business found');
    return this.authService.inviteWorker(profile.businessId, body);
  }

  @Get('invite-info')
  async getInviteInfo(@Query('token') token: string) {
    return this.authService.getInviteInfo(token);
  }

  @Post('accept-invite')
  async acceptInvite(@Body() dto: AcceptInviteDto) {
    return this.authService.acceptInvite(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: RequestWithUser) {
    return this.authService.getProfile(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('set-pin')
  async setPin(@Request() req: RequestWithUser, @Body() body: { pin: string }) {
    return this.authService.setPin(req.user.sub, body.pin);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-pin')
  async verifyPin(
    @Request() req: RequestWithUser,
    @Body() body: { pin: string },
  ) {
    return this.authService.verifyPin(req.user.sub, body.pin);
  }

  @UseGuards(JwtAuthGuard)
  @Post('request-pin-reset')
  async requestPinReset(@Request() req: RequestWithUser) {
    return this.authService.requestPinReset(req.user.sub);
  }

  @Post('reset-pin')
  async resetPin(@Body() body: { token: string; pin: string }) {
    return this.authService.resetPin(body.token, body.pin);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Request() req: RequestWithUser,
    @Body() body: { oldPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(
      req.user.sub,
      body.oldPassword,
      body.newPassword,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-pin')
  async changePin(
    @Request() req: RequestWithUser,
    @Body() body: { oldPin: string; newPin: string },
  ) {
    return this.authService.changePin(req.user.sub, body.oldPin, body.newPin);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/toggle-2fa')
  async toggle2FA(
    @Request() req: RequestWithUser,
    @Body() body: { enabled: boolean },
  ) {
    return this.authService.toggle2FA(req.user.sub, body.enabled);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/team')
  async getTeamMembers(@Request() req: RequestWithUser) {
    const profile = await this.authService.getProfile(req.user.sub);
    if (!profile.businessId) throw new Error('No business found');
    return this.authService.getTeamMembers(profile.businessId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/team/:userId/role')
  async changeUserRole(
    @Request() req: RequestWithUser,
    @Param('userId') userId: string,
    @Body('role') role: string,
  ) {
    return this.authService.changeUserRole(req.user.sub, userId, role);
  }
}
