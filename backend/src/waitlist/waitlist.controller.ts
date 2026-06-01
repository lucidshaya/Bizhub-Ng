import { Controller, Post, Body } from '@nestjs/common';
import { WaitlistService } from './waitlist.service';

@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post()
  async join(
    @Body() body: { email: string; businessName: string; industry: string },
  ) {
    return this.waitlistService.joinWaitlist(body);
  }
}
