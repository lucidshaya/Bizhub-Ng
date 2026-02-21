import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../core/api_service.dart';

class AuthProvider extends ChangeNotifier {
  bool _isLoading = true;
  bool _isAuthenticated = false;
  Map<String, dynamic>? _user;
  String? _token;

  bool get isLoading => _isLoading;
  bool get isAuthenticated => _isAuthenticated;
  Map<String, dynamic>? get user => _user;
  String? get token => _token;

  AuthProvider();

  Future<void> tryAutoLogin() async {
    try {
      final storedToken = await ApiService.token;
      final storedUser = await ApiService.getUser();
      if (storedToken != null && storedUser != null) {
        _token = storedToken;
        _user = storedUser;
        _isAuthenticated = true;
      }
    } catch (_) {
      // No stored session
    }
    _isLoading = false;
    notifyListeners();
  }

  void _saveAuth(Map<String, dynamic> userData, String authToken) {
    _user = userData;
    _token = authToken;
    _isAuthenticated = true;
    _isLoading = false;
    ApiService.setToken(authToken);
    ApiService.setUser(userData);
    notifyListeners();
  }

  // ─── LOGIN (via Backend API) ───────────────────────────

  Future<void> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();
    try {
      final res = await ApiService.login(email, password);
      _saveAuth(res['user'], res['token']);
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  // ─── SIGNUP (via Backend API) ──────────────────────────

  Future<void> signup(Map<String, dynamic> data) async {
    _isLoading = true;
    notifyListeners();
    try {
      final res = await ApiService.signup(data);
      _saveAuth(res['user'], res['token']);
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  // ─── GOOGLE LOGIN ─────────────────────────────────────

  Future<void> googleLogin() async {
    try {
      final googleSignIn = GoogleSignIn(scopes: ['email', 'profile']);
      final googleUser = await googleSignIn.signIn();
      if (googleUser == null) return; // User cancelled

      final googleAuth = await googleUser.authentication;
      final idToken = googleAuth.idToken;

      if (idToken != null) {
        // Send ID token to backend for validation
        final res = await ApiService.googleAuth(idToken);
        _saveAuth(res['user'], res['token']);
      } else {
        throw Exception('Could not get Google ID token');
      }
    } catch (e) {
      rethrow;
    }
  }

  // ─── LOGOUT ────────────────────────────────────────────

  Future<void> logout() async {
    _isAuthenticated = false;
    _user = null;
    _token = null;
    await ApiService.clearToken();
    notifyListeners();
  }
}
