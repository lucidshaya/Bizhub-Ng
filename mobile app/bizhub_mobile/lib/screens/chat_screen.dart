import 'dart:async';
import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../core/api_service.dart';
import 'package:intl/intl.dart';
import '../core/socket_service.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});
  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  List<dynamic> _rooms = [];
  List<dynamic> _users = [];
  bool _loadingRooms = true;
  bool _loadingUsers = true;

  @override
  void initState() {
    super.initState();
    _loadRooms();
    _loadUsers();
  }

  Future<void> _loadRooms() async {
    try {
      final data = await ApiService.getChatRooms();
      if (mounted) {
        setState(() {
          _rooms = data;
          _loadingRooms = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingRooms = false);
    }
  }

  Future<void> _loadUsers() async {
    try {
      final data = await ApiService.getChatUsers();
      if (mounted) {
        setState(() {
          _users = data;
          _loadingUsers = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingUsers = false);
    }
  }

  Color _roomColor(int i) {
    const colors = [
      AppTheme.blue,
      AppTheme.purple,
      AppTheme.accent,
      AppTheme.yellow,
      AppTheme.pink,
    ];
    return colors[i % colors.length];
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Chat'),
          bottom: const TabBar(
            indicatorColor: AppTheme.accent,
            labelColor: AppTheme.accent,
            unselectedLabelColor: AppTheme.textMuted,
            tabs: [
              Tab(text: 'Conversations'),
              Tab(text: 'Team Directory'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            // Tab 1: Rooms
            _loadingRooms
                ? const Center(
                    child: CircularProgressIndicator(color: AppTheme.accent),
                  )
                : _rooms.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Icon(
                          Icons.chat_bubble_outline,
                          size: 48,
                          color: AppTheme.textMuted,
                        ),
                        SizedBox(height: 12),
                        Text(
                          'No conversations yet',
                          style: TextStyle(
                            color: AppTheme.textSecondary,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  )
                : RefreshIndicator(
                    color: AppTheme.accent,
                    onRefresh: _loadRooms,
                    child: ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _rooms.length,
                      itemBuilder: (ctx, i) {
                        final room = _rooms[i] as Map<String, dynamic>;
                        final name = room['name'] ?? 'Chat';
                        final initials = name
                            .toString()
                            .split(' ')
                            .take(2)
                            .map((w) => w.isNotEmpty ? w[0] : '')
                            .join()
                            .toUpperCase();
                        final lastMsg = room['lastMessage'];
                        final color = _roomColor(i);

                        return Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          decoration: BoxDecoration(
                            color: AppTheme.bgCard,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppTheme.border),
                          ),
                          child: ListTile(
                            onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => _ChatRoomScreen(
                                  roomId: room['id'],
                                  roomName: name,
                                ),
                              ),
                            ),
                            leading: CircleAvatar(
                              radius: 22,
                              backgroundColor: color.withOpacity(0.2),
                              child: Text(
                                initials,
                                style: TextStyle(
                                  color: color,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                            title: Text(
                              name,
                              style: const TextStyle(
                                color: AppTheme.textPrimary,
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                              ),
                            ),
                            subtitle: Text(
                              lastMsg?['text'] ?? 'No messages yet',
                              style: const TextStyle(
                                color: AppTheme.textMuted,
                                fontSize: 12,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                            trailing: lastMsg != null
                                ? Text(
                                    DateFormat(
                                      'HH:mm',
                                    ).format(DateTime.parse(lastMsg['time'])),
                                    style: const TextStyle(
                                      color: AppTheme.textMuted,
                                      fontSize: 11,
                                    ),
                                  )
                                : null,
                            dense: true,
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 4,
                            ),
                          ),
                        );
                      },
                    ),
                  ),

            // Tab 2: Directory
            _loadingUsers
                ? const Center(
                    child: CircularProgressIndicator(color: AppTheme.accent),
                  )
                : _users.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Icon(
                          Icons.people_outline,
                          size: 48,
                          color: AppTheme.textMuted,
                        ),
                        SizedBox(height: 12),
                        Text(
                          'No staff found in this organization',
                          style: TextStyle(
                            color: AppTheme.textSecondary,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  )
                : RefreshIndicator(
                    color: AppTheme.accent,
                    onRefresh: _loadUsers,
                    child: ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _users.length,
                      itemBuilder: (ctx, i) {
                        final u = _users[i] as Map<String, dynamic>;
                        final name = u['name'] ?? 'Unknown';
                        final initials = name
                            .toString()
                            .split(' ')
                            .take(2)
                            .map((w) => w.isNotEmpty ? w[0] : '')
                            .join()
                            .toUpperCase();
                        final color = _roomColor(i + 3);
                        final roleInfo = u['role']?.toString() ?? 'Staff';
                        final pending = u['inviteStatus'] == 'PENDING';

                        return Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          decoration: BoxDecoration(
                            color: AppTheme.bgCard,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppTheme.border),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.05),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: ListTile(
                            onTap: () async {
                              setState(() => _loadingRooms = true);
                              try {
                                final response =
                                    await ApiService.createChatRoom(
                                      name: name,
                                      type: 'DIRECT',
                                      memberIds: [u['id']],
                                    );
                                if (mounted) {
                                  setState(() => _loadingRooms = false);
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => _ChatRoomScreen(
                                        roomId: response['id'],
                                        roomName: name,
                                      ),
                                    ),
                                  ).then((_) => _loadRooms());
                                }
                              } catch (e) {
                                if (mounted) {
                                  setState(() => _loadingRooms = false);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text('Could not start chat: $e'),
                                    ),
                                  );
                                }
                              }
                            },
                            leading: CircleAvatar(
                              radius: 20,
                              backgroundColor: AppTheme.border,
                              child: Text(
                                initials,
                                style: TextStyle(
                                  color: color,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                            title: Row(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                Expanded(
                                  child: Text(
                                    name,
                                    style: const TextStyle(
                                      color: AppTheme.textPrimary,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 14,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                if (pending)
                                  Container(
                                    margin: const EdgeInsets.only(left: 8),
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 6,
                                      vertical: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.orange.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: const Text(
                                      'PENDING',
                                      style: TextStyle(
                                        color: Colors.orange,
                                        fontSize: 9,
                                        fontWeight: FontWeight.w800,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                            subtitle: Text(
                              roleInfo,
                              style: const TextStyle(
                                color: AppTheme.textMuted,
                                fontSize: 12,
                              ),
                            ),
                            trailing: const Icon(
                              Icons.chat_bubble_outline,
                              size: 18,
                              color: AppTheme.textSecondary,
                            ),
                            dense: true,
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 4,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
          ],
        ),
      ),
    );
  }
}

class _ChatRoomScreen extends StatefulWidget {
  final String roomId;
  final String roomName;
  const _ChatRoomScreen({required this.roomId, required this.roomName});
  @override
  State<_ChatRoomScreen> createState() => _ChatRoomScreenState();
}

class _ChatRoomScreenState extends State<_ChatRoomScreen> {
  List<dynamic> _messages = [];
  final _msgCtrl = TextEditingController();
  bool _sending = false;
  Timer? _pollTimer;
  final _scrollCtrl = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadMessages();
    _initSocket();
  }

  Future<void> _initSocket() async {
    final socket = await SocketService.connect();
    socket.emit('join_room', {'roomId': widget.roomId});
    socket.on('new_message', (data) {
      if (!mounted) return;
      if (data['roomId'] == widget.roomId) {
        setState(() {
          // Avoid duplicates
          final existingIds = _messages.map((m) => m['id']).toSet();
          if (!existingIds.contains(data['message']['id'])) {
            _messages.add(data['message']);
          }
        });
        _scrollToBottom();
      }
    });
  }

  @override
  void dispose() {
    SocketService.socket?.off('new_message');
    _msgCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadMessages() async {
    try {
      final data = await ApiService.getChatMessages(widget.roomId);
      if (mounted) setState(() => _messages = data);
    } catch (_) {}
  }

  Future<void> _send() async {
    if (_msgCtrl.text.trim().isEmpty) return;
    setState(() => _sending = true);
    try {
      await ApiService.sendMessage(widget.roomId, _msgCtrl.text.trim());
      _msgCtrl.clear();
      await _loadMessages();
      _scrollToBottom();
    } catch (_) {
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.roomName,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.phone_outlined, size: 20),
            onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Calling coming soon!')),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.videocam_outlined, size: 20),
            onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Video call coming soon!')),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: _messages.isEmpty
                ? const Center(
                    child: Text(
                      'No messages yet. Start the conversation!',
                      style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
                    ),
                  )
                : ListView.builder(
                    controller: _scrollCtrl,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (ctx, i) {
                      final msg = _messages[i] as Map<String, dynamic>;
                      final isMine = msg['isMine'] == true;
                      return Align(
                        alignment: isMine
                            ? Alignment.centerRight
                            : Alignment.centerLeft,
                        child: Container(
                          constraints: BoxConstraints(
                            maxWidth: MediaQuery.of(context).size.width * 0.7,
                          ),
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 10,
                          ),
                          decoration: BoxDecoration(
                            color: isMine ? AppTheme.accent : AppTheme.bgCard,
                            borderRadius: BorderRadius.only(
                              topLeft: const Radius.circular(16),
                              topRight: const Radius.circular(16),
                              bottomLeft: Radius.circular(isMine ? 16 : 4),
                              bottomRight: Radius.circular(isMine ? 4 : 16),
                            ),
                            border: isMine
                                ? null
                                : Border.all(color: AppTheme.border),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (!isMine)
                                Text(
                                  msg['senderName'] ?? '',
                                  style: TextStyle(
                                    color: AppTheme.textSecondary,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              Text(
                                msg['text'] ?? '',
                                style: TextStyle(
                                  color: isMine
                                      ? AppTheme.bgPrimary
                                      : AppTheme.textPrimary,
                                  fontSize: 14,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                msg['sentAt'] != null
                                    ? DateFormat(
                                        'HH:mm',
                                      ).format(DateTime.parse(msg['sentAt']))
                                    : '',
                                style: TextStyle(
                                  color: isMine
                                      ? AppTheme.bgPrimary.withOpacity(0.6)
                                      : AppTheme.textMuted,
                                  fontSize: 10,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),

          // Input bar
          Container(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
            decoration: const BoxDecoration(
              border: Border(top: BorderSide(color: AppTheme.border)),
            ),
            child: SafeArea(
              top: false,
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(
                      Icons.attach_file,
                      size: 20,
                      color: AppTheme.textMuted,
                    ),
                    onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('File attachment coming soon!'),
                      ),
                    ),
                  ),
                  Expanded(
                    child: TextField(
                      controller: _msgCtrl,
                      onSubmitted: (_) => _send(),
                      style: const TextStyle(
                        color: AppTheme.textPrimary,
                        fontSize: 14,
                      ),
                      decoration: const InputDecoration(
                        hintText: 'Type a message...',
                        isDense: true,
                        contentPadding: EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 10,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: _sending ? null : _send,
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppTheme.accent,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: _sending
                          ? const Padding(
                              padding: EdgeInsets.all(10),
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: AppTheme.bgPrimary,
                              ),
                            )
                          : const Icon(
                              Icons.send,
                              size: 18,
                              color: AppTheme.bgPrimary,
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
