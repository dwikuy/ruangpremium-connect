import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { AppRole } from '@/types/database';

export interface UserWithRole {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  role: AppRole;
}

export function useAdminUsers() {
  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async (): Promise<UserWithRole[]> => {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Map roles to users
      const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

      return (profiles || []).map(profile => ({
        id: profile.id,
        user_id: profile.user_id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        role: (roleMap.get(profile.user_id) as AppRole) || 'member',
      }));
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      // Check if role exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'Berhasil',
        description: 'Role pengguna berhasil diperbarui',
      });
    },
    onError: (error) => {
      console.error('Failed to update role:', error);
      toast({
        title: 'Gagal',
        description: 'Gagal memperbarui role pengguna',
        variant: 'destructive',
      });
    },
  });

  return {
    users,
    isLoading,
    error,
    updateRole: updateRoleMutation.mutate,
    isUpdating: updateRoleMutation.isPending,
  };
}
