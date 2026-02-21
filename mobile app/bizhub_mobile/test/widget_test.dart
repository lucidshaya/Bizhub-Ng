import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:bizhub_mobile/main.dart';

void main() {
  testWidgets('App loads', (WidgetTester tester) async {
    await tester.pumpWidget(const BizhubApp());
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
