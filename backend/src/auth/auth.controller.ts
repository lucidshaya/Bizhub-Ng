import {
    Controller,
    Post,
    Get,
    Body,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto, LoginDto, GoogleAuthDto, ForgotPasswordDto, AcceptInviteDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('signup')
    async signup(@Body() dto: SignupDto) {
        return this.authService.signup(dto);
    }

    @Post('login')
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
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
    async inviteWorker(@Request() req: any, @Body() body: { name: string; email: string; role?: string; phone?: string }) {
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
    async getProfile(@Request() req: any) {
        return this.authService.getProfile(req.user.sub);
    }

    @UseGuards(JwtAuthGuard)
    @Post('set-pin')
    async setPin(@Request() req: any, @Body() body: { pin: string }) {
        return this.authService.setPin(req.user.sub, body.pin);
    }

    @UseGuards(JwtAuthGuard)
    @Post('verify-pin')
    async verifyPin(@Request() req: any, @Body() body: { pin: string }) {
        return this.authService.verifyPin(req.user.sub, body.pin);
    }

    @UseGuards(JwtAuthGuard)
    @Post('request-pin-reset')
    async requestPinReset(@Request() req: any) {
        return this.authService.requestPinReset(req.user.sub);
    }

    @Post('reset-pin')
    async resetPin(@Body() body: { token: string; pin: string }) {
        return this.authService.resetPin(body.token, body.pin);
    }
}
