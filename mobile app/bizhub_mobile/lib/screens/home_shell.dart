import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../providers/auth_provider.dart';
import 'dashboard_screen.dart';
import 'staff_screen.dart';
import 'transactions_screen.dart';
import 'cctv_screen.dart';
import 'more_screen.dart';
import '../core/api_service.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});
  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _currentIndex = 0;

  List<Widget> _buildScreens(String role, String bizType) {
    if (role == 'WORKER') {
      if (bizType == 'Corporate/Workplace') {
        return const [MoreScreen()];
      } else {
        return const [DashboardScreen(), CctvScreen(), MoreScreen()];
      }
    }
    return const [
      DashboardScreen(),
      StaffScreen(),
      TransactionsScreen(),
      CctvScreen(),
      MoreScreen(),
    ];
  }

  List<BottomNavigationBarItem> _buildItems(
    String role,
    String bizType,
    String plan,
  ) {
    if (role == 'WORKER') {
      if (bizType == 'Corporate/Workplace') {
        return const [
          BottomNavigationBarItem(
            icon: Icon(Icons.more_horiz_rounded),
            label: 'More',
          ),
        ];
      } else {
        return [
          const BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_rounded),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.videocam_rounded),
            label: plan == 'STARTER' || plan == 'BASIC' ? 'CCTV 🔒' : 'CCTV',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.more_horiz_rounded),
            label: 'More',
          ),
        ];
      }
    }
    return [
      const BottomNavigationBarItem(
        icon: Icon(Icons.dashboard_rounded),
        label: 'Home',
      ),
      const BottomNavigationBarItem(
        icon: Icon(Icons.people_rounded),
        label: 'Staff',
      ),
      const BottomNavigationBarItem(
        icon: Icon(Icons.credit_card_rounded),
        label: 'Pay',
      ),
      BottomNavigationBarItem(
        icon: const Icon(Icons.videocam_rounded),
        label: plan == 'STARTER' || plan == 'BASIC' ? 'CCTV 🔒' : 'CCTV',
      ),
      const BottomNavigationBarItem(
        icon: Icon(Icons.more_horiz_rounded),
        label: 'More',
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final role = auth.user?['role'] ?? 'VIEWER';
    final bizType = auth.user?['businessType'] ?? '';
    final plan = auth.user?['business']?['plan'] ?? 'STARTER';

    final screens = _buildScreens(role, bizType);
    final items = _buildItems(role, bizType, plan);

    if (_currentIndex >= screens.length) {
      _currentIndex = 0;
    }

    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: screens),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showReportDialog(context),
        backgroundColor: AppTheme.accent,
        child: const Icon(Icons.message_rounded, color: Colors.white),
      ),
      bottomNavigationBar: items.length > 1
          ? Container(
              decoration: const BoxDecoration(
                border: Border(
                  top: BorderSide(color: AppTheme.border, width: 1),
                ),
              ),
              child: BottomNavigationBar(
                currentIndex: _currentIndex,
                onTap: (i) {
                  final isCCTV =
                      (role == 'WORKER' &&
                          bizType != 'Corporate/Workplace' &&
                          i == 1) ||
                      (role != 'WORKER' && i == 3);
                  if (isCCTV && (plan == 'STARTER' || plan == 'BASIC')) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text(
                          'Please upgrade your plan to access this feature',
                        ),
                      ),
                    );
                    return;
                  }
                  setState(() => _currentIndex = i);
                },
                items: items,
              ),
            )
          : null,
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
