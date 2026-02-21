import React, { useEffect, useState, useRef } from 'react';
import {
  ArrowLeft,
  Send,
  Paperclip,
  Smile,
  Phone,
  MoreVertical,
  Search } from
'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
interface MobileChatProps {
  onBack: () => void;
}
const contacts = [
{
  id: 1,
  name: '#general',
  type: 'channel',
  unread: 3,
  last: 'Emeka: Payroll done ✓',
  time: '2m',
  color: '#00D084',
  initials: '#'
},
{
  id: 2,
  name: '#payroll-alerts',
  type: 'channel',
  unread: 0,
  last: 'System: ₦1.84M sent',
  time: '1h',
  color: '#F59E0B',
  initials: '#'
},
{
  id: 3,
  name: 'Amaka Eze',
  type: 'dm',
  unread: 2,
  last: 'Can I take tomorrow off?',
  time: '5m',
  color: '#3B82F6',
  initials: 'AE'
},
{
  id: 4,
  name: 'Chidi Nwosu',
  type: 'dm',
  unread: 0,
  last: 'Thanks boss 🙏',
  time: '1h',
  color: '#8B5CF6',
  initials: 'CN'
},
{
  id: 5,
  name: 'Fatima Bello',
  type: 'dm',
  unread: 0,
  last: 'Report attached',
  time: '2h',
  color: '#F59E0B',
  initials: 'FB'
},
{
  id: 6,
  name: 'Tunde Fashola',
  type: 'dm',
  unread: 0,
  last: 'Server is back online',
  time: 'Yesterday',
  color: '#06B6D4',
  initials: 'TF'
}];

const initialMessages = [
{
  id: 1,
  sender: 'Amaka Eze',
  initials: 'AE',
  color: '#3B82F6',
  text: 'Good morning sir! The February payroll has been processed?',
  time: '08:05',
  mine: false
},
{
  id: 2,
  sender: 'Me',
  initials: 'EO',
  color: '#00D084',
  text: 'Yes, all 24 workers have been paid. Check the transactions tab.',
  time: '08:07',
  mine: true
},
{
  id: 3,
  sender: 'Amaka Eze',
  initials: 'AE',
  color: '#3B82F6',
  text: 'Perfect! Also, can I take tomorrow off? I have a family event.',
  time: '08:09',
  mine: false
},
{
  id: 4,
  sender: 'Me',
  initials: 'EO',
  color: '#00D084',
  text: 'Sure, no problem. Just make sure the morning cash count is done before you leave today.',
  time: '08:11',
  mine: true
},
{
  id: 5,
  sender: 'Amaka Eze',
  initials: 'AE',
  color: '#3B82F6',
  text: 'Will do! Thank you so much sir 🙏',
  time: '08:12',
  mine: false
},
{
  id: 6,
  sender: 'Me',
  initials: 'EO',
  color: '#00D084',
  text: "Also, please send me the weekly sales report when you're done.",
  time: '08:15',
  mine: true
},
{
  id: 7,
  sender: 'Amaka Eze',
  initials: 'AE',
  color: '#3B82F6',
  text: "Of course! I'll have it ready by 3pm today.",
  time: '08:16',
  mine: false
},
{
  id: 8,
  sender: 'Amaka Eze',
  initials: 'AE',
  color: '#3B82F6',
  text: 'Can I take tomorrow off?',
  time: '09:42',
  mine: false
}];

