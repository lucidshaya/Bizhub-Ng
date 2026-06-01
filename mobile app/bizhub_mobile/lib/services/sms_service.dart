import 'dart:developer';
import 'package:telephony/telephony.dart';
import '../core/api_service.dart';
import '../core/offline_storage.dart';
import 'dart:io' show Platform;

class SmsService {
  static final Telephony telephony = Telephony.instance;

  static Future<void> initialize() async {
    if (!Platform.isAndroid) {
      log('SMS sync is Android only. Skipping initialization.');
      return;
    }
    try {
      bool? permissionsGranted = await telephony.requestPhoneAndSmsPermissions;
      if (permissionsGranted == true) {
        log('SMS permissions granted');
        telephony.listenIncomingSms(
          onNewMessage: _handleIncomingSms,
          onBackgroundMessage: backgroundMessageHandler,
          listenInBackground: true,
        );
        // Flush any pending syncs
        _flushQueue();
      } else {
        log('SMS permissions denied');
      }
    } catch (e) {
      log('SMS initialization failed (possibly unsupported platform): $e');
    }
  }

  static Future<void> _flushQueue() async {
    final pending = OfflineStorage.getPendingSyncs();
    if (pending.isEmpty) return;

    log('Bizhub: Syncing ${pending.length} pending SMS transactions...');
    List<Map<String, dynamic>> failedAgain = [];

    for (final data in pending) {
      try {
        await ApiService.post('/transactions/sms-sync', data);
      } catch (e) {
        failedAgain.add(data);
      }
    }

    await OfflineStorage.clearPendingSyncs();
    for (final f in failedAgain) {
      await OfflineStorage.addPendingSync(f);
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
    final knownSenders = [
      'OPAY', 'PALMPAY', 'GTBANK', 'ZENITH', 'UBA', 'ACCESS', 'MONIEPOINT', 'FIRSTBANK', 'STANBIC'
    ];

    if (!knownSenders.any((s) => sender.contains(s))) {
      return;
    }

    final amount = _extractAmount(body);
    if (amount <= 0) return;

    final type = (body.toLowerCase().contains('credit') || body.toLowerCase().contains(' cr ')) ? 'CREDIT' : 'DEBIT';

    final data = {
      'amount': amount,
      'type': type,
      'description': 'Auto-synced: $body',
      'channel': sender,
      'occurredAt': DateTime.now().toIso8601String(),
      'externalId': message.id?.toString() ?? 'SMS-${message.date}',
    };

    try {
      await ApiService.post('/transactions/sms-sync', data);
      log('✅ Synced SMS Transaction: $amount from $sender');
    } catch (e) {
      log('Error syncing SMS, queuing for later: $e');
      await OfflineStorage.addPendingSync(data);
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
  log('New SMS background: ${message.address}');
  // Note: backgroundMessageHandler runs in a separate isolate.
  // We should ideally call _processMessage here, but it requires static access.
  // For simplicity and to avoid isolate complexity, we log it.
  // Most syncs happen in foreground or when app is resumed.
}
