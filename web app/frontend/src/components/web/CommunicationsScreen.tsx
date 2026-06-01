import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Send, Loader2, MessageSquare, Mail, Check
} from 'lucide-react';
import { chatApi, emailApi, staffApi } from '../../services/api';
import { socketService } from '../../services/socket';
import { useToast } from './Toast';

export function CommunicationsScreen() {
  const toast = useToast();

  // Tabs
  const [activeTab, setActiveTab] = useState<'chat' | 'email'>('chat');

  // Chat State
  const [rooms, setRooms] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageCache, setMessageCache] = useState<Record<string, any[]>>({});
  const [chatUsers, setChatUsers] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Email State
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    loadRooms();
    loadUsers();
    loadStaff();
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // SOCKET.IO INTEGRATION
  useEffect(() => {
    const socket = socketService.connect();

    const handleNewMessage = (data: { roomId: string, message: any }) => {
      setMessageCache(prev => {
        const roomHistory = prev[data.roomId] || [];
        if (roomHistory.find(m => m.id === data.message.id)) return prev;
        return { ...prev, [data.roomId]: [...roomHistory, data.message] };
      });

      if (data.roomId === activeRoom) {
        setMessages(prev => {
          if (prev.find(m => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
      
      // Update room list locally instead of API call
      setRooms(prevRooms => prevRooms.map(room => {
        if (room.id === data.roomId) {
          return { ...room, lastMessage: data.message };
        }
        return room;
      }));
    };

    socket?.on('new_message', handleNewMessage);

    return () => {
      socket?.off('new_message', handleNewMessage);
    };
  }, [activeRoom]);

  useEffect(() => {
    if (activeRoom) {
      if (messageCache[activeRoom]) {
        setMessages(messageCache[activeRoom]);
      } else {
        setMessages([]);
      }
      loadMessages(activeRoom);
      socketService.getSocket()?.emit('join_room', { roomId: activeRoom });
    }
  }, [activeRoom]);

  const loadRooms = async () => {
    setIsLoading(true);
    try {
      const res = await chatApi.getRooms();
      setRooms(res.data);
      if (res.data.length > 0 && !activeRoom) setActiveRoom(res.data[0].id);
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
      setMessageCache(prev => ({ ...prev, [roomId]: res.data }));
    } catch { }
  };

  const loadStaff = async () => {
    try {
      const res = await staffApi.getAll();
      setStaffList(res.data.filter((s: any) => s.email));
    } catch { }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !activeRoom) return;
    
    // Optimistic UI Update
    const tempId = `temp-${Date.now()}`;
    const text = newMessage.trim();
    const tempMsg = {
        id: tempId,
        text: text,
        senderId: 'me',
        senderName: 'Me',
        sentAt: new Date().toISOString(),
        isMine: true
    };
    
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');
    setIsSending(true);
    
    try {
      await chatApi.sendMessage(activeRoom, text);
    } catch { 
        toast.error("Failed to send message");
    } finally { setIsSending(false); }
  };

  const handleUserClick = async (userId: string) => {
    setIsLoading(true);
    try {
      const res = await chatApi.createRoom({
        type: 'DM',
        memberIds: [userId]
      });
      setActiveRoom(res.data.id);
      await loadRooms();
    } catch (e: any) {
      toast.error('Failed to start chat');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailSubject || !emailBody) {
      toast.warning('Please fill out subject and body');
      return;
    }

    setIsSendingEmail(true);
    try {
      const res = await emailApi.sendBulk({
        subject: emailSubject,
        message: emailBody,
        staffIds: selectedStaff.length > 0 ? selectedStaff : undefined
      });

      if (res.data.success) {
        toast.success(`Emails sent successfully to ${res.data.sentCount} staff members`);
        setEmailSubject('');
        setEmailBody('');
      } else {
        toast.error('Failed to send emails');
      }
    } catch (e: any) {
      toast.error('Failed to send bulk email: ' + (e?.response?.data?.message || e.message));
    } finally {
      setIsSendingEmail(false);
    }
  };

  const toggleStaffSelection = (id: string) => {
    setSelectedStaff(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const activeRoomData = rooms.find(r => r.id === activeRoom);

  if (isLoading) {
    return <div className="h-full flex items-center justify-center"><Loader2 size={32} className="text-[#00D084] animate-spin" /></div>;
  }

  const inputClass = 'w-full bg-[#161B27] border border-[#1E2535] rounded-xl px-4 py-2.5 text-[#F1F5F9] text-sm placeholder-[#475569] focus:outline-none focus:border-[#00D084] transition-colors';

  return (
    <div className="h-full flex flex-col">
      {/* Top Navigation for Comms */}
      <div className="px-6 py-4 border-b border-[#1E2535] flex items-center gap-4 bg-[#0F1117] flex-shrink-0">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'chat' ? 'bg-[#00D084]/10 text-[#00D084]' : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#161B27]'}`}
        >
          <MessageSquare size={16} /> Team Chat
        </button>
        <button
          onClick={() => setActiveTab('email')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'email' ? 'bg-[#3B82F6]/10 text-[#3B82F6]' : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#161B27]'}`}
        >
          <Mail size={16} /> Bulk Email
        </button>
      </div>

      {activeTab === 'chat' ? (
        <div className="flex-1 flex min-h-0">
          {/* Room List Sidebar */}
          <div className="w-80 border-r border-[#1E2535] flex flex-col bg-[#0F1117]">
            <div className="p-4 border-b border-[#1E2535]">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />
                <input placeholder="Search chats..." className="w-full bg-[#161B27] border border-[#1E2535] rounded-xl pl-9 pr-3 py-2 text-[#F1F5F9] text-sm placeholder-[#475569] focus:outline-none focus:border-[#00D084]" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {/* Rooms Section */}
              {rooms.length > 0 && (
                <div className="mb-4">
                  <h4 className="px-4 py-2 text-xs font-bold text-[#475569] uppercase tracking-wider">Recent Chats</h4>
                  {rooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => setActiveRoom(room.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#161B27] transition-colors text-left ${activeRoom === room.id ? 'bg-[#161B27] border-l-2 border-[#00D084]' : 'border-l-2 border-transparent'}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#3B82F6] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {room.name?.slice(0, 2).toUpperCase() || '??'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#F1F5F9] text-sm font-medium truncate">{room.name || 'Chat'}</p>
                        <p className="text-[#475569] text-xs truncate">{room.lastMessage?.text || 'No messages yet'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Team Directory Section */}
              <div>
                <h4 className="px-4 py-2 text-xs font-bold text-[#475569] uppercase tracking-wider">Team Directory</h4>
                {chatUsers.length === 0 ? (
                  <div className="px-4 py-2 text-[#94A3B8] text-xs">No other staff members found.</div>
                ) : (
                  chatUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleUserClick(u.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#161B27] transition-colors text-left border-l-2 border-transparent"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6] text-sm font-bold flex-shrink-0 border border-[#3B82F6]/30">
                        {u.name?.slice(0, 2).toUpperCase() || '??'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#F1F5F9] text-sm font-medium flex items-center gap-2 truncate">
                          {u.name}
                          {u.inviteStatus === 'PENDING' && (
                            <span className="text-[10px] text-[#F59E0B] bg-[#F59E0B]/10 px-1.5 py-0.5 rounded font-bold">
                              PENDING
                            </span>
                          )}
                        </p>
                        <p className="text-[#475569] text-xs truncate">{u.role}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="flex-1 flex flex-col bg-[#0A0E1A]">
            {!activeRoom ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare size={48} className="text-[#475569] mx-auto mb-4" />
                  <h3 className="text-[#F1F5F9] text-lg font-semibold mb-2">Select a conversation</h3>
                  <p className="text-[#94A3B8] text-sm">Choose a chat from the sidebar to start messaging</p>
                </div>
              </div>
            ) : (
              <>
                <div className="px-6 py-4 border-b border-[#1E2535] flex items-center justify-between bg-[#0F1117]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#3B82F6] flex items-center justify-center text-white text-sm font-bold">
                      {activeRoomData?.name?.slice(0, 2).toUpperCase() || '??'}
                    </div>
                    <div>
                      <p className="text-[#F1F5F9] text-sm font-semibold">{activeRoomData?.name || 'Chat'}</p>
                      <p className="text-[#475569] text-xs">{activeRoomData?.members?.length || 0} members</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-[#475569] text-sm">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] ${msg.isMine ? 'order-2' : ''}`}>
                          {!msg.isMine && (
                            <p className="text-[#94A3B8] text-xs mb-1 ml-1">{msg.senderName}</p>
                          )}
                          <div className={`rounded-2xl px-4 py-2.5 ${msg.isMine ? 'bg-[#00D084] text-[#0F1117]' : 'bg-[#161B27] text-[#F1F5F9] border border-[#1E2535]'}`}>
                            <p className="text-sm">{msg.text}</p>
                            <p className={`text-xs mt-1 ${msg.isMine ? 'text-[#0F1117]/60' : 'text-[#475569]'}`}>
                              {new Date(msg.sentAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="px-6 py-4 border-t border-[#1E2535] bg-[#0F1117]">
                  <div className="flex items-center gap-3">
                    <input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Type a message..."
                      className={inputClass}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!newMessage.trim() || isSending}
                      className="p-2.5 bg-[#00D084] hover:bg-[#00b872] disabled:opacity-50 rounded-xl transition-colors"
                    >
                      {isSending ? <Loader2 size={18} className="text-[#0F1117] animate-spin" /> : <Send size={18} className="text-[#0F1117]" />}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Email Interface */
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h2 className="text-[#F1F5F9] text-xl font-bold">Bulk Email Composer</h2>
              <p className="text-[#94A3B8] text-sm">Send updates, schedules, or alerts to your staff</p>
            </div>

            <div className="flex gap-6">
              {/* Composer */}
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-[#94A3B8] text-xs mb-1 font-semibold">Subject *</label>
                  <input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Weekly update..."
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[#94A3B8] text-xs mb-1 font-semibold">Message Body *</label>
                  <textarea
                    rows={12}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Type your message here. Markdown or plain text works best..."
                    className={`${inputClass} resize-none`}
                  />
                </div>
                <div className="pt-2">
                  <button
                    onClick={handleSendEmail}
                    disabled={isSendingEmail || !emailSubject || !emailBody}
                    className="w-full bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    {isSendingEmail ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                    {selectedStaff.length === 0 ? 'Send to All Staff' : `Send to ${selectedStaff.length} Selected Staff`}
                  </button>
                </div>
              </div>

              {/* Staff Select Box */}
              <div className="w-80 bg-[#161B27] border border-[#1E2535] rounded-2xl flex flex-col overflow-hidden h-[500px]">
                <div className="p-4 border-b border-[#1E2535] bg-[#0F1117]">
                  <h3 className="text-[#F1F5F9] text-sm font-semibold">Recipients</h3>
                  <p className="text-[#475569] text-xs">Select specific staff or leave empty to send to all</p>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  {staffList.length === 0 ? (
                    <p className="text-center text-[#475569] text-xs py-4">No staff with emails found</p>
                  ) : (
                    staffList.map(staff => (
                      <button
                        key={staff.id}
                        onClick={() => toggleStaffSelection(staff.id)}
                        className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-colors ${selectedStaff.includes(staff.id) ? 'bg-[#3B82F6]/10' : 'hover:bg-[#0F1117]'}`}
                      >
                        <div>
                          <p className={`text-sm font-medium ${selectedStaff.includes(staff.id) ? 'text-[#3B82F6]' : 'text-[#F1F5F9]'}`}>{staff.name}</p>
                          <p className="text-[#475569] text-xs">{staff.email}</p>
                        </div>
                        {selectedStaff.includes(staff.id) && (
                          <Check size={16} className="text-[#3B82F6]" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}