type View = 'list' | 'chat';
export function MobileChat({ onBack }: MobileChatProps) {
  const [view, setView] = useState<View>('list');
  const [activeContact, setActiveContact] = useState(contacts[2]);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (view === 'chat') {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'smooth'
      });
    }
  }, [messages, view]);
  const sendMessage = () => {
    if (!input.trim()) return;
    const now = new Date();
    const time = now.toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    setMessages((prev) => [
    ...prev,
    {
      id: prev.length + 1,
      sender: 'Me',
      initials: 'EO',
      color: '#00D084',
      text: input.trim(),
      time,
      mine: true
    }]
    );
    setInput('');
  };
  const filteredContacts = contacts.filter((c) =>
  c.name.toLowerCase().includes(search.toLowerCase())
  );
  if (view === 'chat') {
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
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 relative"
            style={{
              backgroundColor: activeContact.color + '30',
              color: activeContact.color
            }}>

            {activeContact.initials}
            {activeContact.type === 'dm' &&
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#00D084] rounded-full border-2 border-[#161B27]" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#F1F5F9] text-sm font-semibold truncate">
              {activeContact.name}
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

          {messages.map((msg, i) =>
          <motion.div
            key={msg.id}
            initial={{
              opacity: 0,
              y: 8
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              duration: 0.15,
              delay: i < 7 ? 0 : 0
            }}
            className={`flex gap-2 ${msg.mine ? 'flex-row-reverse' : ''}`}>

              {!msg.mine &&
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 self-end mb-1"
              style={{
                backgroundColor: msg.color + '30',
                color: msg.color
              }}>

                  {msg.initials}
                </div>
            }
              <div
              className={`max-w-[72%] flex flex-col gap-0.5 ${msg.mine ? 'items-end' : 'items-start'}`}>

                <div
                className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.mine ? 'bg-[#00D084] text-[#0F1117] rounded-tr-sm font-medium' : 'bg-[#161B27] text-[#F1F5F9] rounded-tl-sm border border-[#1E2535]'}`}>

                  {msg.text}
                </div>
                <p className="text-[#475569] text-[10px] px-1">{msg.time}</p>
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
              onClick={sendMessage}
              className="w-8 h-8 bg-[#00D084] rounded-xl flex items-center justify-center text-[#0F1117] active:scale-95 transition-transform">

              <Send size={13} />
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
        {/* Channels */}
        <div className="px-4 pt-4 pb-1">
          <p className="text-[#475569] text-xs font-semibold uppercase tracking-wider">
            Channels
          </p>
        </div>
        {filteredContacts.
        filter((c) => c.type === 'channel').
        map((c, i) =>
        <motion.button
          key={c.id}
          initial={{
            opacity: 0,
            x: -10
          }}
          animate={{
            opacity: 1,
            x: 0
          }}
          transition={{
            delay: i * 0.05
          }}
          onClick={() => {
            setActiveContact(c);
            setView('chat');
          }}
          className="w-full flex items-center gap-3 px-4 py-3 active:bg-[#1E2535] transition-colors">

              <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{
              backgroundColor: c.color + '20',
              color: c.color
            }}>

                #
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[#F1F5F9] text-sm font-semibold truncate">
                  {c.name}
                </p>
                <p className="text-[#475569] text-xs truncate mt-0.5">
                  {c.last}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span className="text-[#475569] text-xs">{c.time}</span>
                {c.unread > 0 &&
            <span className="w-5 h-5 bg-[#00D084] rounded-full text-[#0F1117] text-xs font-bold flex items-center justify-center">
                    {c.unread}
                  </span>
            }
              </div>
            </motion.button>
        )}

        {/* DMs */}
        <div className="px-4 pt-4 pb-1">
          <p className="text-[#475569] text-xs font-semibold uppercase tracking-wider">
            Direct Messages
          </p>
        </div>
        {filteredContacts.
        filter((c) => c.type === 'dm').
        map((c, i) =>
        <motion.button
          key={c.id}
          initial={{
            opacity: 0,
            x: -10
          }}
          animate={{
            opacity: 1,
            x: 0
          }}
          transition={{
            delay: (i + 2) * 0.05
          }}
          onClick={() => {
            setActiveContact(c);
            setView('chat');
          }}
          className="w-full flex items-center gap-3 px-4 py-3 active:bg-[#1E2535] transition-colors">

              <div className="relative flex-shrink-0">
                <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold"
              style={{
                backgroundColor: c.color + '30',
                color: c.color
              }}>

                  {c.initials}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00D084] rounded-full border-2 border-[#0F1117]" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[#F1F5F9] text-sm font-semibold truncate">
                  {c.name}
                </p>
                <p className="text-[#475569] text-xs truncate mt-0.5">
                  {c.last}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span className="text-[#475569] text-xs">{c.time}</span>
                {c.unread > 0 &&
            <span className="w-5 h-5 bg-[#00D084] rounded-full text-[#0F1117] text-xs font-bold flex items-center justify-center">
                    {c.unread}
                  </span>
            }
              </div>
            </motion.button>
        )}
      </div>
    </div>);

}