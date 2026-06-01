import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../core/api_service.dart';
import 'package:intl/intl.dart';

import '../core/socket_service.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:async';

class TransactionsScreen extends StatefulWidget {
  const TransactionsScreen({super.key});
  @override
  State<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends State<TransactionsScreen> {
  bool _unlocked = false;
  String _pin = '';

  List<dynamic> _txns = [];
  Map<String, dynamic>? _summary;
  bool _loading = true;
  bool _isSyncing = false;
  
  String _typeFilter = '';
  String _searchQuery = '';
  String _tabFilter = 'ALL';
  int _page = 1;
  int _totalPages = 1;

  Timer? _debounce;
  final TextEditingController _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _connectSocket();
  }

  void _connectSocket() async {
    final socket = await SocketService.connect();
    socket.on('transaction:new', (data) {
      if (mounted) {
        setState(() {
          _txns.insert(0, data);
          if (_txns.length > 20) _txns.removeLast();
          _loadSummaryOnly();
        });
      }
    });
  }

  Future<void> _loadSummaryOnly() async {
    try {
      final summary = await ApiService.getTransactionsSummary();
      if (mounted) setState(() => _summary = summary);
    } catch (_) {}
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      String? channel;
      if (_tabFilter == 'SMS') channel = 'Bank Transfer';
      if (_tabFilter == 'POS') channel = 'POS Terminal';
      if (_tabFilter == 'ONLINE') channel = 'Paystack,Moniepoint,Flutterwave,OPay';

      final results = await Future.wait([
        ApiService.getTransactions(
          page: _page, 
          limit: 20, 
          type: _typeFilter.isNotEmpty ? _typeFilter : null,
          search: _searchQuery.isNotEmpty ? _searchQuery : null,
          channel: channel,
        ),
        ApiService.getTransactionsSummary(),
      ]);
      if (mounted) {
        setState(() {
          final txnData = results[0];
          _txns = txnData['data'] ?? [];
          _totalPages = txnData['totalPages'] ?? 1;
          _summary = results[1];
          _loading = false;
        });
      }
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  void _onSearchChanged(String query) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () {
      setState(() {
        _searchQuery = query;
        _page = 1;
      });
      _load();
    });
  }

  Future<void> _handleSync() async {
    setState(() => _isSyncing = true);
    try {
      await ApiService.syncTransactions();
      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sync successful')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sync failed')));
      }
    } finally {
      if (mounted) setState(() => _isSyncing = false);
    }
  }

  Future<void> _handleDeleteTxn(String id) async {
    try {
      await ApiService.deleteTransaction(id);
      setState(() {
        _txns.removeWhere((t) => t['id'] == id);
      });
      _loadSummaryOnly();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Transaction deleted')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to delete')));
        _load(); 
      }
    }
  }

  Future<void> _handleExport() async {
    try {
      final token = await ApiService.token;
      String url = '${ApiService.baseUrl}/transactions/export?token=$token';
      if (_typeFilter.isNotEmpty) {
         url += '&type=$_typeFilter';
      }
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        throw 'Cannot launch url';
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Export failed')));
      }
    }
  }

  void _showAddModal() {
    String type = 'CREDIT';
    String desc = '';
    String amount = '';
    String channel = 'Bank Transfer';
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setStateSheet) => Container(
          decoration: const BoxDecoration(
            color: AppTheme.bgCard,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
            top: 24, left: 24, right: 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                   Column(
                     crossAxisAlignment: CrossAxisAlignment.start,
                     children: const [
                       Text('Manual Entry', style: TextStyle(color: AppTheme.textPrimary, fontSize: 18, fontWeight: FontWeight.bold)),
                       SizedBox(height: 4),
                       Text('Record an off-platform transaction', style: TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                     ],
                   ),
                   IconButton(
                     onPressed: () => Navigator.pop(ctx),
                     icon: const Icon(Icons.close, color: AppTheme.textMuted),
                   ),
                ],
              ),
              const SizedBox(height: 24),
              // Type Toggle
              Container(
                decoration: BoxDecoration(color: AppTheme.bgPrimary, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
                padding: const EdgeInsets.all(4),
                child: Row(
                  children: ['CREDIT', 'DEBIT'].map((t) => Expanded(
                    child: GestureDetector(
                      onTap: () => setStateSheet(() => type = t),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: type == t ? (t == 'CREDIT' ? AppTheme.accent : AppTheme.red) : Colors.transparent,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Center(
                          child: Text(t, style: TextStyle(
                            color: type == t ? Colors.white : AppTheme.textMuted,
                            fontWeight: FontWeight.bold, fontSize: 12,
                          )),
                        ),
                      ),
                    ),
                  )).toList(),
                ),
              ),
              const SizedBox(height: 16),
              // Description
              const Text('DESCRIPTION', style: TextStyle(color: AppTheme.textSecondary, fontSize: 10, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextField(
                onChanged: (v) => desc = v,
                style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14),
                decoration: InputDecoration(hintText: 'Sale of Goods...', filled: true, fillColor: AppTheme.bgPrimary, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppTheme.border))),
              ),
              const SizedBox(height: 16),
              // Amount + Channel
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('AMOUNT (₦)', style: TextStyle(color: AppTheme.textSecondary, fontSize: 10, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        TextField(
                          onChanged: (v) => amount = v,
                          keyboardType: TextInputType.number,
                          style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14),
                          decoration: InputDecoration(hintText: '0.00', filled: true, fillColor: AppTheme.bgPrimary, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppTheme.border))),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('CHANNEL', style: TextStyle(color: AppTheme.textSecondary, fontSize: 10, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(color: AppTheme.bgPrimary, border: Border.all(color: AppTheme.border), borderRadius: BorderRadius.circular(12)),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: channel,
                              isExpanded: true,
                              dropdownColor: AppTheme.bgCard,
                              style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14),
                              onChanged: (v) { if (v != null) setStateSheet(() => channel = v); },
                              items: ['Bank Transfer', 'Cash', 'POS Terminal'].map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                            ),
                          ),
                        ),
                      ],
                    ),
                  )
                ],
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: (isSubmitting || desc.isEmpty || amount.isEmpty) ? null : () async {
                  setStateSheet(() => isSubmitting = true);
                  try {
                    await ApiService.createTransaction({
                      'type': type,
                      'description': desc,
                      'amount': double.tryParse(amount) ?? 0,
                      'channel': channel,
                    });
                    if (ctx.mounted) Navigator.pop(ctx);
                    _load();
                    if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Transaction recorded')));
                  } catch (e) {
                    setStateSheet(() => isSubmitting = false);
                    if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))));
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.accent, padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: isSubmitting 
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: AppTheme.bgPrimary, strokeWidth: 2))
                  : const Text('Log Transaction', style: TextStyle(color: AppTheme.bgPrimary, fontWeight: FontWeight.bold, fontSize: 14)),
              )
            ],
          ),
        ),
      ),
    );
  }

  String _fmt(num v) => '₦${NumberFormat('#,###').format(v)}';

  void _enterPin(String digit) async {
    final np = _pin + digit;
    setState(() => _pin = np);
    if (np.length >= 4) {
      try {
        final success = await ApiService.post('/auth/verify-pin', {'pin': np});
        if (success != null) {
          setState(() { _unlocked = true; _pin = ''; });
          _load();
        } else {
          setState(() => _pin = '');
        }
      } catch (e) {
        setState(() => _pin = '');
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Invalid PIN')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_unlocked) return _pinView();
    return SafeArea(
      child: RefreshIndicator(
        color: AppTheme.accent, 
        onRefresh: _load, 
        child: _loading && _txns.isEmpty
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

                // Top Utilities Toolbar
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: [
                      // Search Bar
                      Expanded(
                        child: TextField(
                          controller: _searchCtrl,
                          onChanged: _onSearchChanged,
                          style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13),
                          decoration: InputDecoration(
                            hintText: 'Search history...',
                            hintStyle: const TextStyle(color: AppTheme.textMuted),
                            prefixIcon: const Icon(Icons.search, size: 18, color: AppTheme.textMuted),
                            filled: true,
                            fillColor: AppTheme.bgCard,
                            contentPadding: const EdgeInsets.symmetric(vertical: 0),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppTheme.border)),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppTheme.border)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      _iconButton(Icons.add, _showAddModal, AppTheme.accent, AppTheme.accent.withOpacity(0.1)),
                      const SizedBox(width: 8),
                      _iconButton(Icons.download, _handleExport, AppTheme.textSecondary, AppTheme.bgCard),
                      const SizedBox(width: 8),
                      _isSyncing 
                        ? const Padding(padding: EdgeInsets.all(12), child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: AppTheme.accent, strokeWidth: 2)))
                        : _iconButton(Icons.sync, _handleSync, AppTheme.textSecondary, AppTheme.bgCard),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Web-Parity Tabs
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: SizedBox(height: 36, child: ListView(scrollDirection: Axis.horizontal, children: [
                    _tabChip('History', 'ALL'),
                    _tabChip('Bank Sync', 'SMS'),
                    _tabChip('Terminals', 'POS'),
                    _tabChip('Gateways', 'ONLINE'),
                  ])),
                ),
                const SizedBox(height: 16),

                // Filter Overrides
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: SizedBox(height: 32, child: ListView(scrollDirection: Axis.horizontal, children: [
                    _filterChip('All Types', ''),
                    _filterChip('Credit', 'CREDIT'),
                    _filterChip('Debit', 'DEBIT'),
                    _filterChip('Payroll', 'PAYROLL'),
                  ])),
                ),
                const SizedBox(height: 12),

                // Loading overlay
                if (_loading && _txns.isNotEmpty)
                  const LinearProgressIndicator(color: AppTheme.accent, backgroundColor: Colors.transparent),

                // List
                ..._txns.map((tx) => _txnTile(tx as Map<String, dynamic>)),
                if (_txns.isEmpty && !_loading) Padding(padding: const EdgeInsets.all(40), child: Column(children: [
                  const Icon(Icons.search_off, size: 40, color: AppTheme.textMuted),
                  const SizedBox(height: 8),
                  const Text('No records found', style: TextStyle(color: AppTheme.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(_tabFilter == 'SMS' ? 'Connect your bank account on the web to sync automatically.' : 'Adjust filters or add a manual record.', style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13), textAlign: TextAlign.center),
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
              ])
      )
    );
  }

  Widget _iconButton(IconData icon, VoidCallback onTap, Color iconColor, Color bgColor) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
        child: Icon(icon, size: 18, color: iconColor),
      ),
    );
  }

  Widget _summaryCard(String label, String value, Color color) => Expanded(
    child: Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: AppTheme.bgCard, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11)),
        const SizedBox(height: 4),
        Text(value, style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 16), overflow: TextOverflow.ellipsis),
      ])),
  );

  Widget _tabChip(String label, String value) {
    final selected = _tabFilter == value;
    return Padding(padding: const EdgeInsets.only(right: 16), child: GestureDetector(
      onTap: () { setState(() { _tabFilter = value; _page = 1; }); _load(); },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(label, style: TextStyle(color: selected ? AppTheme.accent : AppTheme.textSecondary, fontSize: 14, fontWeight: selected ? FontWeight.bold : FontWeight.w500)),
          const SizedBox(height: 4),
          if (selected) Container(height: 2, width: 24, color: AppTheme.accent)
        ]
      )
    ));
  }

  Widget _filterChip(String label, String value) {
    final selected = _typeFilter == value;
    return Padding(padding: const EdgeInsets.only(right: 8), child: GestureDetector(
      onTap: () { setState(() { _typeFilter = value; _page = 1; }); _load(); },
      child: Container(padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(color: selected ? AppTheme.accent.withOpacity(0.15) : AppTheme.bgCard, borderRadius: BorderRadius.circular(20), border: Border.all(color: selected ? AppTheme.accent : AppTheme.border)),
        child: Text(label, style: TextStyle(color: selected ? AppTheme.accent : AppTheme.textSecondary, fontSize: 11, fontWeight: FontWeight.w600)),
      ),
    ));
  }

  Widget _txnTile(Map<String, dynamic> tx) {
    final isCredit = tx['type'] == 'CREDIT';
    return Dismissible(
      key: Key(tx['id'].toString()),
      direction: DismissDirection.endToStart,
      confirmDismiss: (direction) async {
        return await showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            backgroundColor: AppTheme.bgCard,
            title: const Text('Delete Transaction?', style: TextStyle(color: AppTheme.textPrimary)),
            content: const Text('This action cannot be undone.', style: TextStyle(color: AppTheme.textSecondary)),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel', style: TextStyle(color: AppTheme.textMuted))),
              TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete', style: TextStyle(color: AppTheme.red))),
            ],
          ),
        );
      },
      onDismissed: (_) => _handleDeleteTxn(tx['id'].toString()),
      background: Container(
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 8),
        padding: const EdgeInsets.only(right: 20),
        alignment: Alignment.centerRight,
        decoration: BoxDecoration(color: AppTheme.red.withOpacity(0.8), borderRadius: BorderRadius.circular(12)),
        child: const Icon(Icons.delete, color: Colors.white),
      ),
      child: Container(margin: const EdgeInsets.fromLTRB(16, 0, 16, 8), padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: AppTheme.bgCard, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.border)),
        child: Row(children: [
          Container(width: 36, height: 36, decoration: BoxDecoration(color: (isCredit ? AppTheme.accent : AppTheme.red).withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
            child: Icon(isCredit ? Icons.arrow_downward : Icons.arrow_upward, size: 16, color: isCredit ? AppTheme.accent : AppTheme.red)),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(tx['description'] ?? '', style: const TextStyle(color: AppTheme.textPrimary, fontSize: 12, fontWeight: FontWeight.w500), overflow: TextOverflow.ellipsis),
            const SizedBox(height: 2),
            Row(children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(color: _getSourceColor(tx['source']).withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
                child: Text(tx['source'] ?? 'MANUAL', style: TextStyle(color: _getSourceColor(tx['source']), fontSize: 8, fontWeight: FontWeight.w600)),
              ),
              const SizedBox(width: 8),
              if (tx['channel'] != null) ...[Text(tx['channel'], style: const TextStyle(color: AppTheme.textMuted, fontSize: 10)), const SizedBox(width: 8)],
              Text(tx['date'] != null ? DateFormat('MMM d').format(DateTime.parse(tx['date'])) : '', style: const TextStyle(color: AppTheme.textMuted, fontSize: 10)),
            ]),
          ])),
          Text('${isCredit ? '+' : '-'}${_fmt(tx['amount'] ?? 0)}', style: TextStyle(color: isCredit ? AppTheme.accent : AppTheme.red, fontWeight: FontWeight.w700, fontSize: 12)),
        ]),
      ),
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
    ])),
  );

  Color _getSourceColor(String? source) {
    switch (source) {
      case 'SMS': return AppTheme.accent;
      case 'MONO': return AppTheme.blue;
      case 'PAYSTACK': return AppTheme.purple;
      default: return AppTheme.textMuted;
    }
  }
}
