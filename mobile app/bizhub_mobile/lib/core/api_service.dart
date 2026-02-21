import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  // Change this to your backend URL
  static const String baseUrl = 'http://localhost:3333/api';
  static final _storage = const FlutterSecureStorage();

  static Future<String?> get token async =>
      await _storage.read(key: 'bizhub_token');

  static Future<void> setToken(String token) async {
    await _storage.write(key: 'bizhub_token', value: token);
  }

  static Future<void> clearToken() async {
    await _storage.delete(key: 'bizhub_token');
    await _storage.delete(key: 'bizhub_user');
  }

  static Future<void> setUser(Map<String, dynamic> user) async {
    await _storage.write(key: 'bizhub_user', value: jsonEncode(user));
  }

  static Future<Map<String, dynamic>?> getUser() async {
    final data = await _storage.read(key: 'bizhub_user');
    if (data != null) return jsonDecode(data) as Map<String, dynamic>;
    return null;
  }

  // ─── HTTP helpers ─────────────────────────────────────

  static Future<Map<String, String>> _headers() async {
    final t = await token;
    return {
      'Content-Type': 'application/json',
      if (t != null) 'Authorization': 'Bearer $t',
    };
  }

  static Future<dynamic> get(String path, {Map<String, String>? params}) async {
    final uri = Uri.parse('$baseUrl$path').replace(queryParameters: params);
    final res = await http.get(uri, headers: await _headers());
    return _handle(res);
  }

  static Future<dynamic> post(String path, Map<String, dynamic> body) async {
    final res = await http.post(
      Uri.parse('$baseUrl$path'),
      headers: await _headers(),
      body: jsonEncode(body),
    );
    return _handle(res);
  }

  static Future<dynamic> patch(String path, Map<String, dynamic> body) async {
    final res = await http.patch(
      Uri.parse('$baseUrl$path'),
      headers: await _headers(),
      body: jsonEncode(body),
    );
    return _handle(res);
  }

  static Future<dynamic> delete(String path) async {
    final res = await http.delete(
      Uri.parse('$baseUrl$path'),
      headers: await _headers(),
    );
    return _handle(res);
  }

  static dynamic _handle(http.Response res) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      if (res.body.isEmpty) return null;
      return jsonDecode(res.body);
    } else if (res.statusCode == 401) {
      clearToken();
      throw ApiException('Unauthorized', 401);
    } else {
      final body = res.body.isNotEmpty ? jsonDecode(res.body) : {};
      final msg = body['message'] ?? 'Request failed';
      throw ApiException(
        msg is List ? msg.join(', ') : msg.toString(),
        res.statusCode,
      );
    }
  }

  // ─── AUTH ─────────────────────────────────────────────

  static Future<Map<String, dynamic>> login(
    String email,
    String password,
  ) async {
    return await post('/auth/login', {'email': email, 'password': password});
  }

  static Future<Map<String, dynamic>> signup(Map<String, dynamic> data) async {
    return await post('/auth/signup', data);
  }

  static Future<Map<String, dynamic>> googleAuth(String idToken) async {
    return await post('/auth/google', {'idToken': idToken});
  }

  static Future<void> forgotPassword(String email) async {
    await post('/auth/forgot-password', {'email': email});
  }

  static Future<Map<String, dynamic>> getProfile() async {
    return await get('/auth/profile');
  }

  // ─── DASHBOARD ────────────────────────────────────────

  static Future<Map<String, dynamic>> getDashboardSummary() async {
    return await get('/dashboard/summary');
  }

  static Future<List<dynamic>> getDashboardActivity() async {
    return await get('/dashboard/activity');
  }

  // ─── STAFF ────────────────────────────────────────────

  static Future<List<dynamic>> getStaff() async {
    return await get('/staff');
  }

  static Future<Map<String, dynamic>> createStaff(
    Map<String, dynamic> data,
  ) async {
    return await post('/staff', data);
  }

  static Future<Map<String, dynamic>> updateStaff(
    String id,
    Map<String, dynamic> data,
  ) async {
    return await patch('/staff/$id', data);
  }

  static Future<void> deleteStaff(String id) async {
    await delete('/staff/$id');
  }

  static Future<Map<String, dynamic>> payStaff(
    String staffId,
    double amount, {
    String? reason,
  }) async {
    return await post('/staff/pay', {
      'staffId': staffId,
      'amount': amount,
      if (reason != null) 'reason': reason,
    });
  }

  static Future<Map<String, dynamic>> payAll({
    List<String>? staffIds,
    String? reason,
  }) async {
    return await post('/staff/pay-all', {
      if (staffIds != null) 'staffIds': staffIds,
      if (reason != null) 'reason': reason,
    });
  }

  // ─── TRANSACTIONS ─────────────────────────────────────

  static Future<Map<String, dynamic>> getTransactions({
    String? type,
    String? search,
    int page = 1,
    int limit = 20,
  }) async {
    return await get(
      '/transactions',
      params: {
        'page': page.toString(),
        'limit': limit.toString(),
        if (type != null) 'type': type,
        if (search != null) 'search': search,
      },
    );
  }

  static Future<Map<String, dynamic>> getTransactionsSummary() async {
    return await get('/transactions/summary');
  }

  static Future<Map<String, dynamic>> createTransaction(
    Map<String, dynamic> data,
  ) async {
    return await post('/transactions', data);
  }

  // ─── CAMERAS ──────────────────────────────────────────

  static Future<List<dynamic>> getCameras() async {
    return await get('/cameras');
  }

  static Future<Map<String, dynamic>> createCamera(
    Map<String, dynamic> data,
  ) async {
    return await post('/cameras', data);
  }

  // ─── CHAT ─────────────────────────────────────────────

  static Future<List<dynamic>> getChatRooms() async {
    return await get('/chat/rooms');
  }

  static Future<List<dynamic>> getChatUsers() async {
    return await get('/chat/users');
  }

  static Future<List<dynamic>> getChatMessages(String roomId) async {
    return await get('/chat/rooms/$roomId/messages');
  }

  static Future<Map<String, dynamic>> sendMessage(
    String roomId,
    String text,
  ) async {
    return await post('/chat/messages', {'roomId': roomId, 'text': text});
  }

  // ─── SETTINGS ─────────────────────────────────────────

  static Future<Map<String, dynamic>> getSettings() async {
    return await get('/settings/profile');
  }

  static Future<void> updateProfile(Map<String, dynamic> data) async {
    await patch('/settings/profile', data);
  }

  static Future<void> updateBusiness(Map<String, dynamic> data) async {
    await patch('/settings/business', data);
  }

  static Future<List<dynamic>> getPaymentIntegrations() async {
    return await get('/settings/payments');
  }
}

class ApiException implements Exception {
  final String message;
  final int statusCode;
  ApiException(this.message, this.statusCode);

  @override
  String toString() => message;
}
