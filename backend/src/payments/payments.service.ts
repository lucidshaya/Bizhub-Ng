import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
    constructor(
        private prisma: PrismaService,
        private config: ConfigService,
    ) { }

    // ─── PAYSTACK ─────────────────────────────────────────

    async paystackInitialize(userId: string, amount: number, email: string, description?: string) {
        const secretKey = this.config.get('PAYSTACK_SECRET_KEY');
        if (!secretKey) throw new HttpException('Paystack not configured', HttpStatus.SERVICE_UNAVAILABLE);

        const reference = `PSK_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        const res = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: amount * 100, // kobo
                email,
                reference,
                metadata: { userId, description },
            }),
        });
        const data = await res.json();
        if (!data.status) throw new HttpException(data.message || 'Paystack error', HttpStatus.BAD_REQUEST);

        // Record pending transaction
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user?.businessId) {
            await this.prisma.transaction.create({
                data: {
                    businessId: user.businessId,
                    type: 'CREDIT',
                    amount,
                    description: description || 'Paystack payment',
                    channel: 'Paystack',
                    status: 'PENDING',
                    reference,
                },
            });
        }

        return { reference, authorization_url: data.data.authorization_url, access_code: data.data.access_code };
    }

    async paystackVerify(reference: string) {
        const secretKey = this.config.get('PAYSTACK_SECRET_KEY');
        const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: { Authorization: `Bearer ${secretKey}` },
        });
        const data = await res.json();

        // Update transaction status
        const txn = await this.prisma.transaction.findFirst({ where: { reference } });
        if (txn) {
            await this.prisma.transaction.update({
                where: { id: txn.id },
                data: { status: data.data?.status === 'success' ? 'COMPLETED' : 'FAILED' },
            });
        }

        return { status: data.data?.status, amount: (data.data?.amount || 0) / 100, reference };
    }

    async paystackWebhook(body: any) {
        const reference = body.data?.reference;
        if (!reference) return;

        const status = body.data?.status === 'success' ? 'COMPLETED' : 'FAILED';
        const txn = await this.prisma.transaction.findFirst({ where: { reference } });
        if (txn) {
            await this.prisma.transaction.update({ where: { id: txn.id }, data: { status } });
        }
    }

    // ─── FLUTTERWAVE ──────────────────────────────────────

    async flutterwaveInitialize(userId: string, amount: number, email: string, description?: string) {
        const secretKey = this.config.get('FLUTTERWAVE_SECRET_KEY');
        if (!secretKey) throw new HttpException('Flutterwave not configured', HttpStatus.SERVICE_UNAVAILABLE);

        const txRef = `FLW_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        const res = await fetch('https://api.flutterwave.com/v3/payments', {
            method: 'POST',
            headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tx_ref: txRef,
                amount,
                currency: 'NGN',
                customer: { email },
                meta: { userId, description },
                customizations: { title: 'BizhubNg Payment', description: description || 'Business payment' },
            }),
        });
        const data = await res.json();
        if (data.status !== 'success') throw new HttpException(data.message || 'Flutterwave error', HttpStatus.BAD_REQUEST);

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user?.businessId) {
            await this.prisma.transaction.create({
                data: {
                    businessId: user.businessId,
                    type: 'CREDIT',
                    amount,
                    description: description || 'Flutterwave payment',
                    channel: 'Flutterwave',
                    status: 'PENDING',
                    reference: txRef,
                },
            });
        }

        return { reference: txRef, link: data.data?.link };
    }

    async flutterwaveVerify(transactionId: string) {
        const secretKey = this.config.get('FLUTTERWAVE_SECRET_KEY');
        const res = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
            headers: { Authorization: `Bearer ${secretKey}` },
        });
        const data = await res.json();
        return { status: data.data?.status, amount: data.data?.amount, reference: data.data?.tx_ref };
    }

    // ─── MONIEPOINT ───────────────────────────────────────

    async moniepointCreateVirtualAccount(userId: string, name: string, email: string) {
        // Moniepoint virtual account creation
        // In production, this would call the Moniepoint API
        const accountRef = `MNP_${Date.now()}`;

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user?.businessId) {
            await this.prisma.paymentIntegration.upsert({
                where: { businessId_provider: { businessId: user.businessId, provider: 'moniepoint' } },
                create: {
                    businessId: user.businessId,
                    provider: 'moniepoint',
                    connected: true,
                    publicKey: accountRef,
                },
                update: { connected: true, publicKey: accountRef },
            });
        }

        return {
            accountNumber: `99${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
            bankName: 'Moniepoint MFB',
            accountName: name,
            reference: accountRef,
        };
    }

    // ─── OPAY ─────────────────────────────────────────────

    async opayTransfer(userId: string, amount: number, bankCode: string, accountNumber: string, accountName?: string) {
        // OPay fast transfer
        const reference = `OPAY_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user?.businessId) {
            await this.prisma.transaction.create({
                data: {
                    businessId: user.businessId,
                    type: 'WITHDRAWAL',
                    amount,
                    description: `OPay transfer to ${accountName || accountNumber}`,
                    channel: 'OPay',
                    status: 'PENDING',
                    reference,
                },
            });
        }

        return { reference, status: 'PENDING', message: 'Transfer initiated' };
    }

    // ─── BANK LIST ────────────────────────────────────────

    async getBanks() {
        try {
            const secretKey = this.config.get('PAYSTACK_SECRET_KEY');
            if (secretKey) {
                const res = await fetch('https://api.paystack.co/bank?country=nigeria', {
                    headers: { Authorization: `Bearer ${secretKey}` },
                });
                const data = await res.json();
                return data.data || [];
            }
        } catch { }

        // Fallback bank list
        return [
            { code: '044', name: 'Access Bank' },
            { code: '023', name: 'Citibank' },
            { code: '063', name: 'Diamond Bank' },
            { code: '050', name: 'Ecobank' },
            { code: '070', name: 'Fidelity Bank' },
            { code: '011', name: 'First Bank' },
            { code: '214', name: 'FCMB' },
            { code: '058', name: 'GTBank' },
            { code: '030', name: 'Heritage Bank' },
            { code: '301', name: 'Jaiz Bank' },
            { code: '082', name: 'Keystone Bank' },
            { code: '526', name: 'OPay' },
            { code: '100', name: 'Palmpay' },
            { code: '076', name: 'Polaris Bank' },
            { code: '221', name: 'Stanbic IBTC' },
            { code: '068', name: 'Standard Chartered' },
            { code: '232', name: 'Sterling Bank' },
            { code: '100', name: 'Moniepoint' },
            { code: '032', name: 'Union Bank' },
            { code: '033', name: 'UBA' },
            { code: '215', name: 'Unity Bank' },
            { code: '035', name: 'Wema Bank' },
            { code: '057', name: 'Zenith Bank' },
        ];
    }
}
