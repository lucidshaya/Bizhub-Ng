import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'providers/auth_provider.dart';
import 'core/theme.dart';
import 'core/offline_storage.dart';
import 'screens/login_screen.dart';
import 'screens/signup_screen.dart';
import 'screens/forgot_password_screen.dart';
import 'screens/home_shell.dart';
import 'services/sms_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await OfflineStorage.init();
  await SmsService.initialize();

  await Supabase.initialize(
    url: 'https://gypptbedjebrwhovpwsu.supabase.co',
    anonKey:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5cHB0YmVkamVicndob3Zwd3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1OTM5MTgsImV4cCI6MjA4NzE2OTkxOH0.SlvEE2rzjaqed3kB1Srnwx6tCUCGos1Ybndo8gFvSXA',
  );

  runApp(const BizhubApp());
}

class BizhubApp extends StatelessWidget {
  const BizhubApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AuthProvider()..tryAutoLogin(),
      child: MaterialApp(
        title: 'BizhubNg',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.darkTheme,
        home: Consumer<AuthProvider>(
          builder: (ctx, auth, _) {
            if (auth.isLoading) {
              return const Scaffold(
                body: Center(
                  child: CircularProgressIndicator(color: AppTheme.accent),
                ),
              );
            }
            return auth.isAuthenticated
                ? const HomeShell()
                : const LoginScreen();
          },
        ),
        routes: {
          '/login': (_) => const LoginScreen(),
          '/signup': (_) => const SignupScreen(),
          '/forgot-password': (_) => const ForgotPasswordScreen(),
          '/home': (_) => const HomeShell(),
        },
      ),
    );
  }
}
