import { supabase } from '@/integrations/supabase/client';

/**
 * Comprehensive system validation for location management refactor
 * This validates that all location-based logic is working correctly
 */
export const validateLocationSystemHealth = async () => {
  const results = {
    oldLocationReferences: 0,
    userLocationSummary: [] as any[],
    availableLocations: [] as any[],
    chatSummary: [] as any[],
    systemHealth: [] as any[],
    fixes: [] as string[]
  };

  try {
    // Step 1: Validate system health
    const { data: healthData, error: healthError } = await supabase.rpc('validate_location_system_health');
    
    if (healthError) {
      console.error('Health check error:', healthError);
    } else {
      results.systemHealth = healthData || [];
    }

    // Step 2: Get all active locations
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('code, name, is_active')
      .eq('is_active', true)
      .order('name');

    if (locationsError) {
      console.error('Locations fetch error:', locationsError);
    } else {
      results.availableLocations = locations || [];
    }

    // Step 3: Get user location summary
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name, location, locations, status')
      .eq('status', 'active');

    if (usersError) {
      console.error('Users fetch error:', usersError);
    } else {
      results.userLocationSummary = (users || []).map(user => ({
        id: user.user_id,
        name: `${user.first_name} ${user.last_name}`,
        oldLocation: user.location,
        newLocations: user.locations || [],
        locationCount: (user.locations || []).length
      }));
    }

    // Step 4: Get chat summary
    const { data: chats, error: chatsError } = await supabase
      .from('chats')
      .select(`
        id, 
        type, 
        name, 
        location,
        chat_participants(user_id)
      `)
      .in('type', ['global', 'announcements'])
      .order('location, type');

    if (chatsError) {
      console.error('Chats fetch error:', chatsError);
    } else {
      results.chatSummary = (chats || []).map(chat => ({
        id: chat.id,
        type: chat.type,
        name: chat.name,
        location: chat.location,
        participantCount: chat.chat_participants?.length || 0
      }));
    }

    // Step 5: Sync any users missing chat memberships
    const missingMemberships = results.systemHealth.find(h => h.check_name === 'Users missing chat memberships');
    if (missingMemberships && missingMemberships.count > 0) {
      console.log('🔧 Syncing users with missing chat memberships...');
      
      for (const user of results.userLocationSummary) {
        try {
          const { data: syncResult } = await supabase.rpc('sync_user_chat_memberships', {
            target_user_id: user.id
          });
          
          if (syncResult && syncResult.length > 0) {
            const joinedChats = syncResult.filter((r: any) => r.action === 'JOINED');
            if (joinedChats.length > 0) {
              results.fixes.push(`Synced ${user.name} to ${joinedChats.length} chats`);
            }
          }
        } catch (error) {
          console.error(`Failed to sync user ${user.name}:`, error);
        }
      }
    }

    // Step 6: Ensure all required chats exist
    try {
      const { data: chatCreationResult } = await supabase.rpc('ensure_chats_for_all_locations');
      
      if (chatCreationResult) {
        const createdChats = chatCreationResult.filter((r: any) => r.action === 'CREATED');
        if (createdChats.length > 0) {
          results.fixes.push(`Created ${createdChats.length} missing chats`);
        }
      }
    } catch (error) {
      console.error('Failed to ensure chats:', error);
    }

    return results;
    
  } catch (error) {
    console.error('Validation error:', error);
    throw error;
  }
};

/**
 * Emergency function to sync all users to their correct chats
 */
export const syncAllUsersToLocationChats = async () => {
  const results = {
    processedUsers: 0,
    totalSyncs: 0,
    errors: [] as string[]
  };

  try {
    // Get all active users
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name')
      .eq('status', 'active');

    if (usersError) throw usersError;

    for (const user of users || []) {
      try {
        const { data: syncResult } = await supabase.rpc('sync_user_chat_memberships', {
          target_user_id: user.user_id
        });

        results.processedUsers++;
        if (syncResult) {
          results.totalSyncs += syncResult.length;
        }
      } catch (error) {
        results.errors.push(`Failed to sync ${user.first_name} ${user.last_name}: ${error}`);
      }
    }

    return results;
  } catch (error) {
    console.error('Sync all users error:', error);
    throw error;
  }
};

/**
 * Function to get comprehensive system status for admin dashboard
 */
export const getLocationSystemStatus = async () => {
  try {
    const validation = await validateLocationSystemHealth();
    
    return {
      totalLocations: validation.availableLocations.length,
      totalUsers: validation.userLocationSummary.length,
      totalChats: validation.chatSummary.length,
      systemHealthy: validation.systemHealth.every(h => h.status === 'PASS'),
      healthChecks: validation.systemHealth,
      locations: validation.availableLocations,
      users: validation.userLocationSummary,
      chats: validation.chatSummary,
      appliedFixes: validation.fixes
    };
  } catch (error) {
    console.error('System status error:', error);
    throw error;
  }
};