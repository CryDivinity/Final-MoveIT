import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronDown, Circle } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface UserStatusManagerProps {
  user: User;
  profile: any;
}

type UserStatus = 'online' | 'offline' | 'inactive';

const UserStatusManager = ({ user, profile }: UserStatusManagerProps) => {
  const [userStatus, setUserStatus] = useState<UserStatus>('online');
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null);

  // Update last activity time
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
    if (userStatus === 'inactive') {
      setUserStatus('online');
    }
  }, [userStatus]);

  // Set up activity listeners
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, [updateActivity]);

  // Set up inactivity timer
  useEffect(() => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }

    const timer = setTimeout(() => {
      if (userStatus === 'online') {
        setUserStatus('inactive');
      }
    }, 2 * 60 * 1000); // 2 minutes

    setInactivityTimer(timer);

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [lastActivity, userStatus]);

  const handleStatusChange = (status: UserStatus) => {
    setUserStatus(status);
    if (status === 'online') {
      setLastActivity(Date.now());
    }
  };

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'offline': return 'text-gray-400';
      case 'inactive': return 'text-yellow-500';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = (status: UserStatus) => {
    switch (status) {
      case 'online': return 'Online';
      case 'offline': return 'Offline';
      case 'inactive': return 'Inactive';
      default: return 'Unknown';
    }
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-background/95 backdrop-blur-lg border border-border/20 rounded-xl">
      {/* User Avatar */}
      <div className="relative">
        <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
          <AvatarImage src={profile?.avatar_url} />
          <AvatarFallback className="text-xs sm:text-sm">
            {profile?.first_name?.[0] || user.email?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {/* Status Indicator */}
        <div className={`absolute -bottom-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-background border-2 border-background flex items-center justify-center`}>
          <Circle className={`h-2 w-2 sm:h-2.5 sm:w-2.5 fill-current ${getStatusColor(userStatus)}`} />
        </div>
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-xs sm:text-sm font-semibold text-foreground truncate">
          {profile?.first_name && profile?.last_name 
            ? `${profile.first_name} ${profile.last_name}`
            : user.email?.split('@')[0]
          }
        </h3>
        <p className="text-xs text-muted-foreground hidden sm:block">{user.email}</p>
      </div>

      {/* Status Dropdown - Hidden on small screens */}
      <div className="hidden sm:block">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-auto p-2 gap-1">
              <div className="flex items-center gap-2">
                <Circle className={`h-3 w-3 fill-current ${getStatusColor(userStatus)}`} />
                <span className="text-xs">{getStatusText(userStatus)}</span>
                <ChevronDown className="h-3 w-3" />
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-2" align="end">
            <div className="space-y-1">
              {(['online', 'offline', 'inactive'] as UserStatus[]).map((status) => (
                <Button
                  key={status}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 h-8"
                  onClick={() => handleStatusChange(status)}
                >
                  <Circle className={`h-3 w-3 fill-current ${getStatusColor(status)}`} />
                  <span className="text-xs">{getStatusText(status)}</span>
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default UserStatusManager;