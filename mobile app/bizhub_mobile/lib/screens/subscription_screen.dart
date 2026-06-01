import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/theme.dart';
import '../core/api_service.dart';
import '../providers/auth_provider.dart';

class SubscriptionScreen extends StatefulWidget {
  const SubscriptionScreen({super.key});

  @override
  State<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends State<SubscriptionScreen> {
  bool _isYearly = false;
  bool _isLoading = false;
  String _selectedPlan = '';

  Future<void> _handleSelectPlan(String plan) async {
    setState(() {
      _selectedPlan = plan;
      _isLoading = true;
    });

    try {
      final res = await ApiService.upgradePlanPaystack(plan, _isYearly);
      final url = res['authorization_url'];
      if (url != null) {
        final uri = Uri.parse(url);
        if (await canLaunchUrl(uri)) {
          // Open Paystack URL in External Browser or WebView
          await launchUrl(uri, mode: LaunchMode.externalApplication);
          // Wait for a return, user will have to refresh profile manually or we can auto refresh.
          Future.delayed(const Duration(seconds: 15), () async {
             await context.read<AuthProvider>().tryAutoLogin();
          });
        }
      } else {
        // Fallback if no URL (success immediately on backend)
        await context.read<AuthProvider>().tryAutoLogin();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppTheme.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      appBar: AppBar(
        title: const Text('Choose your Business Plan'),
        centerTitle: true,
        backgroundColor: AppTheme.bgCard,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const Text(
              'Setup your Corporate workspace. Select a plan below to continue.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppTheme.textMuted, fontSize: 16),
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Monthly',
                  style: TextStyle(
                    color: !_isYearly ? AppTheme.textPrimary : AppTheme.textMuted,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Switch(
                  value: _isYearly,
                  onChanged: (val) => setState(() => _isYearly = val),
                  activeColor: AppTheme.accent,
                ),
                Text(
                  'Yearly',
                  style: TextStyle(
                    color: _isYearly ? AppTheme.textPrimary : AppTheme.textMuted,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),
            _buildPlanCard(
              title: 'Growth',
              subtitle: 'For growing corporate businesses',
              priceStr: _isYearly ? '₦150k' : '₦15,000',
              period: _isYearly ? '/year' : '/month',
              features: [
                'Up to 50 Staff members',
                'Full Platform Access',
                'Communications',
                'CCTV Live',
                'Priority Support'
              ],
              planType: 'GROWTH',
              isPremium: false,
            ),
            const SizedBox(height: 24),
            _buildPlanCard(
              title: 'Scale',
              subtitle: 'For established companies',
              priceStr: _isYearly ? '₦500k' : '₦50,000',
              period: _isYearly ? '/year' : '/month',
              features: [
                'Unlimited Users',
                'Advanced Analytics',
                'Multi-branch Support',
                'Dedicated Account Manager',
                'API Access'
              ],
              planType: 'SCALE',
              isPremium: true,
            ),
            const SizedBox(height: 24),
            TextButton(
              onPressed: () async {
                 await context.read<AuthProvider>().tryAutoLogin();
              },
              child: const Text('I already paid. Refresh Status', style: TextStyle(color: AppTheme.accent)),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildPlanCard({
    required String title,
    required String subtitle,
    required String priceStr,
    required String period,
    required List<String> features,
    required String planType,
    required bool isPremium,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        gradient: isPremium
            ? const LinearGradient(
                colors: [Color(0xFF1a2536), AppTheme.bgCard],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              )
            : null,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isPremium ? AppTheme.accent.withOpacity(0.5) : AppTheme.border,
          width: isPremium ? 2 : 1,
        ),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (isPremium)
            Align(
              alignment: Alignment.center,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: AppTheme.accent,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  'PREMIUM',
                  style: TextStyle(
                      color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          Text(
            title,
            style: const TextStyle(
                color: AppTheme.textPrimary,
                fontSize: 24,
                fontWeight: FontWeight.bold),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: const TextStyle(color: AppTheme.textMuted, fontSize: 14),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                priceStr,
                style: const TextStyle(
                    color: AppTheme.textPrimary,
                    fontSize: 36,
                    fontWeight: FontWeight.bold),
              ),
              Text(
                period,
                style: const TextStyle(color: AppTheme.textMuted, fontSize: 16),
              ),
            ],
          ),
          const SizedBox(height: 24),
          ...features.map((f) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle, color: AppTheme.accent, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        f,
                        style: const TextStyle(color: AppTheme.textPrimary),
                      ),
                    ),
                  ],
                ),
              )),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed:
                _isLoading ? null : () => _handleSelectPlan(planType),
            style: ElevatedButton.styleFrom(
              backgroundColor: isPremium ? AppTheme.bgCard : AppTheme.accent,
              foregroundColor: isPremium ? AppTheme.textPrimary : Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: _isLoading && _selectedPlan == planType
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(color: Colors.white),
                  )
                : Text('Select $title', style: const TextStyle(fontWeight: FontWeight.bold)),
          )
        ],
      ),
    );
  }
}
