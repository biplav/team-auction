'use client';

import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RealtimeUsersProps {
  socket?: any;
}

export function RealtimeUsers({ socket }: RealtimeUsersProps) {
  const [activeUsers, setActiveUsers] = useState<number>(0);

  useEffect(() => {
    if (!socket) return;

    const handleActiveUsers = (data: { count: number }) => {
      setActiveUsers(data.count);
    };

    socket.on('active-users', handleActiveUsers);

    return () => {
      socket.off('active-users', handleActiveUsers);
    };
  }, [socket]);

  return (
    <div className="flex items-center gap-2 bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-sm">
      <Users className="h-4 w-4 text-gray-600" />
      <span className="text-sm font-medium text-gray-700">
        Watching Now:
      </span>
      <Badge variant="default" className="min-w-[50px] justify-center">
        <span className="animate-pulse mr-1">●</span>
        {activeUsers}
      </Badge>
    </div>
  );
}
