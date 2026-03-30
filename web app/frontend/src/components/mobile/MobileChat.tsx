import React, { useEffect, useState, useRef } from 'react';
import {
  ArrowLeft,
  Send,
  Paperclip,
  Smile,
  Phone,
  MoreVertical,
  Search,
  Loader2
} from
  'lucide-react';
import { motion } from 'framer-motion';
import { chatApi } from '../../services/api';
import { socketService } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../web/Toast';

interface MobileChatProps {
  onBack: () => void;
}


type View = 'list' | 'chat';

export function MobileChat({ onBack }: MobileChatProps) {
  const [view, setView] = useState<View>('list');
  const [activeRoom, setActiveRoom] = useState<any>(null);

  const [rooms, setRooms] = useState<any[]>([]);
  const [chatUsers, setChatUsers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadRooms();
    loadUsers();
  }, []);

  useEffect(() => {
    if (view === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, view]);

  useEffect(() => {
    const socket = socketService.connect();
    const handleNewMessage = (data: { roomId: string, message: any }) => {
      if (data.roomId === activeRoom?.id) {
        setMessages(prev => {
          if (prev.find(m => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
      loadRooms();
    };
    socket?.on('new_message', handleNewMessage);
    return () => { socket?.off('new_message', handleNewMessage); };
  }, [activeRoom]);

  const loadRooms = async () => {
    try {
      const res = await chatApi.getRooms();
      setRooms(res.data);
    } catch { } finally { setIsLoading(false); }
  };

  const loadUsers = async () => {
    try {
      const res = await chatApi.getUsers();
      setChatUsers(res.data);
    } catch { }
  };

  const loadMessages = async (roomId: string) => {
    try {
      const res = await chatApi.getMessages(roomId);
      setMessages(res.data);
    } catch { }
  };

  const joinRoom = (room: any) => {
    setActiveRoom(room);
    setView('chat');
    loadMessages(room.id);
    socketService.getSocket()?.emit('join_room', { roomId: room.id });
  };

  const handleUserClick = async (userId: string) => {
    setIsLoading(true);
    try {
      const res = await chatApi.createRoom({
        type: 'DM',
        memberIds: [userId]
      });
      const room = res.data;
      await loadRooms();
      joinRoom(room);
    } catch (e: any) {
      toast.error('Failed to start chat');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeRoom) return;
    setIsSending(true);
    try {
      await chatApi.sendMessage(activeRoom.id, input.trim());
      setInput('');
    } catch { } finally { setIsSending(false); }
  };
  const filteredRooms = rooms.filter((r) =>
    (r.name || 'Chat').toLowerCase().includes(search.toLowerCase())
  );
  const filteredUsers = chatUsers.filter((u) =>
    (u.name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (view === 'chat' && activeRoom) {
    return (
      <div className="h-full flex flex-col bg-[#0F1117]">
        {/* Chat Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-[#1E2535] bg-[#161B27] flex-shrink-0">
          <button
            onClick={() => setView('list')}
            className="w-8 h-8 -ml-1 flex items-center justify-center rounded-full active:bg-[#1E2535] text-[#94A3B8]">

            <ArrowLeft size={20} />
          </button>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 relative bg-[#3B82F6]/20 text-[#3B82F6]"
          >
            {activeRoom.name?.slice(0, 2).toUpperCase() || '??'}
            {activeRoom.type === 'DM' &&
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#00D084] rounded-full border-2 border-[#161B27]" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#F1F5F9] text-sm font-semibold truncate">
              {activeRoom.name || 'Chat'}
            </p>
            <p className="text-[#00D084] text-xs">Online</p>
          </div>
          <div className="flex gap-1">
            <button className="w-8 h-8 bg-[#1E2535] rounded-xl flex items-center justify-center text-[#94A3B8]">
              <Phone size={14} />
            </button>
            <button className="w-8 h-8 bg-[#1E2535] rounded-xl flex items-center justify-center text-[#94A3B8]">
              <MoreVertical size={14} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto app-scroll px-4 py-4 space-y-3">
          {/* Date divider */}
          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-[#1E2535]" />
            <span className="text-[#475569] text-xs">Today</span>
            <div className="flex-1 h-px bg-[#1E2535]" />
          </div>

          {messages.map((msg) =>
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className={`flex gap-2 ${msg.isMine ? 'flex-row-reverse' : ''}`}>

              {!msg.isMine &&
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 self-end mb-1 bg-[#3B82F6]/30 text-[#3B82F6]"
                >
                  {msg.senderName?.slice(0, 2).toUpperCase() || '??'}
                </div>
              }
              <div
                className={`max-w-[72%] flex flex-col gap-0.5 ${msg.isMine ? 'items-end' : 'items-start'}`}>

                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.isMine ? 'bg-[#00D084] text-[#0F1117] rounded-tr-sm font-medium' : 'bg-[#161B27] text-[#F1F5F9] rounded-tl-sm border border-[#1E2535]'}`}>

                  {msg.text}
                </div>
                <p className="text-[#475569] text-[10px] px-1">
                  {new Date(msg.sentAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-[#1E2535] bg-[#161B27] flex-shrink-0">
          <div className="flex items-center gap-2 bg-[#0F1117] border border-[#1E2535] rounded-2xl px-3 py-2">
            <button className="text-[#475569]">
              <Paperclip size={16} />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-sm text-[#F1F5F9] placeholder-[#475569] focus:outline-none" />

            <button className="text-[#475569]">
              <Smile size={16} />
            </button>
            <button
              disabled={!input.trim() || isSending}
              onClick={sendMessage}
              className="w-8 h-8 bg-[#00D084] disabled:opacity-50 rounded-xl flex items-center justify-center text-[#0F1117] active:scale-95 transition-transform">

              {isSending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            </button>
          </div>
        </div>
      </div>);

  }
  // Contact list view
  return (
    <div className="h-full flex flex-col bg-[#0F1117]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-[#1E2535] bg-[#161B27] flex-shrink-0">
        <button
          onClick={onBack}
          className="w-8 h-8 -ml-2 flex items-center justify-center rounded-full active:bg-[#1E2535] text-[#94A3B8]">

          <ArrowLeft size={20} />
        </button>
        <h2 className="text-[#F1F5F9] font-bold text-lg flex-1">Messages</h2>
        <button className="w-8 h-8 bg-[#1E2535] rounded-xl flex items-center justify-center text-[#94A3B8]">
          <Search size={14} />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 bg-[#161B27] border-b border-[#1E2535]">
        <div className="relative">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages..."
            className="w-full bg-[#0F1117] border border-[#1E2535] rounded-xl pl-8 pr-4 py-2 text-sm text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#00D084]/50" />

        </div>
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto app-scroll">
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-[#00D084]" /></div>
        ) : (
          <>
            {/* Recent Chats */}
            {filteredRooms.length > 0 && (
              <>
                <div className="px-4 pt-4 pb-1">
                  <p className="text-[#475569] text-xs font-semibold uppercase tracking-wider">
                    Recent Chats
                  </p>
                </div>
                {filteredRooms.map((r, i) => (
                  <motion.button
                    key={r.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => joinRoom(r)}
                    className="w-full flex items-center gap-3 px-4 py-3 active:bg-[#1E2535] transition-colors"
                  >
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 bg-[#3B82F6]/20 text-[#3B82F6]">
                      {r.name?.slice(0, 2).toUpperCase() || '??'}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-[#F1F5F9] text-sm font-semibold truncate">{r.name || 'Chat'}</p>
                      <p className="text-[#475569] text-xs truncate mt-0.5">{r.lastMessage?.text || 'No messages yet'}</p>
                    </div>
                  </motion.button>
                ))}
              </>
            )}

            {/* Team Directory */}
            {filteredUsers.length > 0 && (
              <>
                <div className="px-4 pt-4 pb-1">
                  <p className="text-[#475569] text-xs font-semibold uppercase tracking-wider">
                    Team Directory
                  </p>
                </div>
                {filteredUsers.map((u, i) => (
                  <motion.button
                    key={u.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleUserClick(u.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 active:bg-[#1E2535] transition-colors"
                  >
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 border border-[#3B82F6]/30 bg-[#3B82F6]/10 text-[#3B82F6]">
                      {u.name?.slice(0, 2).toUpperCase() || '??'}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-[#F1F5F9] text-sm font-semibold flex items-center gap-2 truncate">
                        {u.name}
                        {u.inviteStatus === 'PENDING' && (
                          <span className="text-[10px] text-[#F59E0B] bg-[#F59E0B]/10 px-1.5 py-0.5 rounded font-bold">
                            PENDING
                          </span>
                        )}
                      </p>
                      <p className="text-[#475569] text-xs truncate mt-0.5">{u.role}</p>
                    </div>
                  </motion.button>
                ))}
              </>
            )}

            {filteredRooms.length === 0 && filteredUsers.length === 0 && (
              <div className="text-center py-10 px-4">
                <p className="text-[#94A3B8] text-sm">No results found.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>);

}