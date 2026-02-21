import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../providers/auth_provider.dart';
import 'dashboard_screen.dart';
import 'staff_screen.dart';
import 'transactions_screen.dart';
import 'cctv_screen.dart';
import 'more_screen.dart';

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

  List<BottomNavigationBarItem> _buildItems(String role, String bizType) {
    if (role == 'WORKER') {
      if (bizType == 'Corporate/Workplace') {
        return const [
          BottomNavigationBarItem(
            icon: Icon(Icons.more_horiz_rounded),
            label: 'More',
          ),
        ];
      } else {
        return const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_rounded),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.videocam_rounded),
            label: 'CCTV',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.more_horiz_rounded),
            label: 'More',
          ),
        ];
      }
    }
    return const [
      BottomNavigationBarItem(
        icon: Icon(Icons.dashboard_rounded),
        label: 'Home',
      ),
      BottomNavigationBarItem(icon: Icon(Icons.people_rounded), label: 'Staff'),
      BottomNavigationBarItem(
        icon: Icon(Icons.credit_card_rounded),
        label: 'Pay',
      ),
      BottomNavigationBarItem(
        icon: Icon(Icons.videocam_rounded),
        label: 'CCTV',
      ),
      BottomNavigationBarItem(
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

    final screens = _buildScreens(role, bizType);
    final items = _buildItems(role, bizType);

    // Safeguard index if role changes dynamically
    if (_currentIndex >= screens.length) {
      _currentIndex = 0;
    }

    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: screens),
      bottomNavigationBar: items.length > 1
          ? Container(
              decoration: const BoxDecoration(
                border: Border(
                  top: BorderSide(color: AppTheme.border, width: 1),
                ),
              ),
              child: BottomNavigationBar(
                currentIndex: _currentIndex,
                onTap: (i) => setState(() => _currentIndex = i),
                items: items,
              ),
            )
          : null,
    );
  }
}
