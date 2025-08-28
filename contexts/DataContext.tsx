import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
// FIX: Import firebase from 'firebase/compat/app' for v8 compatibility.
import firebase from 'firebase/compat/app';
import { db } from '../services/firebase';
import { UserProfile, Team, JoinRequest, Invitation, ChatMessage, CommunityChatMessage } from '../types';
import { useAuth } from './AuthContext';

// Helper to convert Firebase object to array
const firebaseObjectToArray = <T,>(data: { [key: string]: Omit<T, 'id'> } | null): T[] => {
  if (!data) return [];
  return Object.keys(data).map(key => ({
    id: key,
    ...data[key],
  } as T));
};

interface DataContextType {
  users: UserProfile[];
  teams: Team[];
  requests: JoinRequest[];
  invitations: Invitation[];
  messages: ChatMessage[];
  communityMessages: CommunityChatMessage[];
  skills: string[];
  getUserById: (id: string) => UserProfile | undefined;
  getTeamById: (id: string) => Team | undefined;
  createTeam: (teamData: Omit<Team, 'id' | 'leaderId' | 'members'>) => Promise<void>;
  updateTeam: (teamId: string, teamData: Partial<Omit<Team, 'id' | 'leaderId' | 'members'>>) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  requestToJoinTeam: (teamId: string) => Promise<void>;
  inviteToTeam: (userId: string, teamId: string) => Promise<void>;
  handleJoinRequest: (requestId: string, accept: boolean) => Promise<void>;
  handleInvitation: (invitationId: string, accept: boolean) => Promise<void>;
  removeTeamMember: (userId: string, teamId: string) => Promise<void>;
  sendChatMessage: (teamId: string, text: string) => Promise<void>;
  markTeamMessageAsRead: (messageId: string) => Promise<void>;
  deleteChatMessage: (messageId: string) => Promise<void>;
  sendCommunityMessage: (text: string) => Promise<void>;
  markCommunityMessageAsRead: (messageId: string) => Promise<void>;
  deleteCommunityMessage: (messageId: string) => Promise<void>;
  getSkills: () => string[];
  addNewSkill: (skill: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { profile, currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [communityMessages, setCommunityMessages] = useState<CommunityChatMessage[]>([]);
  const [skills, setSkills] = useState<string[]>(['React.js', 'Node.js', 'Python', 'Java', 'UI/UX Design', 'ML/AI', 'Data Science', 'Project Management']);

  // This effect now depends on the authenticated user.
  // It sets up all data listeners when a user logs in, and tears them down when they log out.
  // This ensures data is always fresh and correct for the current session.
  useEffect(() => {
    if (!currentUser) {
      // Clear data when user logs out to prevent showing stale data on next login.
      setUsers([]);
      setTeams([]);
      setRequests([]);
      setInvitations([]);
      setMessages([]);
      setCommunityMessages([]);
      return;
    }
    
    // FIX: Use v8 database listeners with 'on' and 'off'.
    const refsAndCallbacks: { ref: firebase.database.Reference; callback: (snapshot: firebase.database.DataSnapshot) => void; }[] = [
        { ref: db.ref('users'), callback: (snapshot) => setUsers(firebaseObjectToArray<UserProfile>(snapshot.val())) },
        { ref: db.ref('teams'), callback: (snapshot) => setTeams(firebaseObjectToArray<Team>(snapshot.val())) },
        { ref: db.ref('requests'), callback: (snapshot) => setRequests(firebaseObjectToArray<JoinRequest>(snapshot.val())) },
        { ref: db.ref('invitations'), callback: (snapshot) => setInvitations(firebaseObjectToArray<Invitation>(snapshot.val())) },
        { ref: db.ref('messages'), callback: (snapshot) => setMessages(firebaseObjectToArray<ChatMessage>(snapshot.val())) },
        { ref: db.ref('communityMessages'), callback: (snapshot) => setCommunityMessages(firebaseObjectToArray<CommunityChatMessage>(snapshot.val())) },
        {
            ref: db.ref('skills'),
            callback: (snapshot) => {
                const dbSkills = firebaseObjectToArray<{ id: string; name: string }>(snapshot.val()).map(s => s.name);
                setSkills(prev => Array.from(new Set([...prev, ...dbSkills])));
            }
        },
    ];

    refsAndCallbacks.forEach(({ ref, callback }) => ref.on('value', callback));

    return () => {
        refsAndCallbacks.forEach(({ ref, callback }) => ref.off('value', callback));
    };
  }, [currentUser]);

  const getUserById = useCallback((id: string) => users.find(u => u.id === id), [users]);
  const getTeamById = useCallback((id:string) => teams.find(t => t.id === id), [teams]);
  
  const createTeam = async (teamData: Omit<Team, 'id' | 'leaderId' | 'members'>) => {
    if (!profile) throw new Error("User not authenticated.");
    // FIX: Use v8 database push syntax.
    const newTeamRef = db.ref('teams').push();
    const newTeamId = newTeamRef.key;
    if (!newTeamId) throw new Error("Failed to create new team ID.");
    
    const newTeam = {
      ...teamData,
      leaderId: profile.id,
      members: { [profile.id]: true },
    };

    const updates: { [key: string]: any } = {};
    updates[`/teams/${newTeamId}`] = newTeam;
    updates[`/users/${profile.id}/teamId`] = newTeamId;

    // FIX: Use v8 database update syntax.
    await db.ref().update(updates);
  };
  
  const updateTeam = async (teamId: string, teamData: Partial<Omit<Team, 'id'|'leaderId'|'members'>>) => {
    // AGGRESSIVE FIX: Fetch leaderId directly from DB to prevent race conditions.
    const snapshot = await db.ref(`teams/${teamId}/leaderId`).get();
    const leaderId = snapshot.val();
    if (!profile || leaderId !== profile.id) throw new Error("Unauthorized action.");

    // FIX: Use v8 database update syntax.
    await db.ref(`teams/${teamId}`).update(teamData);
  };

  const deleteTeam = async (teamId: string) => {
    // AGGRESSIVE FIX: Fetch the entire team object directly from DB to ensure checks and data are fresh.
    const teamRef = db.ref(`teams/${teamId}`);
    const snapshot = await teamRef.get();
    const teamToDelete = snapshot.val() as Team | null;

    if (!profile || !teamToDelete || teamToDelete.leaderId !== profile.id) throw new Error("Unauthorized action.");

    const updates: { [key: string]: any } = {};
    updates[`/teams/${teamId}`] = null; // Delete team
    
    // Unassign team from all members using the fresh data
    if (teamToDelete.members) {
        Object.keys(teamToDelete.members).forEach(memberId => {
            updates[`/users/${memberId}/teamId`] = null; 
        });
    }

    // Clean up related requests and invitations (using local state is acceptable for cleanup)
    requests.filter(r => r.teamId === teamId).forEach(r => updates[`/requests/${r.id}`] = null);
    invitations.filter(i => i.teamId === teamId).forEach(i => updates[`/invitations/${i.id}`] = null);
    
    // FIX: Use v8 database update syntax.
    await db.ref().update(updates);
  };

  const requestToJoinTeam = async (teamId: string) => {
    if (!profile || profile.teamId) throw new Error("Cannot send request.");
    const newRequest = { userId: profile.id, teamId };
    // FIX: Use v8 database push syntax.
    await db.ref('requests').push(newRequest);
  };
  
  const inviteToTeam = async (userId: string, teamId: string) => {
    // AGGRESSIVE FIX: Fetch leaderId directly from DB to prevent race conditions.
    const snapshot = await db.ref(`teams/${teamId}/leaderId`).get();
    const leaderId = snapshot.val();
    if (!profile || leaderId !== profile.id) throw new Error("Unauthorized action.");

    const newInvite = { userId, teamId };
    // FIX: Use v8 database push syntax.
    await db.ref('invitations').push(newInvite);
  };

  const handleJoinRequest = async (requestId: string, accept: boolean) => {
    const request = requests.find(r => r.id === requestId);
    if (!profile || !request) throw new Error("Invalid request.");
    
    // AGGRESSIVE FIX: Fetch leaderId directly from DB to prevent race conditions.
    const snapshot = await db.ref(`teams/${request.teamId}/leaderId`).get();
    const leaderId = snapshot.val();
    if (leaderId !== profile.id) throw new Error("Unauthorized action.");

    const updates: { [key: string]: any } = {};
    updates[`/requests/${requestId}`] = null; // Always remove request
    if (accept) {
      // Note: This check could still have a race condition if the user joins another team simultaneously.
      // A transaction would be the ultimate fix, but this solves the immediate authorization error.
      const userToJoin = getUserById(request.userId);
      if (userToJoin && !userToJoin.teamId) {
        updates[`/teams/${request.teamId}/members/${request.userId}`] = true;
        updates[`/users/${request.userId}/teamId`] = request.teamId;
      }
    }
    // FIX: Use v8 database update syntax.
    await db.ref().update(updates);
  };
  
  const handleInvitation = async (invitationId: string, accept: boolean) => {
    const invitation = invitations.find(i => i.id === invitationId);
    if (!profile || !invitation) throw new Error("Invalid invitation.");
    if (profile.id !== invitation.userId) throw new Error("Unauthorized action.");
    
    const updates: { [key: string]: any } = {};
    updates[`/invitations/${invitationId}`] = null;
    if (accept && !profile.teamId) {
        updates[`/teams/${invitation.teamId}/members/${profile.id}`] = true;
        updates[`/users/${profile.id}/teamId`] = invitation.teamId;
    }
    // FIX: Use v8 database update syntax.
    await db.ref().update(updates);
  };
  
  const removeTeamMember = async (userId: string, teamId: string) => {
    // AGGRESSIVE FIX: Fetch leaderId directly from DB to prevent race conditions.
    const snapshot = await db.ref(`teams/${teamId}/leaderId`).get();
    const leaderId = snapshot.val();
    if (!profile || leaderId !== profile.id || leaderId === userId) throw new Error("Unauthorized action.");
    
    const updates: { [key: string]: any } = {};
    updates[`/teams/${teamId}/members/${userId}`] = null;
    updates[`/users/${userId}/teamId`] = null;

    // FIX: Use v8 database update syntax.
    await db.ref().update(updates);
  };
  
  const sendChatMessage = async (teamId: string, text: string) => {
    if (!profile) throw new Error("Not authenticated.");
    const newMessage: Omit<ChatMessage, 'id'> = {
      teamId,
      senderId: profile.id,
      senderName: profile.fullName,
      senderAvatar: profile.avatarUrl,
      text,
      // FIX: Use v8 serverTimestamp syntax.
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      readBy: { [profile.id]: true }
    };
    // FIX: Use v8 database push syntax.
    await db.ref('messages').push(newMessage);
  };

  const markTeamMessageAsRead = async (messageId: string) => {
    if (!profile) return;
    await db.ref(`messages/${messageId}/readBy/${profile.id}`).set(true);
  };
  
  const deleteChatMessage = async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!profile || !message || message.senderId !== profile.id) throw new Error("Unauthorized action.");
    // FIX: Use v8 database remove syntax.
    await db.ref(`messages/${messageId}`).remove();
  };

