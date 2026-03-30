import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../core/api_service.dart';

class AddStaffScreen extends StatefulWidget {
  const AddStaffScreen({super.key});

  @override
  State<AddStaffScreen> createState() => _AddStaffScreenState();
}

class _AddStaffScreenState extends State<AddStaffScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _role = TextEditingController();
  final _department = TextEditingController();
  final _salary = TextEditingController();
  final _bankName = TextEditingController();
  final _accountNum = TextEditingController();

  bool _loading = false;
  String? _error;
  List<dynamic> _departments = [];

  @override
  void initState() {
    super.initState();
    _loadDepartments();
  }

  Future<void> _loadDepartments() async {
    try {
      final res = await ApiService.getSettings();
      if (res['business'] != null && res['business']['departments'] != null) {
        setState(() {
          _departments = List.from(res['business']['departments']);
        });
      }
    } catch (_) {
      // Ignore if settings fail
    }
  }

  Future<void> _submit() async {
    if (_name.text.isEmpty || _role.text.isEmpty) {
      setState(() => _error = 'Name and Role are required');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      double salary = double.tryParse(_salary.text.replaceAll(',', '')) ?? 0.0;
      final Map<String, dynamic> payload = {
        'name': _name.text.trim(),
        'role': _role.text.trim(),
      };

      if (_email.text.isNotEmpty) payload['email'] = _email.text.trim();
      if (_phone.text.isNotEmpty) payload['phone'] = _phone.text.trim();
      if (_department.text.isNotEmpty)
        payload['department'] = _department.text.trim();
      if (salary > 0) payload['monthlySalary'] = salary;
      if (_bankName.text.isNotEmpty)
        payload['bankName'] = _bankName.text.trim();
      if (_accountNum.text.isNotEmpty)
        payload['accountNumber'] = _accountNum.text.trim();

      await ApiService.createStaff(payload);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Staff added! ${_email.text.isNotEmpty ? "Invitation sent." : ""}',
            ),
          ),
        );
        Navigator.pop(context, true); // Return true to trigger refresh
      }
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Failed to add staff');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Add Staff',
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
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_error != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.red.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.red.withOpacity(0.2)),
                ),
                child: Text(
                  _error!,
                  style: const TextStyle(color: AppTheme.red, fontSize: 13),
                ),
              ),
              const SizedBox(height: 16),
            ],

            _label('Full Name *'),
            _input('Emeka Okafor', _name),

            _label('Job Role *'),
            _input('Cashier', _role),

            _label('Email (for invitation)'),
            _input('email@example.com', _email, TextInputType.emailAddress),

            _label('Phone Number'),
            _input('+234 801 234 5678', _phone, TextInputType.phone),

            _label('Department'),
            _departments.isEmpty
                ? _input('e.g. Sales', _department)
                : _dropdown('Select Department', _departments, _department),

            _label('Monthly Salary (₦)'),
            _input('50000', _salary, TextInputType.number),

            _label('Bank Name'),
            _input('GTBank', _bankName),

            _label('Account Number'),
            _input('0123456789', _accountNum, TextInputType.number),

            const SizedBox(height: 24),

            ElevatedButton(
              onPressed: _loading ? null : _submit,
              child: _loading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppTheme.bgPrimary,
                      ),
                    )
                  : const Text('Add Staff & Send Invite'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _label(String t) => Padding(
    padding: const EdgeInsets.only(top: 12, bottom: 6),
    child: Text(
      t,
      style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13),
    ),
  );

  Widget _input(
    String hint,
    TextEditingController ctrl, [
    TextInputType type = TextInputType.text,
  ]) {
    return TextField(
      controller: ctrl,
      keyboardType: type,
      style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14),
      decoration: InputDecoration(hintText: hint),
    );
  }

  Widget _dropdown(
    String hint,
    List<dynamic> items,
    TextEditingController ctrl,
  ) {
    return DropdownButtonFormField<String>(
      value: ctrl.text.isEmpty ? null : ctrl.text,
      items: [
        ...items.map(
          (e) =>
              DropdownMenuItem(value: e.toString(), child: Text(e.toString())),
        ),
      ],
      onChanged: (v) => setState(() => ctrl.text = v ?? ''),
      decoration: InputDecoration(hintText: hint),
      dropdownColor: AppTheme.bgCard,
      style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14),
    );
  }
}
