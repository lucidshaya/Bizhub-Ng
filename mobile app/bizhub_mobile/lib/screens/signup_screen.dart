import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../core/api_service.dart';
import '../providers/auth_provider.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});
  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _pass = TextEditingController();
  final _confirm = TextEditingController();
  final _bizName = TextEditingController();
  String _bizType = '';
  bool _obscure = true;
  bool _loading = false;
  String? _error;

  Future<void> _submit() async {
    if (_pass.text != _confirm.text) {
      setState(() => _error = 'Passwords do not match');
      return;
    }
    if (_pass.text.length < 6) {
      setState(() => _error = 'Password must be at least 6 characters');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await context.read<AuthProvider>().signup({
        'email': _email.text.trim(),
        'password': _pass.text,
        'fullName': _name.text.trim(),
        if (_phone.text.isNotEmpty) 'phone': _phone.text.trim(),
        'businessName': _bizName.text.trim(),
        'businessType': _bizType,
      });
      if (mounted) Navigator.pushReplacementNamed(context, '/home');
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Signup failed. Check your connection.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 32),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppTheme.accent, AppTheme.accentDark],
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Center(
                      child: Text(
                        'B',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          fontSize: 20,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  const Text(
                    'BizhubNg',
                    style: TextStyle(
                      color: AppTheme.textPrimary,
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              const Text(
                'Create your account',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppTheme.textSecondary, fontSize: 14),
              ),
              const SizedBox(height: 32),

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
                const SizedBox(height: 12),
              ],

              _label('Full Name'),
              TextField(
                controller: _name,
                style: _ts,
                decoration: const InputDecoration(
                  hintText: 'Emeka Okafor',
                  prefixIcon: Icon(
                    Icons.person_outline,
                    size: 18,
                    color: AppTheme.textMuted,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              _label('Email'),
              TextField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                style: _ts,
                decoration: const InputDecoration(
                  hintText: 'you@business.com',
                  prefixIcon: Icon(
                    Icons.email_outlined,
                    size: 18,
                    color: AppTheme.textMuted,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              _label('Phone (optional)'),
              TextField(
                controller: _phone,
                keyboardType: TextInputType.phone,
                style: _ts,
                decoration: const InputDecoration(
                  hintText: '+234 801 234 5678',
                  prefixIcon: Icon(
                    Icons.phone_outlined,
                    size: 18,
                    color: AppTheme.textMuted,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              _label('Password'),
              TextField(
                controller: _pass,
                obscureText: _obscure,
                style: _ts,
                decoration: InputDecoration(
                  hintText: '••••••••',
                  prefixIcon: const Icon(
                    Icons.lock_outline,
                    size: 18,
                    color: AppTheme.textMuted,
                  ),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscure ? Icons.visibility_off : Icons.visibility,
                      size: 18,
                      color: AppTheme.textMuted,
                    ),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              _label('Confirm Password'),
              TextField(
                controller: _confirm,
                obscureText: _obscure,
                style: _ts,
                decoration: const InputDecoration(
                  hintText: '••••••••',
                  prefixIcon: Icon(
                    Icons.lock_outline,
                    size: 18,
                    color: AppTheme.textMuted,
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Divider
              Row(
                children: [
                  const Expanded(child: Divider(color: AppTheme.border)),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Text(
                      'Business Info',
                      style: TextStyle(color: AppTheme.textMuted, fontSize: 11),
                    ),
                  ),
                  const Expanded(child: Divider(color: AppTheme.border)),
                ],
              ),
              const SizedBox(height: 16),

              _label('Business Name'),
              TextField(
                controller: _bizName,
                style: _ts,
                decoration: const InputDecoration(
                  hintText: 'Okafor Enterprises Ltd',
                  prefixIcon: Icon(
                    Icons.business_outlined,
                    size: 18,
                    color: AppTheme.textMuted,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              _label('Business Type *'),
              DropdownButtonFormField<String>(
                initialValue: _bizType.isEmpty ? null : _bizType,
                items: const [
                  DropdownMenuItem(
                    value: 'Corporate/Workplace',
                    child: Text('Corporate/Workplace'),
                  ),
                  DropdownMenuItem(
                    value: 'Retail/Storefront',
                    child: Text('Retail/Storefront'),
                  ),
                ],
                onChanged: (v) => setState(() => _bizType = v ?? ''),
                decoration: const InputDecoration(hintText: 'Select type...'),
                dropdownColor: AppTheme.bgCard,
                style: _ts,
              ),
              const SizedBox(height: 24),

              SizedBox(
                height: 50,
                child: ElevatedButton(
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
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text('Create Account'),
                            SizedBox(width: 8),
                            Icon(Icons.arrow_forward, size: 18),
                          ],
                        ),
                ),
              ),
              const SizedBox(height: 20),

              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    'Already have an account? ',
                    style: TextStyle(
                      color: AppTheme.textSecondary,
                      fontSize: 14,
                    ),
                  ),
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: const Text(
                      'Sign In',
                      style: TextStyle(
                        color: AppTheme.accent,
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _label(String t) => Padding(
    padding: const EdgeInsets.only(bottom: 4),
    child: Text(
      t,
      style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13),
    ),
  );
  TextStyle get _ts =>
      const TextStyle(color: AppTheme.textPrimary, fontSize: 14);
}
