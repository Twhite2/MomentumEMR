'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@momentum/ui';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface User {
  id: number;
  name: string;
  role: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onMentionSelect?: (userIds: number[]) => void;
  placeholder?: string;
  className?: string;
}

export function MentionInput({
  value,
  onChange,
  onMentionSelect,
  placeholder,
  className,
}: MentionInputProps) {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionedUserIds, setMentionedUserIds] = useState<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch users for mentions
  const { data: users } = useQuery<User[]>({
    queryKey: ['chat-mention-users', mentionSearch],
    queryFn: async () => {
      const response = await axios.get(`/api/chat/users?search=${mentionSearch}`);
      return response.data;
    },
    enabled: showMentions,
  });

  // Detect @ symbol and show dropdown
  useEffect(() => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Check if there's no space after @
      if (!textAfterAt.includes(' ')) {
        setMentionSearch(textAfterAt);
        setShowMentions(true);
        return;
      }
    }

    setShowMentions(false);
  }, [value, cursorPosition]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setCursorPosition(e.target.selectionStart || 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showMentions || !users || users.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % users.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + users.length) % users.length);
    } else if (e.key === 'Enter' && showMentions) {
      e.preventDefault();
      handleMentionSelect(users[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (user: User) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const textAfterCursor = value.substring(cursorPosition);

    // Replace @search with @username
    const newValue =
      value.substring(0, lastAtIndex) +
      `@${user.name} ` +
      textAfterCursor;

    onChange(newValue);
    setShowMentions(false);
    setSelectedIndex(0);

    // Track mentioned user IDs
    const newMentionedUserIds = [...mentionedUserIds, user.id];
    setMentionedUserIds(newMentionedUserIds);
    if (onMentionSelect) {
      onMentionSelect(newMentionedUserIds);
    }

    // Refocus input
    setTimeout(() => {
      inputRef.current?.focus();
      const newCursorPos = lastAtIndex + user.name.length + 2;
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <div className="relative flex-1">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />

      {/* Mention Dropdown */}
      {showMentions && users && users.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full left-0 mb-2 w-full max-w-sm bg-white border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto z-50"
        >
          <div className="p-2">
            <p className="text-xs text-muted-foreground mb-2 px-2">
              Mention someone
            </p>
            {users.map((user, index) => (
              <button
                key={user.id}
                onClick={() => handleMentionSelect(user)}
                className={`w-full text-left p-2 rounded-md transition-colors ${
                  index === selectedIndex
                    ? 'bg-tory-blue/10 text-tory-blue'
                    : 'hover:bg-muted'
                }`}
              >
                <p className="font-medium text-sm">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user.role}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
