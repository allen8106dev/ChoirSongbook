/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, API_BASE_URL } from '../services/api';



const SongbookContext = createContext(null);

export const SongbookProvider = ({ children }) => {
  const queryClient = useQueryClient();

  // Simulated local user state (initialized from localStorage fallback)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('cs_sim_user');
    return saved ? JSON.parse(saved) : { email: 'allen@example.com', role: 'developer', name: 'Allen' };
  });

  // Check if token already exists. If not, seed a mock token on startup to match the default simulated user
  useMemo(() => {
    const token = localStorage.getItem('cs_auth_token');
    if (!token && currentUser.email) {
      // Fetch token in background or seed it locally
      apiService.auth.loginSimulate(currentUser.email)
        .then(data => {
          localStorage.setItem('cs_auth_token', data.access_token);
        })
        .catch(err => console.error("Auto-seeding simulation token failed:", err));
    }
  }, [currentUser]);

  // --- React Query Data Fetching Queries ---
  
  // Songs query
  const { data: songs = [], isLoading: isSongsLoading } = useQuery({
    queryKey: ['songs'],
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
  });

  // Categories query
  const { data: categoriesData = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: apiService.categories.getAll,
  });

  // Languages query
  const { data: languagesData = [] } = useQuery({
    queryKey: ['languages'],
    queryFn: apiService.languages.getAll,
  });

  // Admin emails list (only query if user has developer level permission)
  const { data: adminEmailsData = [] } = useQuery({
    queryKey: ['adminEmails'],
    queryFn: apiService.admin.getEmails,
    enabled: currentUser.role === 'developer',
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

  // Auth Mutation
  const changeSimulatedUser = async (email) => {
    try {
      const data = await apiService.auth.loginSimulate(email);
      localStorage.setItem('cs_auth_token', data.access_token);
      localStorage.setItem('cs_sim_user', JSON.stringify(data.user));
      setCurrentUser(data.user);
      
      // Invalidate everything to trigger correct queries for the new user profile
      queryClient.invalidateQueries();
    } catch (e) {
      console.error("Simulation login toggle failed", e);
    }
  };

  const handleGoogleLogin = async (idToken) => {
    try {
      const data = await apiService.auth.loginGoogle(idToken);
      localStorage.setItem('cs_auth_token', data.access_token);
      localStorage.setItem('cs_sim_user', JSON.stringify(data.user));
      setCurrentUser(data.user);
      queryClient.invalidateQueries();
      return data.user;
    } catch (e) {
      console.error("Google authentication failed", e);
      throw e;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cs_auth_token');
    localStorage.removeItem('cs_sim_user');
    // Revert to default guest viewer
    const guestUser = { email: 'guest@choir.org', role: 'viewer', name: 'Guest' };
    setCurrentUser(guestUser);
    localStorage.setItem('cs_sim_user', JSON.stringify(guestUser));
    // Reset query cache
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
    }
  });

  const deleteSongMutation = useMutation({
    mutationFn: (id) => apiService.songs.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['languages'] });
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
    }
  });

  const removeAdminEmailMutation = useMutation({
    mutationFn: (email) => apiService.admin.deleteEmail(email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminEmails'] });
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
        adminEmails,
        isLoading,
        changeSimulatedUser,
        handleGoogleLogin,
        handleLogout,
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
