import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, MessageCircle, Trash2, Ban, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/language-provider';
import type { User } from '@supabase/supabase-js';
import ChatInterface from './ChatInterface';

interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  avatar_url: string | null;
}

interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  requester_profile?: Profile;
  addressee_profile?: Profile;
}

interface FriendsTabProps {
  user: User;
}

const FriendsTab = ({ user }: FriendsTabProps) => {
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [selectedChatUser, setSelectedChatUser] = useState<Profile | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    fetchFriends();
    
    // Subscribe to real-time friendship updates
    const friendshipChannel = supabase
      .channel(`friendships-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `or(requester_id.eq.${user.id},addressee_id.eq.${user.id})`
        },
        () => {
          fetchFriends();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(friendshipChannel);
    };
  }, [user.id]);

  const fetchFriends = async () => {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id,
          requester_id,
          addressee_id,
          status,
          created_at,
          updated_at
        `)
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load friends",
          variant: "destructive",
        });
        return;
      }

      const friendships = data || [];
      const enrichedFriendships = await Promise.all(
        friendships.map(async (friendship) => {
          const [requesterResponse, addresseeResponse] = await Promise.all([
            supabase.from('profiles').select('*').eq('user_id', friendship.requester_id).maybeSingle(),
            supabase.from('profiles').select('*').eq('user_id', friendship.addressee_id).maybeSingle()
          ]);

          return {
            ...friendship,
            status: friendship.status as 'pending' | 'accepted' | 'blocked',
            requester_profile: requesterResponse.data,
            addressee_profile: addresseeResponse.data
          };
        })
      );

      // Filter out friendships where profile data couldn't be loaded
      const validFriendships = enrichedFriendships.filter(friendship => 
        friendship.requester_profile && friendship.addressee_profile
      );

      setFriends(validFriendships);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load friends",
        variant: "destructive",
      });
    }
  };

  const removeFriend = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Friend removed successfully",
      });

      fetchFriends();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove friend",
        variant: "destructive",
      });
    }
  };

  const blockUser = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'blocked' })
        .eq('id', friendshipId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User blocked successfully",
      });

      fetchFriends();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to block user",
        variant: "destructive",
      });
    }
  };

  const unblockUser = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User unblocked successfully",
      });

      fetchFriends();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unblock user",
        variant: "destructive",
      });
    }
  };

  const getFriendProfile = (friendship: Friendship): Profile | null => {
    const profile = friendship.requester_id === user.id 
      ? friendship.addressee_profile 
      : friendship.requester_profile;
    return profile || null;
  };

  // Only render if there are accepted friends
  if (friends.length === 0) {
    return null;
  }

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <div className="interactive-card group">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-green-500/10 rounded-full flex items-center justify-center group-hover:bg-green-500/20 transition-colors relative">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                <Badge 
                  variant="default" 
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {friends.length}
                </Badge>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 text-foreground">{t('friends.title')}</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                {t('friends.description')} {friends.length} {friends.length === 1 ? t('friends.friend') : t('friends.friends')}
              </p>
            </div>
          </div>
        </DialogTrigger>

        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('friends.title')} ({friends.length})
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {friends.map((friendship) => {
              const friendProfile = getFriendProfile(friendship);
              if (!friendProfile) return null;
              
              return (
                <Card key={friendship.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {friendProfile.first_name || 'N/A'} {friendProfile.last_name || ''}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {friendProfile.phone_number || 'No phone number'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => setSelectedChatUser(friendProfile)}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          {t('community.message')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => blockUser(friendship.id)}
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Block
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeFriend(friendship.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }).filter(Boolean)}
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Interface */}
      {selectedChatUser && (
        <ChatInterface 
          currentUser={user}
          chatUser={selectedChatUser}
          onClose={() => setSelectedChatUser(null)}
        />
      )}
    </>
  );
};

export default FriendsTab;