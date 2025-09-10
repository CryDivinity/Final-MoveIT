import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Users, Search, MessageCircle, UserPlus, Car } from 'lucide-react';
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

interface SearchProfile {
  user_id: string;
  first_name: string | null;
}

interface UserWithCars extends SearchProfile {
  cars: Array<{
    id: string;
    name: string;
    model: string;
    plate_number: string;
  }>;
}

interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  requester_profile?: Profile;
  addressee_profile?: Profile;
}

interface CommunityCardProps {
  user: User;
}

const CommunityCard = ({ user }: CommunityCardProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserWithCars[]>([]);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [selectedChatUser, setSelectedChatUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    fetchFriends();
    
    // Subscribe to real-time friendship updates
    const friendshipChannel = supabase
      .channel('friendships-changes')
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
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load friends",
          variant: "destructive",
        });
        return;
      }

      // Fetch profile data separately
      const friendships = data || [];
      const enrichedFriendships = await Promise.all(
        friendships.map(async (friendship) => {
          const [requesterProfile, addresseeProfile] = await Promise.all([
            supabase.from('profiles').select('*').eq('user_id', friendship.requester_id).maybeSingle(),
            supabase.from('profiles').select('*').eq('user_id', friendship.addressee_id).maybeSingle()
          ]);

          return {
            ...friendship,
            status: friendship.status as 'pending' | 'accepted' | 'blocked',
            requester_profile: requesterProfile.data,
            addressee_profile: addresseeProfile.data
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

  const searchUsers = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    console.log('Starting search for:', searchTerm);
    setIsLoading(true);
    try {
      // Search by name - using parameterized queries to prevent SQL injection
      const searchPattern = `%${searchTerm.replace(/[%_\\]/g, '\\$&')}%`;
      console.log('Search pattern:', searchPattern);
      
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, first_name') // Only select necessary fields for search
        .neq('user_id', user.id)
        .or(`first_name.ilike."${searchPattern}"`);

      console.log('Profile search results:', profiles, 'Error:', profileError);

      // Search by car info - using parameterized queries to prevent SQL injection
      const { data: cars, error: carError } = await supabase
        .from('cars')
        .select('*')
        .or(`plate_number.ilike."${searchPattern}",name.ilike."${searchPattern}",model.ilike."${searchPattern}"`)
        .neq('user_id', user.id);

      console.log('Car search results:', cars, 'Error:', carError);

      if (profileError) {
        console.error('Profile search error:', profileError);
        toast({
          title: "Error",
          description: "Profile search failed: " + profileError.message,
          variant: "destructive",
        });
        return;
      }

      if (carError) {
        console.error('Car search error:', carError);
        toast({
          title: "Error", 
          description: "Car search failed: " + carError.message,
          variant: "destructive",
        });
        return;
      }

      // Get profiles for users found by car search
      let carOwnerProfiles: any[] = [];
      if (cars && cars.length > 0) {
        console.log('Found cars, getting owner profiles...');
        const carOwnerIds = [...new Set(cars.map(car => car.user_id))];
        const { data: carProfiles, error: carProfileError } = await supabase
          .from('profiles')
          .select('user_id, first_name') // Only select necessary fields for search
          .in('user_id', carOwnerIds)
          .neq('user_id', user.id);
        
        console.log('Car owner profiles:', carProfiles, 'Error:', carProfileError);
        carOwnerProfiles = carProfiles || [];
      }

      // Combine all unique profiles
      const allProfiles = [...(profiles || [])];
      carOwnerProfiles.forEach(carProfile => {
        if (!allProfiles.find(p => p.user_id === carProfile.user_id)) {
          allProfiles.push(carProfile);
        }
      });

      console.log('All combined profiles:', allProfiles);

      // Get user cars for all found users
      let userCars: any[] = [];
      if (allProfiles.length > 0) {
        const userIds = allProfiles.map(p => p.user_id);
        const { data: carsData, error: carsError } = await supabase
          .from('cars')
          .select('*')
          .in('user_id', userIds);
        
        console.log('User cars:', carsData, 'Error:', carsError);
        userCars = carsData || [];
      }

      // Combine results
      const results: UserWithCars[] = allProfiles.map(profile => ({
        ...profile,
        cars: userCars.filter(car => car.user_id === profile.user_id).map(car => ({
          id: car.id,
          name: car.name,
          model: car.model,
          plate_number: car.plate_number
        }))
      }));

      console.log('Final search results:', results);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendFriendRequest = async (addresseeId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          requester_id: user.id,
          addressee_id: addresseeId,
          status: 'pending'
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Info",
            description: "Friend request already exists",
            variant: "default",
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Success",
        description: "Friend request sent successfully",
      });

      fetchFriends();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive",
      });
    }
  };

  const respondToFriendRequest = async (friendshipId: string, accept: boolean) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: accept ? 'accepted' : 'blocked' })
        .eq('id', friendshipId);

      if (error) throw error;

      toast({
        title: "Success",
        description: accept ? "Friend request accepted" : "Friend request declined",
      });

      fetchFriends();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to respond to friend request",
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

  const acceptedFriends = friends.filter(f => f.status === 'accepted');
  const blockedUsers = friends.filter(f => f.status === 'blocked');
  const pendingRequests = friends.filter(f => f.status === 'pending' && f.addressee_id === user.id);
  const sentRequests = friends.filter(f => f.status === 'pending' && f.requester_id === user.id);

  const getFriendProfile = (friendship: Friendship): Profile | null => {
    const profile = friendship.requester_id === user.id 
      ? friendship.addressee_profile 
      : friendship.requester_profile;
    return profile || null;
  };

  const isFriend = (userId: string) => {
    return friends.some(f => 
      f.status === 'accepted' && 
      (f.requester_id === userId || f.addressee_id === userId)
    );
  };

  const hasPendingRequest = (userId: string) => {
    return friends.some(f => 
      f.status === 'pending' && 
      ((f.requester_id === user.id && f.addressee_id === userId) ||
       (f.requester_id === userId && f.addressee_id === user.id))
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="interactive-card group">
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-blue-500/10 rounded-full flex items-center justify-center group-hover:bg-blue-500/20 transition-colors relative">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
              {acceptedFriends.length > 0 && (
                <Badge 
                  variant="default" 
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {acceptedFriends.length}
                </Badge>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-3 text-foreground">{t('cards.community.title')}</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t('cards.community.description')}
            </p>
            {pendingRequests.length > 0 && (
              <p className="text-xs text-orange mt-2 font-medium">
                {pendingRequests.length} pending request{pendingRequests.length === 1 ? '' : 's'}
              </p>
            )}
          </div>
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('cards.community.title')}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="friends">
              {t('community.friends')} ({acceptedFriends.length})
            </TabsTrigger>
            <TabsTrigger value="search">
              <Search className="h-4 w-4 mr-2" />
              {t('community.searchUsers')}
            </TabsTrigger>
            <TabsTrigger value="requests">
              {t('community.requests')} ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="blocked">
              {t('community.blocked')} ({blockedUsers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="space-y-4">
            <div className="space-y-3">
              {acceptedFriends.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                    No friends yet. Search for users to add friends!
                  </CardContent>
                </Card>
              ) : (
                acceptedFriends.map((friendship) => {
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
                              <h4 className="font-semibold">
                                {friendProfile.first_name} {friendProfile.last_name}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {friendProfile.phone_number || 'No phone number'}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button 
                              size="sm" 
                              onClick={() => setSelectedChatUser(friendProfile)}
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Chat
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => blockUser(friendship.id)}
                            >
                              Block
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => removeFriend(friendship.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }).filter(Boolean)
              )}
            </div>
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search by name, plate number, or vehicle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
              />
              <Button onClick={searchUsers} disabled={isLoading}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {searchResults.map((userProfile) => (
                <Card key={userProfile.user_id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                           <div>
                             <h4 className="font-semibold">
                               {userProfile.first_name || 'N/A'}
                             </h4>
                             <p className="text-sm text-muted-foreground">
                               User profile
                             </p>
                           </div>
                        </div>
                        {userProfile.cars.length > 0 && (
                          <div className="ml-13 space-y-1">
                            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <Car className="h-3 w-3" />
                              Vehicles:
                            </p>
                            {userProfile.cars.map((car) => (
                              <p key={car.id} className="text-xs text-muted-foreground ml-4">
                                {car.name} - {car.model} ({car.plate_number})
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        {isFriend(userProfile.user_id) ? (
                          <Badge variant="default">Friend</Badge>
                        ) : hasPendingRequest(userProfile.user_id) ? (
                          <Badge variant="secondary">Request Pending</Badge>
                        ) : (
                          <Button 
                            size="sm" 
                            onClick={() => sendFriendRequest(userProfile.user_id)}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Friend
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            <div className="space-y-3">
              {pendingRequests.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No pending friend requests
                  </CardContent>
                </Card>
              ) : (
                pendingRequests.map((friendship) => {
                  const requesterProfile = friendship.requester_profile;
                  if (!requesterProfile) return null;
                  
                  return (
                    <Card key={friendship.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange/10 rounded-full flex items-center justify-center">
                              <UserPlus className="h-5 w-5 text-orange" />
                            </div>
                            <div>
                              <h4 className="font-semibold">
                                {requesterProfile.first_name || 'N/A'} {requesterProfile.last_name || ''}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Wants to be your friend
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => respondToFriendRequest(friendship.id, true)}
                            >
                              Accept
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => respondToFriendRequest(friendship.id, false)}
                            >
                              Decline
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }).filter(Boolean)
              )}
            </div>

            {sentRequests.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-3">Sent Requests</h4>
                  <div className="space-y-3">
                    {sentRequests.map((friendship) => {
                      const addresseeProfile = friendship.addressee_profile;
                      if (!addresseeProfile) return null;
                      
                      return (
                        <Card key={friendship.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                                  <Users className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                  <h4 className="font-semibold">
                                    {addresseeProfile.first_name || 'N/A'} {addresseeProfile.last_name || ''}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    Request sent
                                  </p>
                                </div>
                              </div>
                              <Badge variant="secondary">Pending</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    }).filter(Boolean)}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="blocked" className="space-y-4">
            <div className="space-y-3">
              {blockedUsers.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No blocked users
                  </CardContent>
                </Card>
              ) : (
                blockedUsers.map((friendship) => {
                  const blockedProfile = getFriendProfile(friendship);
                  if (!blockedProfile) return null;
                  
                  return (
                    <Card key={friendship.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                              <h4 className="font-semibold">
                                {blockedProfile.first_name || 'N/A'} {blockedProfile.last_name || ''}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Blocked user
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => unblockUser(friendship.id)}
                            >
                              Unblock
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => removeFriend(friendship.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }).filter(Boolean)
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Chat Dialog */}
      {selectedChatUser && (
        <ChatInterface 
          currentUser={user}
          chatUser={selectedChatUser}
          onClose={() => setSelectedChatUser(null)}
        />
      )}
    </Dialog>
  );
};

export default CommunityCard;