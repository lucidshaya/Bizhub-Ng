import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../core/api_service.dart';

class PricingScreen extends StatefulWidget {
  const PricingScreen({super.key});

  @override
  State<PricingScreen> createState() => _PricingScreenState();
}

class _PricingScreenState extends State<PricingScreen> {
  String _activePlan = 'STARTER';
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      final data = await ApiService.getSettings();
      if (mounted) {
        setState(() {
          _activePlan = data['business']?['plan'] ?? 'STARTER';
        });
      }
    } catch (_) {}
  }

  Future<void> _upgrade(BuildContext context, String plan) async {
    final targetPlan = plan.toUpperCase();
    if (_activePlan == targetPlan) return;

    setState(() => _isLoading = true);
    try {
      await ApiService.upgradePlan(targetPlan);
      if (mounted) {
        setState(() {
          _activePlan = targetPlan;
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Paid from wallet! Upgraded to $plan plan.'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to upgrade: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Subscription Plans',
          style: TextStyle(
            color: AppTheme.textPrimary,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppTheme.textPrimary),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _buildPlanCard(
            context,
            'Starter',
            'For side hustles & solopreneurs',
            '₦5,000',
            [
              '1 User',
              'Dashboard Access',
              'Staff & Payroll',
              'Transactions',
              'No Communications',
              'No CCTV Live',
            ],
            false,
          ),
          const SizedBox(height: 20),
          _buildPlanCard(
            context,
            'Growth',
            'For growing small businesses',
            '₦15,000',
            [
              'Up to 50 Staff members',
              'Full Platform Access',
              'Communications',
              'CCTV Live',
              'Priority Support',
            ],
            true, // Highlighted
          ),
          const SizedBox(height: 20),
          _buildPlanCard(
            context,
            'Scale',
            'For established companies',
            '₦50,000',
            [
              'Unlimited Users',
              'Advanced Analytics',
              'Multi-branch Support',
              'Dedicated Account Manager',
              'API Access',
            ],
            false,
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildPlanCard(
    BuildContext context,
    String title,
    String subtitle,
    String price,
    List<String> features,
    bool isHighlighted,
  ) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isHighlighted ? AppTheme.accent : AppTheme.bgCard,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isHighlighted ? AppTheme.accent : AppTheme.border,
          width: isHighlighted ? 0 : 1,
        ),
        boxShadow: isHighlighted
            ? [
                BoxShadow(
                  color: AppTheme.accent.withOpacity(0.3),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ]
            : [],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (isHighlighted)
            Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.bgPrimary,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text(
                'MOST POPULAR',
                style: TextStyle(
                  color: AppTheme.accent,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1,
                ),
              ),
            ),
          Text(
            title,
            style: TextStyle(
              color: isHighlighted ? AppTheme.bgPrimary : AppTheme.textPrimary,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: TextStyle(
              color: isHighlighted
                  ? AppTheme.bgPrimary.withOpacity(0.8)
                  : AppTheme.textSecondary,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 24),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                price,
                style: TextStyle(
                  color: isHighlighted
                      ? AppTheme.bgPrimary
                      : AppTheme.textPrimary,
                  fontSize: 32,
                  fontWeight: FontWeight.w900,
                ),
              ),
              Text(
                '/month',
                style: TextStyle(
                  color: isHighlighted
                      ? AppTheme.bgPrimary.withOpacity(0.8)
                      : AppTheme.textMuted,
                  fontSize: 14,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          ...features.map(
            (f) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  Icon(
                    Icons.check_circle,
                    color: isHighlighted ? AppTheme.bgPrimary : AppTheme.accent,
                    size: 20,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      f,
                      style: TextStyle(
                        color: isHighlighted
                            ? AppTheme.bgPrimary
                            : AppTheme.textPrimary,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isLoading || title.toUpperCase() == _activePlan
                  ? null
                  : () => _upgrade(context, title),
              style: ElevatedButton.styleFrom(
                backgroundColor: isHighlighted
                    ? AppTheme.bgPrimary
                    : AppTheme.accent.withOpacity(0.1),
                foregroundColor: isHighlighted
                    ? AppTheme.accent
                    : AppTheme.accent,
                disabledBackgroundColor: AppTheme.border,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 0,
              ),
              child:
                  _isLoading &&
                      !(_activePlan ==
                          title.toUpperCase()) // basic loading indicator guess
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Text(
                      title.toUpperCase() == _activePlan
                          ? 'Current Plan'
                          : 'Select $title',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
