import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import {
  SignupDto,
  LoginDto,
  GoogleAuthDto,
  AcceptInviteDto,
} from './dto/auth.dto';
import { UserRole, BusinessPlan } from '@prisma/client';

interface GoogleUserMetadata {
  full_name?: string;
  avatar_url?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  businessId: string | null;
  businessName?: string;
  businessType?: string | null;
  businessAddress?: string | null;
  businessPlan?: BusinessPlan;
  planExpiryDate?: Date | null;
  isExpired: boolean;
  storeMode: string;
  trialActivated: boolean;
  hasPin: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private supabaseService: SupabaseService,
    private emailService: EmailService,
  ) {}

  // ─── SIGNUP ──────────────────────────────────────────

  async signup(dto: SignupDto) {
    // Check if user exists
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Try to create user in Supabase Auth (optional — login uses bcrypt)
    let supabaseUserId: string | null = null;
    try {
      const supabase = this.supabaseService.getClient();
      const { data: supabaseUser, error: supabaseError } =
        await supabase.auth.admin.createUser({
          email: dto.email,
          password: dto.password,
          email_confirm: true,
        });
      if (supabaseError) {
        console.log('⚠️ Supabase signup note:', supabaseError.message);
      } else if (supabaseUser?.user) {
        supabaseUserId = supabaseUser.user.id;
      }
    } catch (err: unknown) {
      console.error('❌ Supabase signup fetch error:', (err as Error).message);
      // Non-blocking: continue with local DB
    }

    // Hash password for local DB
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Run as transaction to ensure atomicity
    return await this.prisma.$transaction(async (tx) => {
      // Determine store mode
      const storeMode = dto.businessType?.toLowerCase().includes('retail')
        ? 'RETAIL_STORE'
        : 'WORKSPACE';

      // Create business
      const business = await tx.business.create({
        data: {
          name: dto.businessName,
          type: dto.businessType || null,
          address: dto.businessAddress || null,
          storeMode: storeMode,
        },
      });

      // Create user
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          fullName: dto.fullName,
          phone: dto.phone || null,
          role: UserRole.OWNER,
          supabaseUserId,
          businessId: business.id,
        },
      });

      // Generate JWT
      const token = this.generateToken(user.id, user.email, user.role);

      console.log(
        `[Signup Success] Role: ${
          user.role
        }, Return Mode: ${this.getEffectiveStoreMode(
          user.role,
          business.storeMode,
        )}`,
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          businessId: business.id,
          businessName: business.name,
          businessType: business.type,
          businessPlan: business.plan,
          storeMode: this.getEffectiveStoreMode(user.role, business.storeMode),
          hasPin: false,
        },
        token,
      };
    });
  }

  // ─── LOGIN ───────────────────────────────────────────

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { business: true },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Account not found');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    if (user.twoFactorEnabled) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await this.prisma.user.update({
        where: { id: user.id },
        data: { twoFactorSecret: code },
      });
      await this.emailService.send2FAEmail(user.email, code, user.fullName);
      return { requires2FA: true, message: '2FA code sent to your email' };
    }

    const token = this.generateToken(user.id, user.email, user.role);

    console.log(
      `[Login Success] Role: ${
        user.role
      }, Return Mode: ${this.getEffectiveStoreMode(
        user.role,
        user.business?.storeMode ?? null,
      )}`,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        businessId: user.businessId,
        businessName: user.business?.name,
        businessType: user.business?.type,
        businessPlan: user.business?.plan,
        storeMode: this.getEffectiveStoreMode(
          user.role,
          user.business?.storeMode ?? null,
        ),
        hasPin: !!user.pinHash,
      },
      token,
    };
  }

  async verify2fa(email: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { business: true },
    });

    if (!user || user.twoFactorSecret !== code) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: null },
    });

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        businessId: user.businessId,
        businessName: user.business?.name,
        businessType: user.business?.type,
        businessPlan: user.business?.plan,
        storeMode: this.getEffectiveStoreMode(
          user.role,
          user.business?.storeMode ?? null,
        ),
        hasPin: !!user.pinHash,
      },
      token,
    };
  }

  // ─── SETTINGS UTILS ──────────────────────────────────

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    if (newPassword.length < 6) {
      throw new BadRequestException(
        'New password must be at least 6 characters long',
      );
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash)
      throw new UnauthorizedException('User not found');

    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid old password');

    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    return { message: 'Password changed successfully' };
  }

  async changePin(userId: string, oldPin: string, newPin: string) {
    if (!/^\d{4}$/.test(newPin)) {
      throw new BadRequestException('New PIN must be exactly 4 digits');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    if (!user.pinHash) throw new BadRequestException('No PIN set previously');

    const valid = await bcrypt.compare(oldPin, user.pinHash);
    if (!valid) throw new UnauthorizedException('Invalid old PIN');

    const newPinHash = await bcrypt.hash(newPin, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { pinHash: newPinHash },
    });

    return { message: 'PIN changed successfully' };
  }

  async toggle2FA(userId: string, enabled: boolean) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: enabled, twoFactorSecret: null },
    });

    return {
      message: `Two-factor authentication has been ${enabled ? 'enabled' : 'disabled'}`,
    };
  }

  // ─── GOOGLE OAuth ────────────────────────────────────

  async googleAuth(dto: GoogleAuthDto) {
    const supabase = this.supabaseService.getAnonClient();

    // Verify the Google ID token with Supabase
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: dto.idToken,
    });

    if (error) {
      throw new UnauthorizedException('Invalid Google token');
    }

    const supabaseUser = data.user;
    if (!supabaseUser?.email) {
      throw new UnauthorizedException('Could not retrieve email from Google');
    }

    // Check if user exists locally
    let user = await this.prisma.user.findUnique({
      where: { email: supabaseUser.email },
      include: { business: true },
    });

    if (!user) {
      // First-time Google login — create user + business
      const metadata = supabaseUser.user_metadata as GoogleUserMetadata;
      const business = await this.prisma.business.create({
        data: {
          name: `${metadata?.full_name || 'My'}'s Business`,
        },
      });

      user = await this.prisma.user.create({
        data: {
          email: supabaseUser.email,
          fullName: metadata?.full_name || supabaseUser.email,
          avatarUrl: metadata?.avatar_url || null,
          role: UserRole.OWNER,
          supabaseUserId: supabaseUser.id,
          businessId: business.id,
        },
        include: { business: true },
      });
    }

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        businessId: user.businessId,
        businessName: user.business?.name,
        businessType: user.business?.type,
        businessPlan: user.business?.plan,
      },
      token,
    };
  }

  // ─── FORGOT PASSWORD ────────────────────────────────

  async forgotPassword(email: string) {
    try {
      const supabase = this.supabaseService.getClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
      });

      if (error) {
        console.error('❌ Supabase forgot password error:', error.message);
        throw new BadRequestException(error.message);
      }

      return { message: 'Password reset email sent' };
    } catch (err: unknown) {
      console.error(
        '❌ Supabase forgot password fetch error:',
        (err as Error).message,
      );
      throw new BadRequestException(
        'Failed to connect to authentication service',
      );
    }
  }

  // ─── GET CURRENT USER (Profile) ──────────────────────

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { business: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
      businessId: user.businessId,
      businessName: user.business?.name,
      businessType: user.business?.type,
      businessAddress: user.business?.address,
      businessPlan: user.business?.plan,
      planExpiryDate: user.business?.planExpiryDate,
      isExpired: user.business?.planExpiryDate
        ? new Date() > new Date(user.business.planExpiryDate)
        : false,
      storeMode: this.getEffectiveStoreMode(
        user.role,
        user.business?.storeMode ?? null,
      ),
      trialActivated: user.business?.trialActivated ?? false,
      hasPin: !!user.pinHash,
    };
  }
  async inviteWorker(
    businessId: string,
    staffData: { name: string; email: string; role?: string; phone?: string },
  ) {
    // Check if already registered
    const existingUser = await this.prisma.user.findUnique({
      where: { email: staffData.email },
    });

    let user: { id: string; email: string; fullName: string; role: UserRole };
    let inviteToken: string;

    if (existingUser) {
      // If user already accepted invite, reject
      if (existingUser.inviteStatus === 'ACCEPTED') {
        throw new ConflictException(
          'This user has already accepted their invitation',
        );
      }
      // Otherwise, resend the invite (update token)
      inviteToken = `INV_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
      user = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: { inviteToken, inviteStatus: 'PENDING' },
      });
      console.log(`🔄 Resending invite to existing user ${staffData.email}`);
    } else {
      // Create a pending user record with WORKER role
      inviteToken = `INV_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
      user = await this.prisma.user.create({
        data: {
          email: staffData.email,
          fullName: staffData.name,
          phone: staffData.phone || null,
          role: UserRole.WORKER,
          businessId,
          inviteToken,
          inviteStatus: 'PENDING',
        },
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteLink = `${frontendUrl}/invite/accept?token=${inviteToken}`;

    console.log(`📧 Sending invitation to ${staffData.email}...`);
    console.log(`🔗 Invite link: ${inviteLink}`);

    // 1. Send email via Gmail (primary - reliable)
    try {
      const emailResult = await this.emailService.sendInviteEmail(
        staffData.email,
        staffData.name,
        inviteLink,
        undefined,
      );
      console.log(`📧 Gmail result:`, JSON.stringify(emailResult));
    } catch (emailErr: unknown) {
      console.error(
        `❌ Gmail email error:`,
        (emailErr as Error).message || 'Unknown error',
      );
    }

    // 2. Also try Supabase invite (creates auth user for login)
    try {
      const supabase = this.supabaseService.getClient();
      const { error } = await supabase.auth.admin.inviteUserByEmail(
        staffData.email,
        {
          data: {
            full_name: staffData.name,
            role: 'WORKER',
            business_id: businessId,
            invite_token: inviteToken,
          },
          redirectTo: inviteLink,
        },
      );
      if (error) {
        console.log(`⚠️ Supabase invite note: ${error.message}`);
      } else {
        console.log(`✅ Supabase auth user created for ${staffData.email}`);
      }
    } catch (err: unknown) {
      console.log(`⚠️ Supabase invite skipped: ${(err as Error).message}`);
    }

    return {
      message: `Invitation sent to ${staffData.email}`,
      inviteToken,
      inviteLink: `${frontendUrl}/invite/accept?token=${inviteToken}`,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  // ─── GET INVITE INFO ─────────────────────────────────

  async getInviteInfo(token: string) {
    if (!token) throw new BadRequestException('Token is required');

    const user = await this.prisma.user.findFirst({
      where: { inviteToken: token },
      include: { business: true },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired invitation');
    }

    if (user.inviteStatus === 'ACCEPTED') {
      throw new BadRequestException(
        'This invitation has already been accepted',
      );
    }

    return {
      email: user.email,
      fullName: user.fullName,
      businessName: user.business?.name || 'BizhubNg',
      status: user.inviteStatus,
    };
  }

  // ─── ACCEPT INVITE ───────────────────────────────────

  async acceptInvite(dto: AcceptInviteDto) {
    // Find the pending user by invite token
    const user = await this.prisma.user.findFirst({
      where: { inviteToken: dto.token, inviteStatus: 'PENDING' },
      include: { business: true },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired invitation');
    }

    // Create Supabase auth user
    const supabase = this.supabaseService.getClient();
    let supabaseUserId: string | null = null;

    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: dto.password,
        email_confirm: true,
        user_metadata: {
          full_name: dto.fullName,
          role: 'WORKER',
        },
      });
      if (error) {
        console.log('⚠️ Supabase accept invite note:', error.message);
      } else if (data.user) {
        supabaseUserId = data.user.id;
      }
    } catch (err: unknown) {
      console.error(
        '❌ Supabase accept invite fetch error:',
        (err as Error).message,
      );
    }

    // Hash password for local DB
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Update the pending user
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        fullName: dto.fullName,
        phone: dto.phone || user.phone,
        passwordHash,
        inviteStatus: 'ACCEPTED',
        inviteToken: null,
        supabaseUserId,
      },
      include: { business: true },
    });

    const token = this.generateToken(
      updatedUser.id,
      updatedUser.email,
      updatedUser.role,
    );

    return {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        businessId: updatedUser.businessId,
        businessName: updatedUser.business?.name,
        businessType: updatedUser.business?.type,
        businessPlan: updatedUser.business?.plan,
        storeMode: this.getEffectiveStoreMode(
          updatedUser.role,
          updatedUser.business?.storeMode ?? null,
        ),
      },
      token,
    };
  }

  // ─── SET PIN ─────────────────────────────────────────

  async setPin(userId: string, pin: string) {
    if (!/^\d{4}$/.test(pin)) {
      throw new BadRequestException('PIN must be exactly 4 digits');
    }
    const pinHash = await bcrypt.hash(pin, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { pinHash },
    });
    return { message: 'PIN set successfully' };
  }

  // ─── VERIFY PIN ─────────────────────────────────────

  async verifyPin(userId: string, pin: string) {
    let user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    // If SUB_ADMIN or WORKER, they use the organization's OWNER PIN for access
    if (user.role !== UserRole.OWNER) {
      const owner = await this.prisma.user.findFirst({
        where: { businessId: user.businessId, role: UserRole.OWNER },
      });
      if (owner) user = owner;
    }

    if (!user?.pinHash) {
      throw new BadRequestException(
        'No transaction PIN set for this organization',
      );
    }
    const valid = await bcrypt.compare(pin, user.pinHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid PIN');
    }
    return { valid: true };
  }

  // ─── REQUEST PIN RESET ──────────────────────────────

  async requestPinReset(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { business: true },
    });

    if (!user) throw new UnauthorizedException('User not found');

    // Note: For now, setting expiration to 15m for the PIN reset link
    const token = this.jwtService.sign(
      { sub: user.id, type: 'PIN_RESET' },
      { expiresIn: '15m' },
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-pin?token=${token}`;

    await this.emailService.sendRawEmail(
      user.email,
      'Reset your Transaction PIN',
      `Hello ${user.fullName},\n\nClick the link below to reset your transaction PIN for ${user.business?.name || 'BizhubNg'}.\n\n${resetLink}\n\nIf you did not request this, please ignore it.`,
    );

    return { message: 'PIN reset instructions sent to your email.' };
  }

  // ─── RESET PIN (FROM EMAIL LINK) ─────────────────────

  async resetPin(token: string, newPin: string) {
    if (!/^\d{4}$/.test(newPin)) {
      throw new BadRequestException('PIN must be exactly 4 digits');
    }

    try {
      const payload: { type: string; sub: string } =
        this.jwtService.verify(token);
      if (payload.type !== 'PIN_RESET') {
        throw new BadRequestException('Invalid token type');
      }

      const userId = payload.sub;
      const pinHash = await bcrypt.hash(newPin, 10);

      await this.prisma.user.update({
        where: { id: userId },
        data: { pinHash },
      });

      return { message: 'PIN has been reset successfully.' };
    } catch {
      throw new BadRequestException(
        'Invalid or expired reset token. Please request a new one.',
      );
    }
  }

  // ─── HELPERS ─────────────────────────────────────────

  private generateToken(userId: string, email: string, role: UserRole) {
    return this.jwtService.sign(
      {
        sub: userId,
        email,
        role,
      },
      { expiresIn: '7d' }, // Explictly hardcoded for reliability on Vercel
    );
  }

  private getEffectiveStoreMode(
    role: UserRole,
    businessStoreMode: string | null,
  ): string {
    const roleStr = (role as string)?.toUpperCase();
    // Owners, Admins, and Subadmins see the "previous form" (WORKSPACE)
    if (roleStr === 'OWNER' || roleStr === 'ADMIN' || roleStr === 'SUBADMIN') {
      return 'WORKSPACE';
    }
    // Workers see the "current format" (RETAIL_STORE) if the business is set to it
    return businessStoreMode ?? 'WORKSPACE';
  }

  // ─── TEAM MANAGEMENT ─────────────────────────────────

  async getTeamMembers(businessId: string) {
    const members = await this.prisma.user.findMany({
      where: { businessId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    return members;
  }

  async changeUserRole(ownerId: string, targetUserId: string, newRole: string) {
    // Validate role values
    const allowedRoles = ['ADMIN', 'WORKER', 'VIEWER'];
    if (!allowedRoles.includes(newRole)) {
      throw new BadRequestException(
        `Invalid role. Must be one of: ${allowedRoles.join(', ')}`,
      );
    }

    // Load the requesting user to confirm they are OWNER
    const requester = await this.prisma.user.findUnique({
      where: { id: ownerId },
    });
    if (!requester) throw new UnauthorizedException('User not found');
    if (
      requester.role !== UserRole.OWNER &&
      requester.role !== UserRole.ADMIN
    ) {
      throw new UnauthorizedException(
        'Only Owners and Admins can change user roles',
      );
    }

    // Load target user
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!target) throw new BadRequestException('Target user not found');

    // Cannot change an OWNER's role
    if (target.role === UserRole.OWNER) {
      throw new BadRequestException(
        'Cannot change the role of the business Owner',
      );
    }

    // Must be in the same business
    if (target.businessId !== requester.businessId) {
      throw new BadRequestException(
        'Cannot change roles of users from another business',
      );
    }

    const oldRoleLabel = target.role;
    const roleLabels: Record<string, string> = {
      ADMIN: 'Sub Admin',
      WORKER: 'Worker',
      VIEWER: 'Viewer',
    };

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole as UserRole },
    });

    // Get business name for email
    const business = requester.businessId
      ? await this.prisma.business.findUnique({
          where: { id: requester.businessId },
        })
      : null;

    // Send role change notification email (non-blocking)
    this.emailService
      .sendRoleChangeEmail(
        target.email,
        target.fullName,
        oldRoleLabel,
        newRole,
        business?.name || 'BizhubNg',
      )
      .catch((err) => console.error('Role change email failed:', err));

    return {
      id: updated.id,
      fullName: updated.fullName,
      email: updated.email,
      role: updated.role,
      message: `Role updated to ${roleLabels[newRole] || newRole}. Email notification sent.`,
    };
  }
}
