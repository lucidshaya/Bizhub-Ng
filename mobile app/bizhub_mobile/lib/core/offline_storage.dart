import 'package:hive_flutter/hive_flutter.dart';

class OfflineStorage {
  static const String _boxName = 'bizhub_cache';

  static Future<void> init() async {
    await Hive.initFlutter();
    await Hive.openBox(_boxName);
  }

  static Box get _box => Hive.box(_boxName);

  // Save JSON string or Map
  static Future<void> save(String key, dynamic data) async {
    await _box.put(key, data);
  }

  // Retrieve data
  static dynamic get(String key) {
    return _box.get(key);
  }

  // Clear specific key
  static Future<void> remove(String key) async {
    await _box.delete(key);
  }

  // Clear all cache
  static Future<void> clearAll() async {
    await _box.clear();
  }
}
