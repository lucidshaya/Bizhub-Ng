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
import { SignupDto, LoginDto, GoogleAuthDto, AcceptInviteDto } from './dto/auth.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private supabaseService: SupabaseService,
        private emailService: EmailService,
    ) { }

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
            if (!supabaseError && supabaseUser?.user) {
                supabaseUserId = supabaseUser.user.id;
            }
        } catch {
            // Supabase admin not available — continue with local DB only
        }

        // Hash password for local DB
        const passwordHash = await bcrypt.hash(dto.password, 12);

        // Create business
        const business = await this.prisma.business.create({
            data: {
                name: dto.businessName,
                type: dto.businessType || null,
                address: dto.businessAddress || null,
            },
        });

        // Create user in local DB
        const user = await this.prisma.user.create({
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

        return {
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                businessId: business.id,
                businessName: business.name,
                businessType: business.type,
                hasPin: false,
            },
            token,
        };
    }

    // ─── LOGIN ───────────────────────────────────────────

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            include: { business: true },
        });

        if (!user || !user.passwordHash) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!passwordValid) {
            throw new UnauthorizedException('Invalid email or password');
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
                hasPin: !!user.pinHash,
            },
            token,
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
            const business = await this.prisma.business.create({
                data: {
                    name: `${supabaseUser.user_metadata?.full_name || 'My'}'s Business`,
                },
            });

            user = await this.prisma.user.create({
                data: {
                    email: supabaseUser.email,
                    fullName:
                        supabaseUser.user_metadata?.full_name || supabaseUser.email,
                    avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
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
            },
            token,
        };
    }

    // ─── FORGOT PASSWORD ────────────────────────────────

    async forgotPassword(email: string) {
        const supabase = this.supabaseService.getClient();
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
        });

        if (error) {
            throw new BadRequestException(error.message);
        }

        return { message: 'Password reset email sent' };
    }

    // ─── GET CURRENT USER (Profile) ──────────────────────

    async getProfile(userId: string) {
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
            hasPin: !!user.pinHash,
        };
    }

    // ─── INVITE WORKER ──────────────────────────────────

    async inviteWorker(businessId: string, staffData: { name: string; email: string; role?: string; phone?: string }) {
        // Check if already registered
        const existingUser = await this.prisma.user.findUnique({ where: { email: staffData.email } });

        let user: any;
        let inviteToken: string;

        if (existingUser) {
            // If user already accepted invite, reject
            if (existingUser.inviteStatus === 'ACCEPTED') {
                throw new ConflictException('This user has already accepted their invitation');
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
        } catch (emailErr: any) {
            console.error(`❌ Gmail email error:`, emailErr.message);
        }

        // 2. Also try Supabase invite (creates auth user for login)
        try {
            const supabase = this.supabaseService.getClient();
            const { error } = await supabase.auth.admin.inviteUserByEmail(staffData.email, {
                data: {
                    full_name: staffData.name,
                    role: 'WORKER',
                    business_id: businessId,
                    invite_token: inviteToken,
                },
                redirectTo: inviteLink,
            });
            if (error) {
                console.log(`⚠️ Supabase invite note: ${error.message}`);
            } else {
                console.log(`✅ Supabase auth user created for ${staffData.email}`);
            }
        } catch (err: any) {
            console.log(`⚠️ Supabase invite skipped: ${err.message}`);
        }

        return {
            message: `Invitation sent to ${staffData.email}`,
            inviteToken,
            inviteLink: `${frontendUrl}/invite/accept?token=${inviteToken}`,
            user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
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
            throw new BadRequestException('This invitation has already been accepted');
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
            if (!error && data.user) {
                supabaseUserId = data.user.id;
            }
        } catch {
            // Supabase user may already exist from invite
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

        const token = this.generateToken(updatedUser.id, updatedUser.email, updatedUser.role);

        return {
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                fullName: updatedUser.fullName,
                role: updatedUser.role,
                businessId: updatedUser.businessId,
                businessName: updatedUser.business?.name,
                businessType: updatedUser.business?.type,
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
            throw new BadRequestException('No transaction PIN set for this organization');
        }
        const valid = await bcrypt.compare(pin, user.pinHash);
        if (!valid) {
            throw new UnauthorizedException('Invalid PIN');
        }
        return { valid: true };
    }

    // ─── HELPERS ─────────────────────────────────────────

    private generateToken(userId: string, email: string, role: UserRole) {
        return this.jwtService.sign({
            sub: userId,
            email,
            role,
        });
    }
}
