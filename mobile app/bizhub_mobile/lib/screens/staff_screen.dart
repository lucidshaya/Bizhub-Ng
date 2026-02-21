import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../core/api_service.dart';
import 'package:intl/intl.dart';

class StaffScreen extends StatefulWidget {
  const StaffScreen({super.key});
  @override
  State<StaffScreen> createState() => _StaffScreenState();
}

class _StaffScreenState extends State<StaffScreen> {
  List<dynamic> _staff = [];
  bool _loading = true;
  String _search = '';

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final data = await ApiService.getStaff();
      setState(() { _staff = data; _loading = false; });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  String _fmt(num v) => '₦${NumberFormat('#,###').format(v)}';

  List<dynamic> get _filtered => _staff.where((s) {
    final q = _search.toLowerCase();
    return (s['name'] ?? '').toString().toLowerCase().contains(q) ||
           (s['role'] ?? '').toString().toLowerCase().contains(q);
  }).toList();

  Color _statusColor(String s) {
    if (s == 'ACTIVE') return AppTheme.accent;
    if (s == 'ON_LEAVE') return AppTheme.yellow;
    return AppTheme.red;
  }

  Color _avatarColor(int i) {
    const colors = [AppTheme.accent, AppTheme.blue, AppTheme.purple, AppTheme.yellow, AppTheme.red, AppTheme.cyan, AppTheme.pink, AppTheme.orange];
    return colors[i % colors.length];
  }

