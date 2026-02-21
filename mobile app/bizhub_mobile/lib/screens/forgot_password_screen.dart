import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../core/api_service.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});
  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _email = TextEditingController();
  bool _sent = false;
  bool _loading = false;
  String? _error;

  Future<void> _submit() async {
    setState(() { _loading = true; _error = null; });
    try {
      await ApiService.forgotPassword(_email.text.trim());
      setState(() => _sent = true);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(leading: const BackButton()),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: _sent ? _successView() : _formView(),
        ),
      ),
    );
  }

  Widget _successView() => Column(
    mainAxisAlignment: MainAxisAlignment.center,
    children: [
      const Icon(Icons.check_circle, color: AppTheme.accent, size: 64),
      const SizedBox(height: 20),
      const Text('Check your email', style: TextStyle(color: AppTheme.textPrimary, fontSize: 20, fontWeight: FontWeight.w700)),
      const SizedBox(height: 8),
      Text('We sent a reset link to ${_email.text}', textAlign: TextAlign.center, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 14)),
      const SizedBox(height: 24),
      TextButton.icon(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.arrow_back, size: 16), label: const Text('Back to Sign In'), style: TextButton.styleFrom(foregroundColor: AppTheme.accent)),
    ],
  );

  Widget _formView() => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      const SizedBox(height: 40),
      const Icon(Icons.lock_reset, color: AppTheme.accent, size: 48),
      const SizedBox(height: 20),
      const Text('Reset Password', textAlign: TextAlign.center, style: TextStyle(color: AppTheme.textPrimary, fontSize: 22, fontWeight: FontWeight.w700)),
      const SizedBox(height: 8),
      const Text('Enter your email to receive a reset link', textAlign: TextAlign.center, style: TextStyle(color: AppTheme.textSecondary, fontSize: 14)),
      const SizedBox(height: 32),
      if (_error != null) ...[
        Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: AppTheme.red.withOpacity(0.1), borderRadius: BorderRadius.circular(12)), child: Text(_error!, style: const TextStyle(color: AppTheme.red, fontSize: 13))),
        const SizedBox(height: 16),
      ],
      TextField(controller: _email, keyboardType: TextInputType.emailAddress, style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14), decoration: const InputDecoration(hintText: 'you@business.com', prefixIcon: Icon(Icons.email_outlined, size: 18, color: AppTheme.textMuted))),
      const SizedBox(height: 24),
      SizedBox(height: 50, child: ElevatedButton(onPressed: _loading ? null : _submit, child: _loading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.bgPrimary)) : const Text('Send Reset Link'))),
    ],
  );
}
