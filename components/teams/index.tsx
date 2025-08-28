import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Team, UserProfile, JoinRequest, ChatMessage } from '../../types';
import { SkillBadge, Avatar, Spinner } from '../ui/Core';
import { Button, Modal, MultiSelect, ConfirmationModal, ProblemStatementSelector } from '../common/Core';

// --- CreateTeamModal ---
export const CreateTeamModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
  const { createTeam, getSkills, addNewSkill } = useData();
  const [teamName, setTeamName] = useState('');
  const [projectIdea, setProjectIdea] = useState('');
  const [isRecruiting, setIsRecruiting] = useState(true);
  const [appealDescription, setAppealDescription] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const resetForm = () => {
    setTeamName('');
    setProjectIdea('');
    setIsRecruiting(true);
    setAppealDescription('');
    setRequiredSkills([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !projectIdea.trim()) {
      alert('Please provide a team name and project idea.');
      return;
    }
    setLoading(true);

    const teamData = {
      name: teamName,
      projectIdea,
      isRecruiting,
      appeal: isRecruiting ? {
        description: appealDescription,
        requiredSkills,
      } : undefined,
    };

    try {
        await createTeam(teamData);
        onClose();
        resetForm();
    } catch (error) {
        console.error(error);
        alert("Failed to create team. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🚀 Launch Your Team">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="teamName" className="block text-sm font-medium text-neutral-700">Team Name</label>
          <input
            type="text"
            id="teamName"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            placeholder="e.g., The Code Crusaders"
            required
          />
        </div>

        <div>
          <ProblemStatementSelector 
            value={projectIdea}
            onChange={setProjectIdea}
          />
        </div>

        <div className="flex items-center justify-between bg-neutral-100 p-3 rounded-md">
          <label htmlFor="isRecruiting" className="font-medium text-neutral-800">Are you looking for teammates?</label>
          <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
             <input type="checkbox" name="isRecruiting" id="isRecruiting" checked={isRecruiting} onChange={() => setIsRecruiting(!isRecruiting)} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
             <label htmlFor="isRecruiting" className="toggle-label block overflow-hidden h-6 rounded-full bg-neutral-300 cursor-pointer"></label>
          </div>
          <style>{`
            .toggle-checkbox:checked { right: 0; border-color: #22D3EE; }
            .toggle-checkbox:checked + .toggle-label { background-color: #22D3EE; }
          `}</style>
        </div>

        {isRecruiting && (
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold text-neutral-700">Recruitment Details</h3>
            <div>
              <label htmlFor="appealDescription" className="block text-sm font-medium text-neutral-700">Recruitment Pitch</label>
              <textarea
                id="appealDescription"
                value={appealDescription}
                onChange={(e) => setAppealDescription(e.target.value)}
                rows={2}
                placeholder="What kind of teammates are you looking for?"
                className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
                <label className="block text-sm font-medium text-neutral-700">Required Skills</label>
                <MultiSelect 
                    options={getSkills()}
                    selected={requiredSkills}
                    onChange={setRequiredSkills}
                    onAddNewOption={addNewSkill}
                    placeholder="e.g., React, Python, UI/UX"
                />
                <p className="text-xs text-neutral-500 mt-1">Select from the list or type a new skill and press Enter.</p>
            </div>
          </div>
        )}
        
        <div className="flex justify-end pt-4">
            <Button type="button" variant="ghost" onClick={onClose} className="mr-2">Cancel</Button>
            <Button type="submit" size="md" disabled={loading}>
                {loading ? 'Creating...' : 'Create Team'}
            </Button>
        </div>
      </form>
    </Modal>
  );
};


// --- EditTeamModal ---
export const EditTeamModal: React.FC<{ isOpen: boolean; onClose: () => void; team: Team; }> = ({ isOpen, onClose, team }) => {
  const { updateTeam, getSkills, addNewSkill, deleteTeam, removeTeamMember, getUserById } = useData();
  const { profile } = useAuth();
  const [teamName, setTeamName] = useState('');
  const [projectIdea, setProjectIdea] = useState('');
  const [isRecruiting, setIsRecruiting] = useState(true);
  const [appealDescription, setAppealDescription] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    confirmText: string;
    onConfirm: () => void;
    confirmVariant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  } | { isOpen: false }>({ isOpen: false });

  useEffect(() => {
    if (team && isOpen) {
      setTeamName(team.name);
      setProjectIdea(team.projectIdea);
      setIsRecruiting(team.isRecruiting);
      setAppealDescription(team.appeal?.description || '');
      setRequiredSkills(team.appeal?.requiredSkills || []);
    }
  }, [team, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !projectIdea.trim()) {
      alert('Please provide a team name and project idea.');
      return;
    }
    setLoading(true);

    const teamData = {
      name: teamName,
      projectIdea,
      isRecruiting,
      appeal: isRecruiting ? {
        description: appealDescription,
        requiredSkills,
      } : undefined,
    };
    
    try {
        await updateTeam(team.id, teamData);
        onClose();
    } catch (error) {
        console.error(error);
        alert("Failed to update team.");
    } finally {
        setLoading(false);
    }
  };
  
  const handleRemoveMember = (userId: string, userName: string) => {
    setConfirmState({
        isOpen: true,
        title: "Remove Member",
        message: `Are you sure you want to remove ${userName} from your team?`,
        confirmText: "Remove",
        confirmVariant: 'danger',
        onConfirm: async () => {
            try {
                await removeTeamMember(userId, team.id);
            } catch (error) {
                console.error(error);
                alert("Failed to remove member.");
            } finally {
                setConfirmState({ isOpen: false });
            }
        }
    });
  };
  
  const handleDisbandTeam = () => {
    setConfirmState({
        isOpen: true,
        title: "Disband Team",
        message: "Are you sure you want to disband this team? This action is permanent and cannot be undone.",
        confirmText: "Disband",
        confirmVariant: 'danger',
        onConfirm: async () => {
            try {
                await deleteTeam(team.id);
                onClose();
            } catch (error) {
                console.error(error);
                alert("Failed to disband team.");
            } finally {
                setConfirmState({ isOpen: false });
            }
        }
    });
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="⚙️ Edit & Manage Your Team">
          <div className="space-y-6">
              <form id="editTeamForm" onSubmit={handleSubmit} className="space-y-6">
                  <fieldset>
                      <h3 className="text-lg font-semibold text-neutral-800 border-b pb-2 mb-4">Team Details</h3>
                      <div>
                          <label htmlFor="teamNameEdit" className="block text-sm font-medium text-neutral-700">Team Name</label>
                          <input
                              type="text"
                              id="teamNameEdit"
                              value={teamName}
                              onChange={(e) => setTeamName(e.target.value)}
                              className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                              required
                          />
                      </div>

                      <div className="mt-4">
                           <ProblemStatementSelector 
                            id="projectIdeaEdit"
                            value={projectIdea}
                            onChange={setProjectIdea}
                          />
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between bg-neutral-100 p-3 rounded-md">
                          <label htmlFor="isRecruitingEdit" className="font-medium text-neutral-800">Are you looking for teammates?</label>
                          <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                              <input type="checkbox" name="isRecruitingEdit" id="isRecruitingEdit" checked={isRecruiting} onChange={() => setIsRecruiting(!isRecruiting)} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                              <label htmlFor="isRecruitingEdit" className="toggle-label block overflow-hidden h-6 rounded-full bg-neutral-300 cursor-pointer"></label>
                          </div>
                          <style>{`
                              .toggle-checkbox:checked { right: 0; border-color: #22D3EE; }
                              .toggle-checkbox:checked + .toggle-label { background-color: #22D3EE; }
                          `}</style>
                      </div>

                      {isRecruiting && (
                          <div className="space-y-4 border-t pt-4 mt-4">
                              <h4 className="font-semibold text-neutral-700">Recruitment Details</h4>
                              <div>
                                  <label htmlFor="appealDescriptionEdit" className="block text-sm font-medium text-neutral-700">Recruitment Pitch</label>
                                  <textarea
                                      id="appealDescriptionEdit"
                                      value={appealDescription}
                                      onChange={(e) => setAppealDescription(e.target.value)}
                                      rows={2}
                                      placeholder="What kind of teammates are you looking for?"
                                      className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-neutral-700">Required Skills</label>
                                  <MultiSelect 
                                      options={getSkills()}
                                      selected={requiredSkills}
                                      onChange={setRequiredSkills}
                                      onAddNewOption={addNewSkill}
                                      placeholder="e.g., React, Python, UI/UX"
                                  />
                                  <p className="text-xs text-neutral-500 mt-1">Select from the list or type a new skill and press Enter.</p>
                              </div>
                          </div>
                      )}
                  </fieldset>
              </form>
              
              <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-neutral-800">Manage Members</h3>
                  <div className="space-y-3 mt-4 max-h-48 overflow-y-auto pr-2">
                      {team.members && Object.keys(team.members).map(memberId => {
                          if (memberId === profile?.id) return null;
                          const member = getUserById(memberId);
                          if (!member) return null;
                          return (
                              <div key={member.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                                  <div className="flex items-center gap-3">
                                      <Avatar src={member.avatarUrl} name={member.fullName} size="md" />
                                      <div>
                                          <p className="font-semibold text-neutral-800">{member.fullName}</p>
                                          <p className="text-sm text-neutral-500">{member.year}</p>
                                      </div>
                                  </div>
                                  <Button variant="danger" size="sm" onClick={() => handleRemoveMember(member.id, member.fullName)}>
                                      Remove
                                  </Button>
                              </div>
                          );
                      })}
                  </div>
              </div>
              
              <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-red-600">Danger Zone</h3>
                  <p className="text-sm text-neutral-600 mt-2">Disbanding the team is a permanent action.</p>
                  <div className="mt-4">
                      <Button variant="danger" onClick={handleDisbandTeam}>
                          Disband Team
                      </Button>
                  </div>
              </div>
          </div>
          <div className="flex justify-end pt-8 sticky bottom-0 bg-white py-4 border-t">
              <Button type="button" variant="ghost" onClick={onClose} className="mr-2">Cancel</Button>
              <Button type="submit" form="editTeamForm" size="md" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
              </Button>
          </div>
      </Modal>

       {confirmState.isOpen && (
            <ConfirmationModal
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState({ isOpen: false })}
                onConfirm={confirmState.onConfirm}
                title={confirmState.title}
                message={confirmState.message}
                confirmText={confirmState.confirmText}
                confirmVariant={confirmState.confirmVariant}
            />
        )}
    </>
  );
};


// --- TeamList ---
const TeamCard: React.FC<{ team: Team; onJoin: (teamId: string) => void, hasPendingRequest: boolean, disabled: boolean }> = ({ team, onJoin, hasPendingRequest, disabled }) => {
  const { getUserById } = useData();
  const leader = getUserById(team.leaderId);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 flex flex-col transition hover:shadow-lg">
      <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-xl font-bold text-neutral-800">{team.name}</h3>
            {leader && <p className="text-sm text-neutral-500">Led by {leader.fullName}</p>}
          </div>
          {team.isRecruiting ? 
            <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">Recruiting</span> : 
            <span className="text-xs font-bold bg-neutral-200 text-neutral-600 px-2 py-1 rounded-full">Full</span>
          }
      </div>
      <p className="text-neutral-700 text-sm mb-4 flex-grow border-t pt-4 mt-2">{team.projectIdea}</p>
      {team.isRecruiting && team.appeal && (
        <div className="mb-4">
          <p className="text-sm text-neutral-600 italic mb-2">"{team.appeal.description}"</p>
          <h4 className="font-semibold text-sm mb-2 text-neutral-600">Looking for:</h4>
          <div className="flex flex-wrap">
            {team.appeal.requiredSkills.map(skill => <SkillBadge key={skill} skill={skill} />)}
          </div>
        </div>
      )}
      {team.isRecruiting && (
          <Button onClick={() => onJoin(team.id)} size="sm" disabled={disabled || hasPendingRequest}>
              {hasPendingRequest ? 'Request Sent' : 'Request to Join'}
          </Button>
      )}
    </div>
  );
};

