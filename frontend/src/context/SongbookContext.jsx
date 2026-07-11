/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, API_BASE_URL } from '../services/api';



const SongbookContext = createContext(null);

export const SongbookProvider = ({ children }) => {
  const queryClient = useQueryClient();

  // User state - initialized from localStorage if a real Google session exists
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('cs_user');
    return saved ? JSON.parse(saved) : { email: '', role: 'viewer', name: 'Guest' };
  });
  const [activeOrganizationId, setActiveOrganizationId] = useState(() => {
    return localStorage.getItem('cs_active_org_id') || '';
  });

  // Restore JWT session token from storage on load (if exists)
  // No auto-simulation — only real Google sign-in sets a token

  // Favourites — fetched from DB (syncs across devices), requires auth token
  const { data: favourites = [] } = useQuery({
    queryKey: ['favourites', currentUser.email, activeOrganizationId],
    queryFn: apiService.favourites.getAll,
    enabled: !!currentUser.email && !!activeOrganizationId,
    staleTime: 30_000,
  });

  const toggleFavouriteMutation = useMutation({
    mutationFn: async (songId) => {
      if (favourites.includes(songId)) {
        await apiService.favourites.remove(songId);
      } else {
        await apiService.favourites.add(songId);
      }
    },
    // Optimistic update — instant UI feedback
    onMutate: async (songId) => {
      await queryClient.cancelQueries({ queryKey: ['favourites', currentUser.email, activeOrganizationId] });
      const previous = queryClient.getQueryData(['favourites', currentUser.email, activeOrganizationId]) ?? [];
      queryClient.setQueryData(['favourites', currentUser.email, activeOrganizationId], (old = []) =>
        old.includes(songId) ? old.filter(id => id !== songId) : [...old, songId]
      );
      return { previous };
    },
    onError: (_err, _songId, context) => {
      queryClient.setQueryData(['favourites', currentUser.email, activeOrganizationId], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favourites', currentUser.email, activeOrganizationId] });
    },
  });

  const toggleFavourite = (songId) => {
    if (!currentUser.email) return;
    toggleFavouriteMutation.mutate(songId);
  };

  const isFavourite = (songId) => favourites.includes(songId);

  // --- React Query Data Fetching Queries ---
  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations', currentUser.email],
    queryFn: apiService.organizations.getAll,
    enabled: !!currentUser.email,
  });

  useEffect(() => {
    if (!organizations.length) return;
    if (!activeOrganizationId) {
      localStorage.setItem('cs_active_org_id', organizations[0].id);
      window.setTimeout(() => setActiveOrganizationId(organizations[0].id), 0);
    }
  }, [organizations, activeOrganizationId]);

  const { data: publicOrganization = null } = useQuery({
    queryKey: ['publicOrganization', activeOrganizationId],
    queryFn: () => apiService.organizations.getPublic(activeOrganizationId),
    enabled: !!activeOrganizationId && !organizations.some(org => org.id === activeOrganizationId),
  });

  const activeOrganization = useMemo(() => {
    return organizations.find(org => org.id === activeOrganizationId) || publicOrganization || null;
  }, [organizations, publicOrganization, activeOrganizationId]);

  const ownedOrganization = useMemo(() => {
    if (!currentUser.email) return null;
    return organizations.find(org => org.owner_email?.toLowerCase() === currentUser.email.toLowerCase()) || null;
  }, [organizations, currentUser.email]);

  const isActiveOrgAdmin = useMemo(() => {
    if (!activeOrganization || !currentUser.email) return false;
    if (currentUser.role === 'developer') return true;
    return activeOrganization.owner_email?.toLowerCase() === currentUser.email.toLowerCase();
  }, [activeOrganization, currentUser.email, currentUser.role]);

  const isDeveloper = currentUser.role === 'developer';

  const isActiveOrgMember = useMemo(() => {
    if (!activeOrganization || !currentUser.email) return false;
    if (isDeveloper || isActiveOrgAdmin) return true;
    return activeOrganization.admins?.some(member => member.email?.toLowerCase() === currentUser.email.toLowerCase()) || false;
  }, [activeOrganization, currentUser.email, isActiveOrgAdmin, isDeveloper]);

  const switchOrganization = useCallback((organizationId) => {
    localStorage.setItem('cs_active_org_id', organizationId);
    setActiveOrganizationId(organizationId);
    queryClient.invalidateQueries({ queryKey: ['songs'] });
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    queryClient.invalidateQueries({ queryKey: ['languages'] });
    queryClient.invalidateQueries({ queryKey: ['favourites'] });
    queryClient.invalidateQueries({ queryKey: ['adminEmails'] });
  }, [queryClient]);
  
  // Songs query
  const { data: songs = [], isLoading: isSongsLoading } = useQuery({
    queryKey: ['songs', activeOrganizationId],
    queryFn: async () => {
      const data = await apiService.songs.getAll();
      const backendBase = API_BASE_URL.replace('/api', '');
      return data.map(song => {
        let audioUrl = song.audio_url;
        if (audioUrl && !audioUrl.startsWith('http')) {
          audioUrl = `${backendBase}${audioUrl}`;
        }
        return {
          ...song,
          audioUrl: audioUrl
        };
      });
    },
    enabled: !!activeOrganizationId,
  });

  // Categories query
  const { data: categoriesData = [] } = useQuery({
    queryKey: ['categories', activeOrganizationId],
    queryFn: apiService.categories.getAll,
    enabled: !!activeOrganizationId,
  });

  // Languages query
  const { data: languagesData = [] } = useQuery({
    queryKey: ['languages', activeOrganizationId],
    queryFn: apiService.languages.getAll,
    enabled: !!activeOrganizationId,
  });

  // Admin emails list (only query if user has developer level permission)
  const { data: adminEmailsData = [] } = useQuery({
    queryKey: ['adminEmails', activeOrganizationId],
    queryFn: apiService.admin.getEmails,
    enabled: isActiveOrgAdmin,
  });

  // Map API response category and language items to string lists for frontend components compatibility
  const categories = useMemo(() => {
    return categoriesData.map(c => c.name);
  }, [categoriesData]);

  const languages = useMemo(() => {
    return languagesData.map(l => l.name);
  }, [languagesData]);

  const adminEmails = useMemo(() => {
    return adminEmailsData.map(a => a.email);
  }, [adminEmailsData]);

  // Combined loading states
  const isLoading = isSongsLoading;

  // --- Mutations for Operations ---

  const handleGoogleLogin = async (idToken) => {
    try {
      const data = await apiService.auth.loginGoogle(idToken);
      localStorage.setItem('cs_auth_token', data.access_token);
      localStorage.setItem('cs_user', JSON.stringify(data.user));
      const ownedOrg = data.user.organizations?.find(org => org.owner_email?.toLowerCase() === data.user.email.toLowerCase());
      const firstOrgId = ownedOrg?.id || data.user.organizations?.[0]?.id || '';
      if (firstOrgId) {
        localStorage.setItem('cs_active_org_id', firstOrgId);
      } else {
        localStorage.removeItem('cs_active_org_id');
      }
      queryClient.clear();
      setCurrentUser(data.user);
      setActiveOrganizationId(firstOrgId);
      return data.user;
    } catch (e) {
      console.error('Google authentication failed', e);
      throw e;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cs_auth_token');
    localStorage.removeItem('cs_user');
    localStorage.removeItem('cs_active_org_id');
    const guestUser = { email: '', role: 'viewer', name: 'Guest' };
    setCurrentUser(guestUser);
    setActiveOrganizationId('');
    queryClient.clear();
    queryClient.invalidateQueries();
  };

  // Song Mutations
  const addSongMutation = useMutation({
    mutationFn: (songData) => {
      const { audioUrl, ...rest } = songData;
      return apiService.songs.create({
        ...rest,
        audio_url: audioUrl || null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['languages'] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    }
  });

  const updateSongMutation = useMutation({
    mutationFn: ({ id, songData }) => {
      const { audioUrl, ...rest } = songData;
      return apiService.songs.update(id, {
        ...rest,
        audio_url: audioUrl
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['languages'] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    }
  });

  const deleteSongMutation = useMutation({
    mutationFn: (id) => apiService.songs.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['languages'] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    }
  });

  // Audio Upload Mutation
  const uploadSongAudioMutation = useMutation({
    mutationFn: ({ id, file }) => apiService.songs.uploadAudio(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
    }
  });

  // Admin Configuration Email mutations
  const addAdminEmailMutation = useMutation({
    mutationFn: (email) => apiService.admin.addEmail(email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminEmails'] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    }
  });

  const removeAdminEmailMutation = useMutation({
    mutationFn: (email) => apiService.admin.deleteEmail(email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminEmails'] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    }
  });

  const createOrganizationMutation = useMutation({
    mutationFn: (name) => apiService.organizations.create(name),
    onSuccess: (organization) => {
      localStorage.setItem('cs_active_org_id', organization.id);
      setActiveOrganizationId(organization.id);
      setCurrentUser((user) => {
        const nextUser = {
          ...user,
          role: user.role === 'developer' ? 'developer' : 'admin',
          organizations: [...(user.organizations || []).filter(org => org.id !== organization.id), organization],
        };
        localStorage.setItem('cs_user', JSON.stringify(nextUser));
        return nextUser;
      });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['languages'] });
    }
  });

  const deleteOrganizationMutation = useMutation({
    mutationFn: ({ id, confirmName }) => apiService.organizations.delete(id, confirmName),
    onSuccess: (_data, variables) => {
      if (variables.id === activeOrganizationId) {
        localStorage.removeItem('cs_active_org_id');
        setActiveOrganizationId('');
      }
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['languages'] });
    }
  });

  // Categories/Tags Administration mutations
  const renameCategoryMutation = useMutation({
    mutationFn: ({ oldName, newName }) => apiService.categories.rename(oldName, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (name) => apiService.categories.delete(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });

  // Languages/Tags Administration mutations
  const renameLanguageMutation = useMutation({
    mutationFn: ({ oldName, newName }) => apiService.languages.rename(oldName, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      queryClient.invalidateQueries({ queryKey: ['languages'] });
    }
  });

  const deleteLanguageMutation = useMutation({
    mutationFn: (name) => apiService.languages.delete(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      queryClient.invalidateQueries({ queryKey: ['languages'] });
    }
  });

  // Wrapped functions mapping to mutations
  const addSong = (songData) => addSongMutation.mutateAsync(songData);
  const updateSong = (id, songData) => updateSongMutation.mutateAsync({ id, songData });
  const deleteSong = (id) => deleteSongMutation.mutateAsync(id);
  const uploadSongAudio = (id, file) => uploadSongAudioMutation.mutateAsync({ id, file });
  const createOrganization = (name) => createOrganizationMutation.mutateAsync(name);
  const deleteOrganization = (id, confirmName) => deleteOrganizationMutation.mutateAsync({ id, confirmName });
  
  const addAdminEmail = (email) => addAdminEmailMutation.mutate(email);
  const removeAdminEmail = (email) => removeAdminEmailMutation.mutate(email);
  
  const renameCategory = (oldName, newName) => renameCategoryMutation.mutate({ oldName, newName });
  const deleteCategory = (name) => deleteCategoryMutation.mutate(name);
  
  const renameLanguage = (oldName, newName) => renameLanguageMutation.mutate({ oldName, newName });
  const deleteLanguage = (name) => deleteLanguageMutation.mutate(name);

  return (
    <SongbookContext.Provider
      value={{
        songs,
        languages,
        categories,
        currentUser,
        organizations,
        ownedOrganization,
        activeOrganization,
        activeOrganizationId,
        isActiveOrgAdmin,
        isActiveOrgMember,
        isDeveloper,
        adminEmails,
        isLoading,
        favourites,
        toggleFavourite,
        isFavourite,
        handleGoogleLogin,
        handleLogout,
        switchOrganization,
        createOrganization,
        deleteOrganization,
        addSong,
        updateSong,
        deleteSong,
        uploadSongAudio,
        addAdminEmail,
        removeAdminEmail,
        renameCategory,
        deleteCategory,
        renameLanguage,
        deleteLanguage,
      }}
    >
      {children}
    </SongbookContext.Provider>
  );
};

export const useSongbook = () => {
  const context = useContext(SongbookContext);
  if (!context) {
    throw new Error('useSongbook must be used within a SongbookProvider');
  }
  return context;
};