  Future<void> _payStaff(Map<String, dynamic> s) async {
    final confirm = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(
      backgroundColor: AppTheme.bgCard,
      title: Text('Pay ${s['name']}?', style: const TextStyle(color: AppTheme.textPrimary, fontSize: 16)),
      content: Text('Amount: ${_fmt(s['monthlySalary'] ?? 0)}', style: const TextStyle(color: AppTheme.textSecondary)),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
        ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Pay')),
      ],
    ));
    if (confirm != true) return;
    try {
      await ApiService.payStaff(s['id'], (s['monthlySalary'] ?? 0).toDouble());
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Paid ${s['name']}!'), backgroundColor: AppTheme.accent));
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Payment failed'), backgroundColor: AppTheme.red));
    }
  }

  Future<void> _payAll() async {
    final total = _staff.where((s) => s['status'] == 'ACTIVE').fold<num>(0, (sum, s) => sum + (s['monthlySalary'] ?? 0));
    final activeCount = _staff.where((s) => s['status'] == 'ACTIVE').length;

    final confirm = await showModalBottomSheet<bool>(context: context, backgroundColor: AppTheme.bgCard, shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(padding: const EdgeInsets.all(24), child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(width: 40, height: 4, decoration: BoxDecoration(color: AppTheme.borderHover, borderRadius: BorderRadius.circular(2))),
        const SizedBox(height: 20),
        const Text('Confirm Bulk Payroll', style: TextStyle(color: AppTheme.textPrimary, fontSize: 18, fontWeight: FontWeight.w700)),
        const SizedBox(height: 20),
        Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: AppTheme.bgPrimary, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppTheme.border)),
          child: Column(children: [
            _payRow('Workers', '$activeCount'),
            const SizedBox(height: 8),
            _payRow('Total Amount', _fmt(total), bold: true, color: AppTheme.yellow),
            const SizedBox(height: 8),
            _payRow('Via', 'Paystack Bulk'),
          ])),
        const SizedBox(height: 20),
        Row(children: [
          Expanded(child: SizedBox(height: 48, child: OutlinedButton(onPressed: () => Navigator.pop(ctx, false), style: OutlinedButton.styleFrom(side: const BorderSide(color: AppTheme.border), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))), child: const Text('Cancel', style: TextStyle(color: AppTheme.textPrimary))))),
          const SizedBox(width: 12),
          Expanded(child: SizedBox(height: 48, child: ElevatedButton(onPressed: () => Navigator.pop(ctx, true), style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))), child: const Text('Confirm & Pay')))),
        ]),
        const SizedBox(height: 16),
      ])),
    );
    if (confirm != true) return;
    try {
      final result = await ApiService.payAll(reason: 'Monthly salary');
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Paid ${result['staffCount']} staff!'), backgroundColor: AppTheme.accent));
    } catch (_) {}
  }

  Widget _payRow(String l, String r, {bool bold = false, Color? color}) => Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
    Text(l, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 14)),
    Text(r, style: TextStyle(color: color ?? AppTheme.textPrimary, fontWeight: bold ? FontWeight.w700 : FontWeight.w500, fontSize: bold ? 16 : 14)),
  ]);

  @override
  Widget build(BuildContext context) {
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
                    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      const Text('Staff & Payroll', style: TextStyle(color: AppTheme.textPrimary, fontSize: 18, fontWeight: FontWeight.w700)),
                      GestureDetector(
                        onTap: () {/* TODO: navigate to add staff */},
                        child: Container(width: 32, height: 32, decoration: BoxDecoration(color: AppTheme.accent, borderRadius: BorderRadius.circular(10)),
                          child: const Icon(Icons.add, size: 18, color: AppTheme.bgPrimary)),
                      ),
                    ]),
                  ),

                  // Pay All Button
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: GestureDetector(
                      onTap: _payAll,
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        decoration: BoxDecoration(gradient: const LinearGradient(colors: [AppTheme.yellow, Color(0xFFD97706)]), borderRadius: BorderRadius.circular(16)),
                        child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                          const Icon(Icons.attach_money, size: 20, color: AppTheme.bgPrimary),
                          const SizedBox(width: 8),
                          Text('Pay All Workers — ${_fmt(_staff.where((s) => s['status'] == 'ACTIVE').fold<num>(0, (sum, s) => sum + (s['monthlySalary'] ?? 0)))}',
                            style: const TextStyle(color: AppTheme.bgPrimary, fontWeight: FontWeight.w700, fontSize: 14)),
                        ]),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Search
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: TextField(
                      onChanged: (v) => setState(() => _search = v),
                      style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14),
                      decoration: const InputDecoration(hintText: 'Search staff...', prefixIcon: Icon(Icons.search, size: 18, color: AppTheme.textMuted), isDense: true, contentPadding: EdgeInsets.symmetric(vertical: 12)),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Staff List
                  ..._filtered.asMap().entries.map((e) {
                    final i = e.key;
                    final s = e.value as Map<String, dynamic>;
                    final initials = (s['name'] ?? '??').toString().split(' ').take(2).map((w) => w.isNotEmpty ? w[0] : '').join().toUpperCase();
                    final color = _avatarColor(i);
                    return Container(
                      margin: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: AppTheme.bgCard, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
                      child: Row(children: [
                        CircleAvatar(radius: 20, backgroundColor: color.withOpacity(0.2), child: Text(initials, style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 12))),
                        const SizedBox(width: 12),
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(s['name'] ?? '', style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13, fontWeight: FontWeight.w500)),
                          Text(s['role'] ?? '', style: const TextStyle(color: AppTheme.textMuted, fontSize: 11)),
                        ])),
                        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                          Text(_fmt(s['monthlySalary'] ?? 0), style: const TextStyle(color: AppTheme.textPrimary, fontSize: 12, fontWeight: FontWeight.w600)),
                          Text((s['status'] ?? '').toString().replaceAll('_', ' '), style: TextStyle(color: _statusColor(s['status'] ?? ''), fontSize: 11)),
                        ]),
                        const SizedBox(width: 8),
                        GestureDetector(
                          onTap: () => _payStaff(s),
                          child: Container(width: 28, height: 28, decoration: BoxDecoration(color: AppTheme.accent.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                            child: const Icon(Icons.attach_money, size: 14, color: AppTheme.accent)),
                        ),
                      ]),
                    );
                  }),

                  if (_filtered.isEmpty && !_loading)
                    Padding(padding: const EdgeInsets.all(32), child: Column(children: [
                      Icon(Icons.people_outline, size: 40, color: AppTheme.textMuted),
                      const SizedBox(height: 8),
                      const Text('No staff members', style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                    ])),
                ],
              ),
      ),
    );
  }
}