export const TeamList: React.FC = () => {
  const { teams, requests, requestToJoinTeam } = useData();
  const { profile } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'recruiting'>('all');
  
  const filteredTeams = useMemo(() => {
      return teams.filter(team => filter === 'all' || team.isRecruiting);
  }, [teams, filter]);
  
  const handleJoin = (teamId: string) => {
      if(profile && !profile.teamId) {
          requestToJoinTeam(teamId);
      }
  };
  
  const hasTeam = !!profile?.teamId;
  const pendingRequestIds = requests.filter(r => r.userId === profile?.id).map(r => r.teamId);

  return (
    <>
      <CreateTeamModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      <div className="mb-6 bg-white p-4 rounded-lg shadow flex flex-col sm:flex-row justify-between items-center">
        <div>
            <h2 className="text-xl font-bold text-neutral-800">Explore Teams</h2>
            <p className="text-neutral-600">Find a project that excites you or create your own team.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-4">
             <div className="flex items-center space-x-2 bg-neutral-100 p-1 rounded-lg">
                <button onClick={() => setFilter('all')} className={`px-3 py-1 text-sm font-semibold rounded-md ${filter === 'all' ? 'bg-white shadow' : 'text-neutral-600'}`}>All</button>
                <button onClick={() => setFilter('recruiting')} className={`px-3 py-1 text-sm font-semibold rounded-md ${filter === 'recruiting' ? 'bg-white shadow' : 'text-neutral-600'}`}>Recruiting</button>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)} disabled={hasTeam}>
                Create Team
            </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTeams.map(team => (
          <TeamCard 
            key={team.id} 
            team={team}
            onJoin={handleJoin}
            hasPendingRequest={pendingRequestIds.includes(team.id)}
            disabled={hasTeam}
          />
        ))}
      </div>
    </>
  );
};


