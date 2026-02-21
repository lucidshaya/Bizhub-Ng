import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../core/api_service.dart';
import 'package:intl/intl.dart';

class TransactionsScreen extends StatefulWidget {
  const TransactionsScreen({super.key});
  @override
  State<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends State<TransactionsScreen> {
  // PIN gate
  bool _unlocked = false;
  String _pin = '';
  static const _correctPin = '1234';

  List<dynamic> _txns = [];
  Map<String, dynamic>? _summary;
  bool _loading = true;
  String _typeFilter = '';
  int _page = 1;
  int _totalPages = 1;

  @override
  void initState() { super.initState(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final params = <String, String>{'page': _page.toString(), 'limit': '20'};
      if (_typeFilter.isNotEmpty) params['type'] = _typeFilter;

      final results = await Future.wait([
        ApiService.getTransactions(page: _page, limit: 20, type: _typeFilter.isNotEmpty ? _typeFilter : null),
        ApiService.getTransactionsSummary(),
      ]);
      setState(() {
        final txnData = results[0] as Map<String, dynamic>;
        _txns = txnData['data'] ?? [];
        _totalPages = txnData['totalPages'] ?? 1;
        _summary = results[1] as Map<String, dynamic>;
        _loading = false;
      });
    } catch (_) { setState(() => _loading = false); }
  }

  String _fmt(num v) => '₦${NumberFormat('#,###').format(v)}';

  void _enterPin(String digit) {
    final np = _pin + digit;
    setState(() => _pin = np);
    if (np.length >= 4) {
      if (np == _correctPin) {
        setState(() => _unlocked = true);
        _load();
      } else {
        setState(() => _pin = '');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_unlocked) return _pinView();
    return SafeArea(child: RefreshIndicator(color: AppTheme.accent, onRefresh: _load, child: _loading
        ? const Center(child: CircularProgressIndicator(color: AppTheme.accent))
        : ListView(padding: const EdgeInsets.only(bottom: 24), children: [
            const SizedBox(height: 16),
            // Summary cards
            if (_summary != null) Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(children: [
                _summaryCard('Balance', _fmt(_summary!['balance'] ?? 0), AppTheme.textPrimary),
                const SizedBox(width: 8),
                _summaryCard('Credits', _fmt(_summary!['totalCredits'] ?? 0), AppTheme.accent),
              ]),
            ),
            if (_summary != null) Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              child: Row(children: [
                _summaryCard('Debits', _fmt(_summary!['totalDebits'] ?? 0), AppTheme.red),
                const SizedBox(width: 8),
                _summaryCard('Total', '${_summary!['totalTransactions'] ?? 0}', AppTheme.textPrimary),
              ]),
            ),
            const SizedBox(height: 16),

            // Filter
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: SizedBox(height: 36, child: ListView(scrollDirection: Axis.horizontal, children: [
                _filterChip('All', ''),
                _filterChip('Credit', 'CREDIT'),
                _filterChip('Debit', 'DEBIT'),
                _filterChip('Payroll', 'PAYROLL'),
              ])),
            ),
            const SizedBox(height: 12),

            // List
            ..._txns.map((tx) => _txnTile(tx as Map<String, dynamic>)),
            if (_txns.isEmpty) Padding(padding: const EdgeInsets.all(40), child: Column(children: [
              Icon(Icons.receipt_long_rounded, size: 40, color: AppTheme.textMuted),
              const SizedBox(height: 8),
              const Text('No transactions found', style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
            ])),

            // Pagination
            if (_totalPages > 1) Padding(
              padding: const EdgeInsets.all(16),
              child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('Page $_page of $_totalPages', style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                Row(children: [
                  IconButton(onPressed: _page > 1 ? () { setState(() => _page--); _load(); } : null, icon: const Icon(Icons.chevron_left, color: AppTheme.textPrimary)),
                  IconButton(onPressed: _page < _totalPages ? () { setState(() => _page++); _load(); } : null, icon: const Icon(Icons.chevron_right, color: AppTheme.textPrimary)),
                ]),
              ]),
            ),
          ])));
  }

  Widget _summaryCard(String label, String value, Color color) => Expanded(
    child: Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: AppTheme.bgCard, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11)),
        const SizedBox(height: 4),
        Text(value, style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 16), overflow: TextOverflow.ellipsis),
      ])),
  );

  Widget _filterChip(String label, String value) {
    final selected = _typeFilter == value;
    return Padding(padding: const EdgeInsets.only(right: 8), child: GestureDetector(
      onTap: () { setState(() { _typeFilter = value; _page = 1; }); _load(); },
      child: Container(padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(color: selected ? AppTheme.accent.withOpacity(0.15) : AppTheme.bgCard, borderRadius: BorderRadius.circular(20), border: Border.all(color: selected ? AppTheme.accent : AppTheme.border)),
        child: Text(label, style: TextStyle(color: selected ? AppTheme.accent : AppTheme.textSecondary, fontSize: 12, fontWeight: FontWeight.w600)),
      ),
    ));
  }

  Widget _txnTile(Map<String, dynamic> tx) {
    final isCredit = tx['type'] == 'CREDIT';
    return Container(margin: const EdgeInsets.fromLTRB(16, 0, 16, 8), padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: AppTheme.bgCard, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
      child: Row(children: [
        Container(width: 36, height: 36, decoration: BoxDecoration(color: (isCredit ? AppTheme.accent : AppTheme.red).withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
          child: Icon(isCredit ? Icons.arrow_downward : Icons.arrow_upward, size: 16, color: isCredit ? AppTheme.accent : AppTheme.red)),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(tx['description'] ?? '', style: const TextStyle(color: AppTheme.textPrimary, fontSize: 12, fontWeight: FontWeight.w500), overflow: TextOverflow.ellipsis),
          const SizedBox(height: 2),
          Row(children: [
            Text(tx['channel'] ?? '', style: const TextStyle(color: AppTheme.textMuted, fontSize: 10)),
            const SizedBox(width: 8),
            Text(tx['date'] != null ? DateFormat('MMM d').format(DateTime.parse(tx['date'])) : '', style: const TextStyle(color: AppTheme.textMuted, fontSize: 10)),
          ]),
        ])),
        Text('${isCredit ? '+' : '-'}${_fmt(tx['amount'] ?? 0)}', style: TextStyle(color: isCredit ? AppTheme.accent : AppTheme.red, fontWeight: FontWeight.w700, fontSize: 12)),
      ]),
    );
  }

  Widget _pinView() => SafeArea(
    child: Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      const Icon(Icons.lock_outline, size: 48, color: AppTheme.accent),
      const SizedBox(height: 16),
      const Text('Enter PIN', style: TextStyle(color: AppTheme.textPrimary, fontSize: 20, fontWeight: FontWeight.w700)),
      const SizedBox(height: 8),
      const Text('Enter your 4-digit PIN to view transactions', style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
      const SizedBox(height: 24),
      Row(mainAxisAlignment: MainAxisAlignment.center, children: List.generate(4, (i) => Container(
        width: 16, height: 16, margin: const EdgeInsets.symmetric(horizontal: 6),
        decoration: BoxDecoration(shape: BoxShape.circle, color: _pin.length > i ? AppTheme.accent : AppTheme.border),
      ))),
      const SizedBox(height: 24),
      SizedBox(width: 220, child: GridView.count(
        crossAxisCount: 3, shrinkWrap: true, childAspectRatio: 1.2, mainAxisSpacing: 8, crossAxisSpacing: 8,
        children: ['1','2','3','4','5','6','7','8','9','','0','←'].map((d) => d.isEmpty ? const SizedBox()
          : GestureDetector(
              onTap: () => d == '←' ? setState(() => _pin = _pin.isEmpty ? '' : _pin.substring(0, _pin.length - 1)) : _enterPin(d),
              child: Container(decoration: BoxDecoration(color: AppTheme.bgCard, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppTheme.border)),
                child: Center(child: Text(d, style: const TextStyle(color: AppTheme.textPrimary, fontSize: 18, fontWeight: FontWeight.w600)))),
            )).toList(),
      )),
      const SizedBox(height: 12),
      const Text('Default PIN: 1234', style: TextStyle(color: AppTheme.textMuted, fontSize: 11)),
    ])),
  );
}
