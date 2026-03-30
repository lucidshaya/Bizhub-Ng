import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../providers/auth_provider.dart';
import 'chat_screen.dart';
import 'invoice_screen.dart';
import 'pricing_screen.dart';
import '../core/api_service.dart';

class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    final name = user?['fullName'] ?? 'User';
    final email = user?['email'] ?? '';
    final initials = name
        .toString()
        .split(' ')
        .take(2)
        .map((w) => w.isNotEmpty ? w[0] : '')
        .join()
        .toUpperCase();

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const SizedBox(height: 8),

          // Profile card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.bgCard,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.border),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: AppTheme.accent.withOpacity(0.15),
                  child: Text(
                    initials,
                    style: const TextStyle(
                      color: AppTheme.accent,
                      fontWeight: FontWeight.w700,
                      fontSize: 18,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: const TextStyle(
                          color: AppTheme.textPrimary,
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        email,
                        style: const TextStyle(
                          color: AppTheme.textSecondary,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, color: AppTheme.textMuted),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Menu items
          const Text(
            'FEATURES',
            style: TextStyle(
              color: AppTheme.textMuted,
              fontSize: 11,
              fontWeight: FontWeight.w600,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 12),

          _menuItem(
            context,
            Icons.chat_bubble_outline,
            'Chat & Messages',
            AppTheme.purple,
            () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ChatScreen()),
              );
            },
          ),
          _menuItem(
            context,
            Icons.receipt_long_outlined,
            'Generate Invoice',
            AppTheme.yellow,
            () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const InvoiceScreen()),
              );
            },
          ),
          _menuItem(
            context,
            Icons.analytics_outlined,
            'Reports',
            AppTheme.blue,
            () => _showReportDialog(context),
          ),
          _menuItem(
            context,
            Icons.inventory_2_outlined,
            'Inventory',
            AppTheme.cyan,
            () {},
          ),

          const SizedBox(height: 20),
          const Text(
            'SETTINGS',
            style: TextStyle(
              color: AppTheme.textMuted,
              fontSize: 11,
              fontWeight: FontWeight.w600,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 12),

          _menuItem(
            context,
            Icons.person_outline,
            'Profile Settings',
            AppTheme.accent,
            () {},
          ),
          _menuItem(
            context,
            Icons.business_outlined,
            'Business Settings',
            AppTheme.blue,
            () {},
          ),
          _menuItem(
            context,
            Icons.credit_card_outlined,
            'Payment Integrations',
            AppTheme.yellow,
            () {},
          ),
          _menuItem(
            context,
            Icons.shield_outlined,
            'Security',
            AppTheme.purple,
            () => _showSecurityDialog(context),
          ),
          _menuItem(
            context,
            Icons.workspace_premium,
            'Upgrade Plan',
            AppTheme.orange,
            () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const PricingScreen()),
              );
            },
          ),

          const SizedBox(height: 20),
          const Text(
            'ACCOUNT',
            style: TextStyle(
              color: AppTheme.textMuted,
              fontSize: 11,
              fontWeight: FontWeight.w600,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 12),

          _menuItem(
            context,
            Icons.help_outline,
            'Help & Support',
            AppTheme.textSecondary,
            () => _showReportDialog(context),
          ),
          _menuItem(
            context,
            Icons.info_outline,
            'About BizhubNg',
            AppTheme.textSecondary,
            () {},
          ),

          const SizedBox(height: 12),
          Container(
            decoration: BoxDecoration(
              color: AppTheme.bgCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.border),
            ),
            child: ListTile(
              onTap: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    backgroundColor: AppTheme.bgCard,
                    title: const Text(
                      'Sign Out?',
                      style: TextStyle(color: AppTheme.textPrimary),
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(ctx, false),
                        child: const Text('Cancel'),
                      ),
                      ElevatedButton(
                        onPressed: () => Navigator.pop(ctx, true),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.red,
                        ),
                        child: const Text('Sign Out'),
                      ),
                    ],
                  ),
                );
                if (confirm == true && context.mounted) {
                  await context.read<AuthProvider>().logout();
                  Navigator.pushNamedAndRemoveUntil(
                    context,
                    '/login',
                    (_) => false,
                  );
                }
              },
              leading: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppTheme.red.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.logout, size: 18, color: AppTheme.red),
              ),
              title: const Text(
                'Sign Out',
                style: TextStyle(
                  color: AppTheme.red,
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
              trailing: const Icon(
                Icons.chevron_right,
                color: AppTheme.red,
                size: 18,
              ),
              dense: true,
              contentPadding: const EdgeInsets.symmetric(horizontal: 12),
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'BizhubNg v1.0.0',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppTheme.textMuted, fontSize: 11),
          ),
        ],
      ),
    );
  }

  Widget _menuItem(
    BuildContext context,
    IconData icon,
    String label,
    Color color,
    VoidCallback onTap,
  ) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Container(
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: ListTile(
        onTap: onTap,
        leading: Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, size: 18, color: color),
        ),
        title: Text(
          label,
          style: const TextStyle(
            color: AppTheme.textPrimary,
            fontWeight: FontWeight.w500,
            fontSize: 14,
          ),
        ),
        trailing: const Icon(
          Icons.chevron_right,
          color: AppTheme.textMuted,
          size: 18,
        ),
        dense: true,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12),
      ),
    ),
  );

  void _showSecurityDialog(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.bgCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Security Settings',
                style: TextStyle(
                  color: AppTheme.textPrimary,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 24),
              ListTile(
                leading: const Icon(Icons.pin, color: AppTheme.textPrimary),
                title: const Text(
                  'Change Transaction PIN',
                  style: TextStyle(color: AppTheme.textPrimary),
                ),
                trailing: const Icon(
                  Icons.chevron_right,
                  color: AppTheme.textMuted,
                ),
                onTap: () {
                  Navigator.pop(ctx);
                  // Mock PIN change dialog
                  showDialog(
                    context: context,
                    builder: (c) => AlertDialog(
                      backgroundColor: AppTheme.bgCard,
                      title: const Text(
                        'Change PIN',
                        style: TextStyle(color: AppTheme.textPrimary),
                      ),
                      content: const TextField(
                        keyboardType: TextInputType.number,
                        maxLength: 4,
                        decoration: InputDecoration(
                          hintText: 'Enter new 4 digit PIN',
                          hintStyle: TextStyle(color: AppTheme.textMuted),
                        ),
                        style: TextStyle(color: AppTheme.textPrimary),
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(c),
                          child: const Text('Cancel'),
                        ),
                        ElevatedButton(
                          onPressed: () {
                            Navigator.pop(c);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('PIN updated successfully'),
                              ),
                            );
                          },
                          child: const Text('Save'),
                        ),
                      ],
                    ),
                  );
                },
              ),
              const Divider(color: AppTheme.border),
              ListTile(
                leading: const Icon(
                  Icons.security,
                  color: AppTheme.textPrimary,
                ),
                title: const Text(
                  'Two-Factor Authentication',
                  style: TextStyle(color: AppTheme.textPrimary),
                ),
                trailing: const Icon(
                  Icons.chevron_right,
                  color: AppTheme.textMuted,
                ),
                onTap: () {
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('2-Factor Authentication is coming soon!'),
                    ),
                  );
                },
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  void _showReportDialog(BuildContext context) {
    final subjectController = TextEditingController();
    final messageController = TextEditingController();
    bool submitting = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          backgroundColor: AppTheme.bgCard,
          title: const Text(
            'Submit a Report',
            style: TextStyle(color: AppTheme.textPrimary, fontSize: 18),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: subjectController,
                style: const TextStyle(color: AppTheme.textPrimary),
                decoration: const InputDecoration(
                  labelText: 'Subject',
                  labelStyle: TextStyle(color: AppTheme.textMuted),
                  hintText: 'e.g. Login issues',
                  hintStyle: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: messageController,
                maxLines: 4,
                style: const TextStyle(color: AppTheme.textPrimary),
                decoration: const InputDecoration(
                  labelText: 'Message',
                  labelStyle: TextStyle(color: AppTheme.textMuted),
                  hintText: 'Describe your issue...',
                  hintStyle: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed:
                  submitting ||
                      subjectController.text.isEmpty ||
                      messageController.text.isEmpty
                  ? null
                  : () async {
                      setState(() => submitting = true);
                      try {
                        final auth = context.read<AuthProvider>();
                        await ApiService.submitSupportTicket({
                          'userEmail':
                              auth.user?['email'] ?? 'unknown@user.com',
                          'subject': subjectController.text,
                          'message': messageController.text,
                        });
                        if (context.mounted) {
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Report submitted successfully'),
                              backgroundColor: AppTheme.accent,
                            ),
                          );
                        }
                      } catch (e) {
                        if (context.mounted) {
                          setState(() => submitting = false);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Error: ${e.toString()}'),
                              backgroundColor: AppTheme.red,
                            ),
                          );
                        }
                      }
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.accent,
                foregroundColor: Colors.white,
              ),
              child: submitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text('Submit'),
            ),
          ],
        ),
      ),
    );
  }
}
