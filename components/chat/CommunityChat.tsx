

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { CommunityChatMessage } from '../../types';
import { Avatar, Spinner } from '../ui/Core';
import { Button, ConfirmationModal } from '../common/Core';

const Message: React.FC<{ message: CommunityChatMessage; isCurrentUser: boolean, onDelete: (messageId: string) => void; }> = ({ message, isCurrentUser, onDelete }) => {
  const { profile } = useAuth();
  const { markCommunityMessageAsRead } = useData();
  const ref = useRef<HTMLDivElement>(null);
  const messageAlignment = isCurrentUser ? 'justify-end' : 'justify-start';
  const bubbleStyles = isCurrentUser
    ? 'bg-primary text-white'
    : 'bg-neutral-200 text-neutral-800';

  useEffect(() => {
    if (!ref.current || isCurrentUser || !profile || message.readBy?.[profile.id]) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          markCommunityMessageAsRead(message.id);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [message.id, isCurrentUser, profile, message.readBy, markCommunityMessageAsRead]);

  const formatTimestamp = (timestamp: number | object): string => {
    if (typeof timestamp !== 'number') return '';
    const date = new Date(timestamp);
    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const day = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    return `${time}, ${day}`;
  };

  const hasBeenSeenByOthers = Object.keys(message.readBy || {}).length > 1;

  return (
    <div ref={ref} className={`flex items-end gap-2 ${messageAlignment} group`}>
      {!isCurrentUser && <Avatar src={message.senderAvatar} name={message.senderName} size="sm" />}
      
      {isCurrentUser && (
        <button 
          onClick={() => onDelete(message.id)} 
          className="text-neutral-400 hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Delete message"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
        </button>
      )}

      <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        {!isCurrentUser && <span className="text-xs text-neutral-500 ml-2 mb-0.5">{message.senderName}</span>}
        <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${bubbleStyles}`}>
          <p className="text-sm">{message.text}</p>
        </div>
        <div className="flex items-center text-xs mt-1 px-2">
            <span className="text-neutral-400">{formatTimestamp(message.timestamp)}</span>
            {isCurrentUser && hasBeenSeenByOthers && (
                <div className="flex items-center gap-1 ml-2 text-neutral-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Seen</span>
                </div>
            )}
        </div>
      </div>
      {isCurrentUser && <Avatar src={message.senderAvatar} name={message.senderName} size="sm" />}
    </div>
  );
};

const CommunityChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { profile } = useAuth();
  const { communityMessages, sendCommunityMessage, deleteCommunityMessage } = useData();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; messageId: string | null }>({ isOpen: false, messageId: null });

  const sortedMessages = [...communityMessages].sort((a, b) => (a.timestamp as number) - (b.timestamp as number));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
        scrollToBottom();
    }
  }, [sortedMessages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !profile) return;

    setSending(true);
    try {
        await sendCommunityMessage(newMessage);
        setNewMessage('');
    } catch (error) {
        console.error("Failed to send community message:", error);
        alert("Could not send message. Please try again.");
    } finally {
        setSending(false);
    }
  };
  
  const handleDeleteRequest = (messageId: string) => {
    setConfirmDelete({ isOpen: true, messageId: messageId });
  };
  
  const handleConfirmDelete = async () => {
    if (confirmDelete.messageId) {
        try {
            await deleteCommunityMessage(confirmDelete.messageId);
        } catch(error) {
            console.error("Failed to delete community message:", error);
            alert("Could not delete message.");
        }
    }
    setConfirmDelete({ isOpen: false, messageId: null });
  };


  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className="bg-primary hover:bg-indigo-700 text-white font-bold p-4 rounded-full shadow-lg flex items-center justify-center transition-transform transform hover:scale-110"
            aria-label="Open community chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50 w-[calc(100%-2rem)] sm:w-full max-w-sm bg-white rounded-xl shadow-2xl flex flex-col h-[70vh] sm:h-[600px]">
          {/* Header */}
          <div className="flex justify-between items-center p-4 bg-white rounded-t-xl border-b">
            <h3 className="text-lg font-bold text-neutral-800">📢 Community Hub</h3>
            <button 
              onClick={() => setIsOpen(false)} 
              className="text-neutral-500 hover:text-neutral-800"
              aria-label="Close community chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Messages */}
          <div className="flex-grow p-4 space-y-4 overflow-y-auto bg-neutral-100">
            {sortedMessages.map((msg) => (
              <Message key={msg.id} message={msg} isCurrentUser={msg.senderId === profile?.id} onDelete={handleDeleteRequest}/>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Form */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white rounded-b-xl border-t flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Chat with the community..."
              className="flex-grow px-3 py-2 border border-neutral-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              disabled={sending}
            />
            <Button type="submit" disabled={sending || !newMessage.trim()}>
              {sending ? <Spinner size="sm" /> : 'Send'}
            </Button>
          </form>
        </div>
      )}
      
      <ConfirmationModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, messageId: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Message"
        message="Are you sure you want to permanently delete this message?"
        confirmText="Delete"
        confirmVariant="danger"
      />
    </>
  );
};

export default CommunityChat;