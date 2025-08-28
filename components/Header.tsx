

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Avatar } from './ui/Core';
import { EditProfileModal } from './users';
import { Invitation } from '../types';
import { Button } from './common/Core';
import { IPS_ACADEMY_LOGO } from '../constants';

const InvitationsDropdown: React.FC<{ invitations: Invitation[]; onClose: () => void; }> = ({ invitations, onClose }) => {
    const { getTeamById, handleInvitation } = useData();

    if (invitations.length === 0) {
        return (
            <div className="origin-top-right absolute right-0 mt-2 w-72 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                    <p className="text-center text-sm text-neutral-500 py-4">No new invitations.</p>
                </div>
            </div>
        );
    }
    
  return (
    <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
      <div className="p-2 border-b">
          <h3 className="text-sm font-semibold text-neutral-800">Team Invitations</h3>
      </div>
      <ul className="py-1 max-h-80 overflow-y-auto">
        {invitations.map(inv => {
          const team = getTeamById(inv.teamId);
          if (!team) return null;
          return (
            <li key={inv.id} className="px-4 py-2 hover:bg-neutral-100">
                <p className="text-sm text-neutral-700">
                    You have been invited to join <strong>{team.name}</strong>.
                </p>
                <div className="flex justify-end space-x-2 mt-2">
                    <Button size="sm" variant="ghost" onClick={() => { handleInvitation(inv.id, false); onClose(); }}>Decline</Button>
                    <Button size="sm" variant="secondary" onClick={() => { handleInvitation(inv.id, true); onClose(); }}>Accept</Button>
                </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};


const Header: React.FC = () => {
  const { profile, signOut } = useAuth();
  const { invitations } = useData();
  const [menuOpen, setMenuOpen] = useState(false);
  const [invitesOpen, setInvitesOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const invitesRef = useRef<HTMLDivElement>(null);

  const userInvitations = invitations.filter(inv => inv.userId === profile?.id);

  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setMenuOpen(false);
    }
    if (invitesRef.current && !invitesRef.current.contains(event.target as Node)) {
      setInvitesOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!profile) return null;

  return (
    <>
      <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src={IPS_ACADEMY_LOGO} alt="IPS Academy Logo" className="h-10 w-10" />
              <h1 className="hidden sm:block text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">IES SIH Team Formation</h1>
            </div>
            <div className="flex items-center space-x-4">
               <div className="relative" ref={invitesRef}>
                <button
                  onClick={() => setInvitesOpen(!invitesOpen)}
                  className="relative text-neutral-500 hover:text-primary focus:outline-none"
                  aria-label="Toggle invitations"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {userInvitations.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-accent text-white text-xs items-center justify-center">{userInvitations.length}</span>
                    </span>
                  )}
                </button>
                {invitesOpen && <InvitationsDropdown invitations={userInvitations} onClose={() => setInvitesOpen(false)} />}
              </div>

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center space-x-2 rounded-full p-1 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  aria-haspopup="true"
                  aria-expanded={menuOpen}
                >
                   <Avatar src={profile.avatarUrl} name={profile.fullName} size="md" />
                   <span className="hidden md:inline text-sm font-medium text-neutral-700 pr-2">{profile.fullName}</span>
                </button>

                {menuOpen && (
                  <div 
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                  >
                    <div className="py-1" role="none">
                      <button
                        onClick={() => { setIsEditModalOpen(true); setMenuOpen(false); }}
                        className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                        role="menuitem"
                      >
                        Edit Profile
                      </button>
                      <button
                        onClick={signOut}
                        className="block w-full text-left px-4 py-2 text-sm text-accent hover:bg-neutral-100"
                        role="menuitem"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;