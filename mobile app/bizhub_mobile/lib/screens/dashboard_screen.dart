import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../core/api_service.dart';
import '../providers/auth_provider.dart';
import 'package:intl/intl.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic>? _summary;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final sum = await ApiService.getDashboardSummary();
      setState(() { _summary = sum; _loading = false; });
    } catch (_) {
      setState(() { _summary = {'balance': 0, 'totalRevenue': 0, 'totalExpenses': 0, 'staffCount': 0, 'activeStaff': 0, 'camerasOnline': 0, 'totalCameras': 0, 'unreadMessages': 0, 'recentTransactions': []}; _loading = false; });
    }
  }

  String _formatNaira(num v) => '₦${NumberFormat('#,###').format(v)}';

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final firstName = (auth.user?['fullName'] ?? 'Boss').toString().split(' ').first;

    return SafeArea(
      child: RefreshIndicator(
        color: AppTheme.accent,
        onRefresh: _load,
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.accent))
            : ListView(
                padding: const EdgeInsets.only(bottom: 24),
                children: [
                  // Header
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          const Text('Good morning 👋', style: TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                          Text(firstName, style: const TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.w700, fontSize: 16)),
                        ]),
                        Stack(
                          children: [
                            Container(
                              width: 36, height: 36,
                              decoration: BoxDecoration(color: AppTheme.bgCard, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
                              child: const Icon(Icons.notifications_outlined, size: 18, color: AppTheme.textSecondary),
                            ),
                            Positioned(top: 4, right: 4, child: Container(width: 8, height: 8, decoration: const BoxDecoration(color: AppTheme.red, shape: BoxShape.circle))),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Balance Card
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16),
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: [AppTheme.accentDarker, AppTheme.accent], begin: Alignment.topLeft, end: Alignment.bottomRight),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Total Balance', style: TextStyle(color: Color(0xAAFFFFFF), fontSize: 12, fontWeight: FontWeight.w500)),
                        const SizedBox(height: 4),
                        Text(_formatNaira(_summary?['balance'] ?? 0), style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w800)),
                        const SizedBox(height: 16),
                        Row(children: [
                          Expanded(child: _balanceBtn('Fund Account')),
                          const SizedBox(width: 12),
                          Expanded(child: _balanceBtn('Withdraw')),
                        ]),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Quick Stats
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(children: [
                      _statCard('Staff', '${_summary?['activeStaff'] ?? 0}', Icons.people_rounded, AppTheme.blue),
                      const SizedBox(width: 12),
                      _statCard('Revenue', _formatNaira(_summary?['totalRevenue'] ?? 0), Icons.trending_up_rounded, AppTheme.yellow),
                    ]),
                  ),
                  const SizedBox(height: 12),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(children: [
                      _statCard('Cameras', '${_summary?['camerasOnline'] ?? 0} Live', Icons.videocam_rounded, AppTheme.accent),
                      const SizedBox(width: 12),
                      _statCard('Messages', '${_summary?['unreadMessages'] ?? 0} New', Icons.message_rounded, AppTheme.purple),
                    ]),
                  ),
                  const SizedBox(height: 20),

                  // Quick Actions
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: const Text('Quick Actions', style: TextStyle(color: AppTheme.textSecondary, fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 1)),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 80,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      children: [
                        _actionBtn('Pay Workers', Icons.people_rounded, AppTheme.accent),
                        _actionBtn('CCTV', Icons.videocam_rounded, AppTheme.blue),
                        _actionBtn('Chat', Icons.message_rounded, AppTheme.purple),
                        _actionBtn('Reports', Icons.description_rounded, AppTheme.yellow),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Recent Transactions
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      const Text('Recent Transactions', style: TextStyle(color: AppTheme.textSecondary, fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 1)),
                      TextButton(onPressed: () {}, child: const Text('View All', style: TextStyle(color: AppTheme.accent, fontSize: 12))),
                    ]),
                  ),
                  ...(_summary?['recentTransactions'] as List? ?? []).take(4).map((tx) => _txnTile(tx)),
                  if ((_summary?['recentTransactions'] as List?)?.isEmpty ?? true)
                    Padding(
                      padding: const EdgeInsets.all(32),
                      child: Column(children: [
                        Icon(Icons.receipt_long, size: 40, color: AppTheme.textMuted),
                        const SizedBox(height: 8),
                        const Text('No transactions yet', style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                      ]),
                    ),
                ],
              ),
      ),
    );
  }

  Widget _balanceBtn(String text) => Container(
    padding: const EdgeInsets.symmetric(vertical: 10),
    decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(12)),
    child: Center(child: Text(text, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600))),
  );

  Widget _statCard(String label, String value, IconData icon, Color color) => Expanded(
    child: Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: AppTheme.bgCard, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
      child: Row(children: [
        Container(width: 36, height: 36, decoration: BoxDecoration(color: color.withOpacity(0.15), borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, size: 16, color: color)),
        const SizedBox(width: 10),
        Flexible(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(value, style: const TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.w700, fontSize: 14), overflow: TextOverflow.ellipsis),
          Text(label, style: const TextStyle(color: AppTheme.textMuted, fontSize: 11)),
        ])),
      ]),
    ),
  );

  Widget _actionBtn(String label, IconData icon, Color color) => Padding(
    padding: const EdgeInsets.only(right: 12),
    child: Column(children: [
      Container(width: 48, height: 48, decoration: BoxDecoration(color: color.withOpacity(0.15), borderRadius: BorderRadius.circular(16), border: Border.all(color: color.withOpacity(0.2))),
        child: Icon(icon, size: 22, color: color)),
      const SizedBox(height: 6),
      Text(label, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11)),
    ]),
  );

  Widget _txnTile(Map<String, dynamic> tx) {
    final isCredit = tx['type'] == 'CREDIT';
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: AppTheme.bgCard, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
      child: Row(children: [
        Container(width: 36, height: 36, decoration: BoxDecoration(color: (isCredit ? AppTheme.accent : AppTheme.red).withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
          child: Icon(isCredit ? Icons.arrow_downward : Icons.arrow_upward, size: 16, color: isCredit ? AppTheme.accent : AppTheme.red)),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(tx['description'] ?? '', style: const TextStyle(color: AppTheme.textPrimary, fontSize: 12, fontWeight: FontWeight.w500), overflow: TextOverflow.ellipsis),
          const SizedBox(height: 2),
          Text(tx['date'] != null ? DateFormat('MMM d').format(DateTime.parse(tx['date'])) : '', style: const TextStyle(color: AppTheme.textMuted, fontSize: 11)),
        ])),
        Text('${isCredit ? '+' : '-'}${_formatNaira(tx['amount'] ?? 0)}', style: TextStyle(color: isCredit ? AppTheme.accent : AppTheme.red, fontWeight: FontWeight.w700, fontSize: 12)),
      ]),
    );
  }
}
