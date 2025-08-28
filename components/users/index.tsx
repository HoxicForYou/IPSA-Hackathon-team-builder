
import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { UserProfile, UserYear } from '../../types';
import { Avatar, SkillBadge, Spinner } from '../ui/Core';
import { Button, Modal, MultiSelect } from '../common/Core';
import { findMatchingCandidates } from '../../services/geminiService';

// --- TeammateList ---
const TeammateCard: React.FC<{ user: UserProfile, onInvite: (userId: string) => void, canInvite: boolean, hasPendingInvitation: boolean }> = ({ user, onInvite, canInvite, hasPendingInvitation }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 flex flex-col transition hover:shadow-lg">
      <div className="flex items-center mb-4">
        <Avatar src={user.avatarUrl} name={user.fullName} size="lg" />
        <div className="ml-4">
          <h3 className="text-lg font-bold text-neutral-800">{user.fullName}</h3>
          <p className="text-sm text-neutral-500">{user.year}</p>
        </div>
      </div>
      <p className="text-neutral-700 text-sm mb-4 flex-grow">{user.bio}</p>
      <div className="mb-4">
        <h4 className="font-semibold text-sm mb-2 text-neutral-600">Skills:</h4>
        <div className="flex flex-wrap">
          {user.skills.slice(0, 5).map(skill => <SkillBadge key={skill} skill={skill} />)}
        </div>
      </div>
      {canInvite && (
        <Button onClick={() => onInvite(user.id)} size="sm" disabled={hasPendingInvitation}>
          {hasPendingInvitation ? 'Invitation Sent' : 'Send Invitation'}
        </Button>
      )}
    </div>
  );
};

export const TeammateList: React.FC = () => {
  const { users, inviteToTeam, getTeamById, invitations } = useData();
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UserProfile[] | null>(null);

  const myTeam = profile?.teamId;
  const isLeader = myTeam ? getTeamById(myTeam)?.leaderId === profile?.id : false;
  const canInvite = !!myTeam && isLeader;
  const availableStudents = users.filter(u => !u.teamId && u.id !== profile?.id);
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) {
        setSearchResults(null);
        return;
    }
    setIsAiSearching(true);
    try {
        const matchingIds = await findMatchingCandidates(searchQuery, availableStudents);
        const matchedUsers = matchingIds.map(id => users.find(u => u.id === id)).filter((u): u is UserProfile => !!u);
        setSearchResults(matchedUsers);
    } catch (error) {
        console.error(error);
        alert('Failed to perform AI search.');
    } finally {
        setIsAiSearching(false);
    }
  };
  
  const handleInvite = (userId: string) => {
      if (myTeam && isLeader) {
          inviteToTeam(userId, myTeam);
      } else {
          alert('You must be the leader of a team to invite members.');
      }
  };

  const usersToDisplay = searchResults ?? availableStudents;

  return (
    <div>
        <div className="bg-white p-4 rounded-lg shadow mb-6">
            <h2 className="text-xl font-bold text-neutral-800 mb-2">Find Your Next Teammate</h2>
            <p className="text-neutral-600 mb-4">Use the power of AI to find students with the skills you need.</p>
            <form onSubmit={handleSearch} className="flex items-center gap-2">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g., 'a python developer with experience in data science'"
                    className="flex-grow px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                />
                <Button type="submit" disabled={isAiSearching}>
                    {isAiSearching ? <Spinner size="sm" /> : (
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.464 6.015C6.015 12.536 5 14.643 5 17h10c0-2.357-1.015-4.464-2.536-5.985A4 4 0 0011 5z" clipRule="evenodd" />
                        </svg>
                    )}
                    AI Search
                </Button>
            </form>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {usersToDisplay.map(user => {
            const hasPendingInvitation = invitations.some(inv => inv.userId === user.id && inv.teamId === myTeam);
            return (
                <TeammateCard 
                    key={user.id} 
                    user={user} 
                    onInvite={handleInvite} 
                    canInvite={canInvite}
                    hasPendingInvitation={hasPendingInvitation}
                />
            );
        })}
      </div>
    </div>
  );
};


// --- EditProfileModal ---
export const EditProfileModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
  const { profile, updateProfile } = useAuth();
  const { getSkills, addNewSkill } = useData();
  
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [year, setYear] = useState<UserYear>('1st Year');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile && isOpen) {
      setFullName(profile.fullName);
      setAvatarUrl(profile.avatarUrl || '');
      setYear(profile.year);
      setBio(profile.bio);
      setSkills(profile.skills);
    }
  }, [profile, isOpen]);
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !year || !bio || skills.length === 0) {
      alert('Please fill out all fields, including at least one skill.');
      return;
    }
    setLoading(true);
    try {
        await updateProfile({ fullName, avatarUrl, year, bio, skills });
        onClose();
    } catch (error) {
        console.error(error);
        alert("Failed to update profile.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="✏️ Edit Your Profile">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
            <label htmlFor="editFullName" className="block text-sm font-medium text-neutral-700">Full Name</label>
            <input type="text" id="editFullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
        </div>
        <div>
            <label className="block text-sm font-medium text-neutral-700">Profile Photo</label>
            <div className="mt-2 flex items-center gap-4">
              <Avatar src={avatarUrl} name={fullName} size="lg" />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
                accept="image/png, image/jpeg, image/gif"
              />
              <Button type="button" variant="ghost" onClick={() => fileInputRef.current?.click()}>
                Change Photo
              </Button>
            </div>
        </div>
        <div>
            <label htmlFor="editYear" className="block text-sm font-medium text-neutral-700">Year of Study</label>
            <select id="editYear" value={year} onChange={(e) => setYear(e.target.value as UserYear)} required className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                <option>1st Year</option>
                <option>2nd Year</option>
                <option>3rd Year</option>
                <option>Final Year</option>
            </select>
        </div>
        <div>
            <label htmlFor="editBio" className="block text-sm font-medium text-neutral-700">Bio</label>
            <textarea id="editBio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} required className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
        </div>
        <div>
            <label className="block text-sm font-medium text-neutral-700">Skills</label>
            <MultiSelect options={getSkills()} selected={skills} onChange={setSkills} onAddNewOption={addNewSkill} />
            <p className="text-xs text-neutral-500 mt-1">Select from the list or type a new skill and press Enter.</p>
        </div>
        <div className="flex justify-end pt-4">
            <Button type="button" variant="ghost" onClick={onClose} className="mr-2">Cancel</Button>
            <Button type="submit" size="md" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
            </Button>
        </div>
      </form>
    </Modal>
  );
};
