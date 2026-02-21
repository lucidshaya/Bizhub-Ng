import 'dart:developer';
import 'package:telephony/telephony.dart';
import '../core/api_service.dart';

class SmsService {
  static final Telephony telephony = Telephony.instance;

  static Future<void> initialize() async {
    bool? permissionsGranted = await telephony.requestPhoneAndSmsPermissions;
    if (permissionsGranted == true) {
      log('SMS permissions granted');
      telephony.listenIncomingSms(
        onNewMessage: _handleIncomingSms,
        onBackgroundMessage: backgroundMessageHandler,
        listenInBackground: true,
      );
    } else {
      log('SMS permissions denied');
    }
  }

  static void _handleIncomingSms(SmsMessage message) {
    log('New SMS foreground: ${message.address} - ${message.body}');
    _processMessage(message);
  }

  static Future<void> _processMessage(SmsMessage message) async {
    final sender = message.address?.toUpperCase() ?? '';
    final body = message.body ?? '';

    // Only process known bank alerts
    if (!sender.contains('OPAY') &&
        !sender.contains('PALMPAY') &&
        !sender.contains('GTBANK')) {
      return;
    }

    try {
      // Basic Credit Regex
      // Usually "Credit" or "Cr", followed by an amount (e.g., NGN 5,000.00 or N5000)
      if (body.toLowerCase().contains('credit') ||
          body.toLowerCase().contains(' cr ')) {
        double amount = _extractAmount(body);

        if (amount > 0) {
          await ApiService.post('/transactions', {
            'type': 'CREDIT',
            'amount': amount,
            'description': 'Auto-synced Bank Transfer ($sender)',
            'channel': 'Bank Transfer',
            'status': 'COMPLETED',
          });
          log('✅ Synced SMS Transaction: $amount from $sender');
        }
      }

      // Basic Debit Regex
      if (body.toLowerCase().contains('debit') ||
          body.toLowerCase().contains(' dr ')) {
        double amount = _extractAmount(body);

        if (amount > 0) {
          await ApiService.post('/transactions', {
            'type': 'DEBIT',
            'amount': amount,
            'description': 'Auto-synced Bank Transfer ($sender)',
            'channel': 'Bank Transfer',
            'status': 'COMPLETED',
          });
          log('✅ Synced SMS Transaction: -$amount from $sender');
        }
      }
    } catch (e) {
      log('Error syncing SMS to transactions: $e');
    }
  }

  static double _extractAmount(String body) {
    // Regex to find amounts like 5000, 5,000.00, 50.50
    final RegExp regExp = RegExp(
      r'(?:N|NGN|N\s|NGN\s)?([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)',
    );
    final match = regExp.firstMatch(body);
    if (match != null && match.groupCount >= 1) {
      String amtStr = match.group(1)!.replaceAll(',', '');
      return double.tryParse(amtStr) ?? 0.0;
    }
    return 0.0;
  }
}

// Top-level function needed for background execution
@pragma('vm:entry-point')
Future<void> backgroundMessageHandler(SmsMessage message) async {
  // Use a minimal API post since Provider/Auth isn't cleanly available in background isolates
  // This will only work if the ApiService uses stored token correctly in background
  log('New SMS background: ${message.address}');
  // Note: Complex API calls in background isolates on Flutter sometimes fail if plugins aren't registered.
  // Telephony handles basic things.
}
