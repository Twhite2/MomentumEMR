'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { MessageCircle, Users, Send, Paperclip, Search, Plus, X, FileText, Image as ImageIcon, Pin } from 'lucide-react';
import { Button, Input } from '@momentum/ui';
import { format } from 'date-fns';
import { MentionInput } from '@/components/chat/mention-input';
import { toast } from 'sonner';

interface ChatUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface ChatRoom {
  id: number;
  roomType: 'general' | 'private';
  name: string | null;
  unreadCount: number;
  lastMessageAt: string;
  participants: Array<{
    user: ChatUser;
  }>;
}

interface ChatMessage {
  id: number;
  content: string;
  senderId: number;
  sender: ChatUser;
  createdAt: string;
  mentionedUserIds: number[];
  attachments: Array<{
    id: number;
    originalFileName: string;
    fileType: string;
    fileSize: number;
  }>;
}

export default function ChatPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [mentionedUserIds, setMentionedUserIds] = useState<number[]>([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [searchUsers, setSearchUsers] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<{
    id: number;
    fileName: string;
    fileSize: number;
    fileType: string;
  } | null>(null);

  // Fetch general chat room (auto-creates and joins user)
  const { data: generalRoom, error: generalError } = useQuery<ChatRoom>({
    queryKey: ['chat-general'],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/chat/general');
        console.log('General room loaded:', response.data);
        return response.data;
      } catch (error) {
        console.error('Failed to load general chat:', error);
        throw error;
      }
    },
    refetchInterval: 5000, // Poll for new messages in general chat
    retry: 3,
  });

  // Fetch all chat rooms
  const { data: privateRooms, isLoading: loadingRooms } = useQuery<ChatRoom[]>({
    queryKey: ['chat-rooms'],
    queryFn: async () => {
      const response = await axios.get('/api/chat/rooms');
      console.log('Private rooms loaded:', response.data);
      return response.data;
    },
    refetchInterval: 5000, // Poll every 5 seconds for new messages
  });

  // Combine general room and private rooms - General room ALWAYS first
  // Filter out any general rooms from privateRooms to avoid duplicates
  const filteredPrivateRooms = (privateRooms || []).filter(room => room.roomType !== 'general');
  const rooms = generalRoom ? [generalRoom, ...filteredPrivateRooms] : filteredPrivateRooms;
  
  console.log('Combined rooms:', rooms.map(r => ({ id: r.id, name: r.name, type: r.roomType })));

  // Fetch messages for selected room
  const { data: messages, isLoading: loadingMessages } = useQuery<ChatMessage[]>({
    queryKey: ['chat-messages', selectedRoomId],
    queryFn: async () => {
      if (!selectedRoomId) return [];
      const response = await axios.get(`/api/chat/messages?roomId=${selectedRoomId}`);
      return response.data;
    },
    enabled: !!selectedRoomId,
    refetchInterval: 3000, // Poll every 3 seconds for new messages
  });

  // Fetch users for new chat
  const { data: users } = useQuery<ChatUser[]>({
    queryKey: ['chat-users', searchUsers],
    queryFn: async () => {
      const response = await axios.get(`/api/chat/users?search=${searchUsers}`);
      return response.data;
    },
    enabled: showNewChatModal,
  });

  const selectedRoom = rooms?.find((r) => r.id === selectedRoomId);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) return;
    
    // Must have either message text or attachment
    if (!messageInput.trim() && !pendingAttachment) return;

    try {
      // Send message (with or without text)
      const content = messageInput.trim() || (pendingAttachment ? '[File attachment]' : '');
      const response = await axios.post('/api/chat/messages', {
        roomId: selectedRoomId,
        content,
        mentionedUserIds,
      });

      // Link attachment to message if exists
      if (pendingAttachment) {
        await axios.patch(`/api/chat/upload/${pendingAttachment.id}`, {
          messageId: response.data.id,
        });
      }
      
      setMessageInput('');
      setMentionedUserIds([]);
      setPendingAttachment(null);
      
      // Immediately refetch messages and rooms
      await queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedRoomId] });
      await queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
      await queryClient.invalidateQueries({ queryKey: ['chat-general'] });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRoomId) return;

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB');
      e.target.value = '';
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Allowed: PDF, JPG, PNG, DOCX, XLSX');
      e.target.value = '';
      return;
    }

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('roomId', selectedRoomId.toString());

    try {
      const response = await axios.post('/api/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      // Store attachment info to show preview
      setPendingAttachment({
        id: response.data.id,
        fileName: response.data.originalFileName,
        fileSize: response.data.fileSize,
        fileType: response.data.fileType,
      });
      
      toast.success('File attached. Add message or send now.');
      // Clear file input
      e.target.value = '';
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveAttachment = () => {
    setPendingAttachment(null);
    toast.success('Attachment removed');
  };

  const handleCreatePrivateChat = async (userId: number) => {
    try {
      const response = await axios.post('/api/chat/rooms', {
        roomType: 'private',
        participantId: userId,
      });
      setSelectedRoomId(response.data.id);
      setShowNewChatModal(false);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const getRoomDisplayName = (room: ChatRoom) => {
    if (room.roomType === 'general') {
      return room.name || 'General Chat';
    }
    // For private chat, show other participant's name
    const otherUser = room.participants.find((p) => p.user.id !== parseInt(session?.user?.id || '0'));
    return otherUser?.user.name || 'Private Chat';
  };

  if (loadingRooms) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar - Chat List */}
      <div className="w-80 border-r border-border bg-white flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Messages</h1>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowNewChatModal(true)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {generalError && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
              Failed to load General Chat. Please refresh the page.
            </div>
          )}
          {rooms?.map((room, index) => (
            <div key={room.id}>
              <button
                onClick={() => setSelectedRoomId(room.id)}
                className={`w-full p-4 border-b border-border text-left transition-colors ${
                  room.roomType === 'general'
                    ? selectedRoomId === room.id
                      ? 'bg-primary/15'
                      : 'bg-primary/5 hover:bg-primary/10'
                    : selectedRoomId === room.id
                    ? 'bg-primary/10'
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    {room.roomType === 'general' ? (
                      <Users className="w-5 h-5 text-primary" />
                    ) : (
                      <MessageCircle className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {room.roomType === 'general' && (
                        <Pin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      )}
                      <p className="font-semibold truncate">{getRoomDisplayName(room)}</p>
                      {room.roomType === 'general' && (
                        <span className="bg-primary text-white text-xs rounded px-1.5 py-0.5 flex-shrink-0">
                          GROUP
                        </span>
                      )}
                      {room.unreadCount > 0 && (
                        <span className="bg-red-ribbon text-white text-xs rounded-full px-2 py-0.5 ml-auto flex-shrink-0">
                          {room.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {room.roomType === 'general' 
                        ? `${room.participants?.length || 0} members • Pinned`
                        : (room.lastMessageAt
                          ? format(new Date(room.lastMessageAt), 'MMM d, h:mm a')
                          : 'No messages yet')}
                    </p>
                  </div>
                </div>
              </button>
              {room.roomType === 'general' && index === 0 && (
                <div className="border-b-2 border-primary/20"></div>
              )}
            </div>
          ))}

          {rooms?.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="mb-2">No conversations yet</p>
              <p className="text-sm">Start a new chat to begin messaging</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-muted/30">
        {selectedRoomId ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  {selectedRoom?.roomType === 'general' ? (
                    <Users className="w-5 h-5 text-primary" />
                  ) : (
                    <MessageCircle className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">{selectedRoom ? getRoomDisplayName(selectedRoom) : ''}</h2>
                    {selectedRoom?.roomType === 'general' && (
                      <span className="bg-primary text-white text-xs rounded px-1.5 py-0.5">
                        GROUP
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedRoom?.roomType === 'general' 
                      ? `${selectedRoom.participants?.length || 0} members - Team announcements and discussions`
                      : 'Private Conversation'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Loading messages...</p>
                </div>
              ) : messages?.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <MessageCircle className="w-16 h-16 text-muted-foreground opacity-50 mx-auto mb-4" />
                    <p className="text-muted-foreground">No messages yet</p>
                    <p className="text-sm text-muted-foreground">Start the conversation!</p>
                  </div>
                </div>
              ) : (
                messages?.map((message) => {
                  const isOwnMessage = message.senderId === parseInt(session?.user?.id || '0');
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                        {!isOwnMessage && (
                          <p className="text-xs text-muted-foreground mb-1 px-3">
                            {message.sender.name} · {message.sender.role}
                          </p>
                        )}
                        <div
                          className={`rounded-lg p-3 ${
                            isOwnMessage
                              ? 'bg-primary text-white'
                              : 'bg-white border border-border'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          
                          {/* Attachments */}
                          {message.attachments?.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {message.attachments.map((attachment) => (
                                <a
                                  key={attachment.id}
                                  href={`/api/chat/download/${attachment.id}`}
                                  download
                                  className={`flex items-center gap-2 text-xs p-2 rounded ${
                                    isOwnMessage
                                      ? 'bg-white/20 hover:bg-white/30'
                                      : 'bg-muted hover:bg-muted/80'
                                  }`}
                                >
                                  <Paperclip className="w-3 h-3" />
                                  <span className="truncate">{attachment.originalFileName}</span>
                                </a>
                              ))}
                            </div>
                          )}

                          <p
                            className={`text-xs mt-1 ${
                              isOwnMessage ? 'text-white/70' : 'text-muted-foreground'
                            }`}
                          >
                            {format(new Date(message.createdAt), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input */}
            <div className="border-t border-border bg-white">
              {/* Attachment Preview */}
              {pendingAttachment && (
                <div className="px-4 pt-3 pb-2 border-b border-border">
                  <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex-shrink-0">
                      {pendingAttachment.fileType.startsWith('image/') ? (
                        <ImageIcon className="w-8 h-8 text-primary" />
                      ) : (
                        <FileText className="w-8 h-8 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{pendingAttachment.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(pendingAttachment.fileSize)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveAttachment}
                      className="flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="p-4">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    disabled={uploadingFile || !!pendingAttachment}
                  >
                    <Paperclip className={`w-5 h-5 ${uploadingFile ? 'animate-pulse' : ''}`} />
                  </Button>
                  <MentionInput
                    value={messageInput}
                    onChange={setMessageInput}
                    onMentionSelect={setMentionedUserIds}
                    placeholder={
                      pendingAttachment
                        ? 'Add a message (optional) and press send...'
                        : 'Type a message... (use @ to mention someone)'
                    }
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={!messageInput.trim() && !pendingAttachment}
                    className="flex-shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </form>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle className="w-20 h-20 text-muted-foreground opacity-50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">Choose a chat from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Start New Chat</h2>
            
            <Input
              placeholder="Search users..."
              value={searchUsers}
              onChange={(e) => setSearchUsers(e.target.value)}
              className="mb-4"
            />

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {users?.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleCreatePrivateChat(user.id)}
                  className="w-full p-3 border border-border rounded-lg hover:bg-muted/50 text-left transition-colors"
                >
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
                </button>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowNewChatModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