  const sendCommunityMessage = async (text: string) => {
    if (!profile) throw new Error("Not authenticated.");
    const newMessage: Omit<CommunityChatMessage, 'id'> = {
      senderId: profile.id,
      senderName: profile.fullName,
      senderAvatar: profile.avatarUrl,
      text,
      // FIX: Use v8 serverTimestamp syntax.
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      readBy: { [profile.id]: true }
    };
    // FIX: Use v8 database push syntax.
    await db.ref('communityMessages').push(newMessage);
  };

  const markCommunityMessageAsRead = async (messageId: string) => {
    if (!profile) return;
    await db.ref(`communityMessages/${messageId}/readBy/${profile.id}`).set(true);
  };
  
  const deleteCommunityMessage = async (messageId: string) => {
    const message = communityMessages.find(m => m.id === messageId);
    if (!profile || !message || message.senderId !== profile.id) throw new Error("Unauthorized action.");
    // FIX: Use v8 database remove syntax.
    await db.ref(`communityMessages/${messageId}`).remove();
  };

  const getSkills = () => skills;
  
  const addNewSkill = async (skill: string) => {
    if (!skills.includes(skill)) {
      // FIX: Use v8 database push syntax.
      await db.ref('skills').push({ name: skill });
    }
  };

  return (
    <DataContext.Provider value={{ users, teams, requests, invitations, messages, communityMessages, skills, getUserById, getTeamById, createTeam, updateTeam, deleteTeam, requestToJoinTeam, inviteToTeam, handleJoinRequest, handleInvitation, removeTeamMember, sendChatMessage, markTeamMessageAsRead, deleteChatMessage, sendCommunityMessage, markCommunityMessageAsRead, deleteCommunityMessage, getSkills, addNewSkill }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};