// --- MyTeamDashboard ---
// Chat Message Component
const Message: React.FC<{ message: ChatMessage; isCurrentUser: boolean, onDelete: (messageId: string) => void; members: UserProfile[] }> = ({ message, isCurrentUser, onDelete, members }) => {
  const { profile } = useAuth();
  const { markTeamMessageAsRead } = useData();
  const ref = useRef<HTMLDivElement>(null);

  const messageAlignment = isCurrentUser ? 'justify-end' : 'justify-start';
  const bubbleStyles = isCurrentUser
    ? 'bg-primary text-white'
    : 'bg-neutral-200 text-neutral-800';

  useEffect(() => {
    if (!ref.current || isCurrentUser || !profile || message.readBy?.[profile.id]) {
        return;
    }

    const observer = new IntersectionObserver(
        ([entry]) => {
            if (entry.isIntersecting) {
                markTeamMessageAsRead(message.id);
                observer.disconnect(); 
            }
        },
        { threshold: 0.5 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [message.id, isCurrentUser, profile, message.readBy, markTeamMessageAsRead]);

  const formatTimestamp = (timestamp: number | object): string => {
    if (typeof timestamp !== 'number') return '';
    const date = new Date(timestamp);
    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const day = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    return `${time}, ${day}`;
  };

  const otherMemberIds = members.map(m => m.id).filter(id => id !== message.senderId);
  const seenByAll = otherMemberIds.length > 0 && otherMemberIds.every(id => message.readBy?.[id]);

  return (
    <div ref={ref} className={`flex items-end gap-2 ${messageAlignment} group`}>
      {!isCurrentUser && <Avatar src={message.senderAvatar} name={message.senderName} size="sm" />}
      
      {isCurrentUser && (
        <button 
          onClick={() => onDelete(message.id)} 
          className="text-neutral-400 hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Delete message"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
        </button>
      )}

      <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        {!isCurrentUser && <span className="text-xs text-neutral-500 ml-2 mb-0.5">{message.senderName}</span>}
        <div className={`max-w-xs md:max-w-sm p-3 rounded-lg ${bubbleStyles}`}>
          <p className="text-sm">{message.text}</p>
        </div>
        <div className="flex items-center text-xs mt-1 px-2">
            <span className="text-neutral-400">{formatTimestamp(message.timestamp)}</span>
            {isCurrentUser && seenByAll && (
                <div className="flex items-center gap-1 ml-2 text-neutral-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Seen by all</span>
                </div>
            )}
        </div>
      </div>
      {isCurrentUser && <Avatar src={message.senderAvatar} name={message.senderName} size="sm" />}
    </div>
  );
};

// Team Chat Component
const TeamChat: React.FC<{ teamId: string; members: UserProfile[]; }> = ({ teamId, members }) => {
  const { profile } = useAuth();
  const { messages, sendChatMessage, deleteChatMessage } = useData();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; messageId: string | null }>({ isOpen: false, messageId: null });

  const teamMessages = useMemo(() => {
    return messages.filter(m => m.teamId === teamId);
  }, [messages, teamId]);

  const sortedMessages = [...teamMessages].sort((a, b) => (a.timestamp as number) - (b.timestamp as number));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [sortedMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !profile) return;
    setSending(true);
    try {
      await sendChatMessage(teamId, newMessage);
      setNewMessage('');
    } catch (error) {
      console.error(error);
      alert("Could not send message.");
    } finally {
      setSending(false);
    }
  };
  
  const handleDeleteRequest = (messageId: string) => {
    setConfirmDelete({ isOpen: true, messageId: messageId });
  };
  
  const handleConfirmDelete = async () => {
    if (confirmDelete.messageId) {
        try {
            await deleteChatMessage(confirmDelete.messageId);
        } catch(error) {
            console.error("Failed to delete message:", error);
            alert("Could not delete message.");
        }
    }
    setConfirmDelete({ isOpen: false, messageId: null });
  };


  return (
    <div className="flex flex-col h-[75vh]">
      {/* Messages */}
      <div className="flex-grow p-4 space-y-4 overflow-y-auto bg-neutral-50">
        {sortedMessages.map((msg) => (
          <Message key={msg.id} message={msg} isCurrentUser={msg.senderId === profile?.id} onDelete={handleDeleteRequest} members={members} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Form */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t flex items-center gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-grow px-3 py-2 border border-neutral-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          disabled={sending}
        />
        <Button type="submit" disabled={sending || !newMessage.trim()}>
          {sending ? <Spinner size="sm" /> : 'Send'}
        </Button>
      </form>
      <ConfirmationModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, messageId: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Message"
        message="Are you sure you want to permanently delete this message?"
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
};


// Main Dashboard Component
const JoinRequests: React.FC<{teamId: string}> = ({ teamId }) => {
    const { requests, handleJoinRequest, getUserById } = useData();
    const teamRequests = requests.filter(r => r.teamId === teamId);
    
    return (
        <div className="h-full">
            <h3 className="text-lg font-bold text-neutral-800 mb-4 border-b pb-2">Join Requests</h3>
            {teamRequests.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {teamRequests.map(req => {
                        const user = getUserById(req.userId);
                        if (!user) return null;
                        return (
                            <div key={req.id} className="p-3 bg-neutral-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Avatar src={user.avatarUrl} name={user.fullName} size="md" />
                                    <div>
                                        <p className="font-semibold text-neutral-800">{user.fullName}</p>
                                        <p className="text-sm text-neutral-500">{user.year}</p>
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-2 mt-2">
                                    <Button size="sm" variant="ghost" onClick={() => handleJoinRequest(req.id, false)}>Decline</Button>
                                    <Button size="sm" variant="secondary" onClick={() => handleJoinRequest(req.id, true)}>Accept</Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-sm text-neutral-500">No pending requests.</p>
            )}
        </div>
    );
};

const Members: React.FC<{team: Team, members: UserProfile[]}> = ({ team, members }) => {
    return (
        <div>
            <h3 className="text-lg font-bold text-neutral-800 mb-4 border-b pb-2">Team Members ({members.length})</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {members.map(member => (
                    <div key={member.id} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                        <Avatar src={member.avatarUrl} name={member.fullName} size="md" />
                        <div>
                            <p className="font-semibold text-neutral-800">{member.fullName} {team.leaderId === member.id && ' (Leader)'}</p>
                            <p className="text-sm text-neutral-500">{member.year}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export const MyTeamDashboard: React.FC<{ team: Team; members: UserProfile[]; }> = ({ team, members }) => {
  const { profile } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const isLeader = team.leaderId === profile?.id;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start border-b pb-4">
        <div>
          <h2 className="text-3xl font-extrabold text-neutral-900">{team.name}</h2>
          <p className="mt-2 text-neutral-600">{team.projectIdea}</p>
        </div>
        {isLeader && (
            <Button onClick={() => setIsEditModalOpen(true)} className="mt-4 sm:mt-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                    <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                </svg>
                Manage Team
            </Button>
        )}
      </div>
      
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {isLeader && (
          <div className="lg:col-span-1">
            <JoinRequests teamId={team.id} />
          </div>
        )}
        
        <div className={isLeader ? "lg:col-span-2" : "lg:col-span-3"}>
          <Members team={team} members={members} />
        </div>
      </div>
      
      <div className="mt-8">
        <div
            className="bg-gradient-to-r from-primary to-indigo-600 text-white p-6 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow flex items-center justify-between"
            onClick={() => setIsChatOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setIsChatOpen(true)}
            aria-label="Open team chat"
        >
            <div>
                <h3 className="text-2xl font-bold">Team Chat Room</h3>
                <p className="opacity-90">Communicate with your team in real-time.</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 opacity-70" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h1a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
            </svg>
        </div>
      </div>

      <Modal 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        title={`💬 ${team.name} - Team Chat`}
        contentClassName="p-0"
      >
        <TeamChat teamId={team.id} members={members} />
      </Modal>

      {isEditModalOpen && <EditTeamModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} team={team} />}
    </div>
  );
};


// --- OtherTeamsList ---
const OtherTeamCard: React.FC<{ team: Team }> = ({ team }) => {
  const { getUserById } = useData();
  const leader = getUserById(team.leaderId);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex justify-between items-center transition hover:shadow-lg">
      <div>
        <h4 className="font-bold text-neutral-800">{team.name}</h4>
        {leader && <p className="text-sm text-neutral-500">Led by {leader.fullName}</p>}
      </div>
      {team.isRecruiting ? 
        <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">Recruiting</span> : 
        <span className="text-xs font-bold bg-neutral-200 text-neutral-600 px-2 py-1 rounded-full">Full</span>
      }
    </div>
  );
};

export const OtherTeamsList: React.FC = () => {
  const { teams } = useData();
  const { profile } = useAuth();
  
  const otherTeams = teams.filter(t => t.id !== profile?.teamId);

  if (otherTeams.length === 0) {
      return null;
  }

  return (
    <div className="mt-12">
        <h3 className="text-xl font-bold text-neutral-800 mb-4">Other Teams on Campus</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {otherTeams.map(team => (
                <OtherTeamCard key={team.id} team={team} />
            ))}
        </div>
    </div>
  );
};