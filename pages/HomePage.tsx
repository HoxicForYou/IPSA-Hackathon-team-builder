
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { TeammateList } from '../components/users';
import { TeamList, MyTeamDashboard, OtherTeamsList } from '../components/teams';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { UserProfile, Team } from '../types';
import CommunityChat from '../components/chat/CommunityChat';
import { db } from '../services/firebase';
import { Spinner } from '../components/ui/Core';

type View = 'teammates' | 'teams';

const HomePage: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('teams');
  const { profile } = useAuth();
  const { users } = useData();
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [loadingTeam, setLoadingTeam] = useState<boolean>(true);

  // This effect creates a dedicated, real-time listener for the user's specific team.
  // It activates as soon as a user's profile contains a teamId, eliminating race conditions
  // between the profile update and the global teams list update.
  useEffect(() => {
    // Ensure we have a profile and a teamId before proceeding.
    if (!profile || !profile.teamId) {
      setMyTeam(null);
      setLoadingTeam(false);
      return;
    }
    
    setLoadingTeam(true);
    const teamRef = db.ref(`teams/${profile.teamId}`);
    
    const listener = teamRef.on('value', snapshot => {
      if (snapshot.exists()) {
        setMyTeam({ id: snapshot.key, ...snapshot.val() } as Team);
      } else {
        // This case handles if a team is deleted while the user is viewing it,
        // which will correctly transition them back to the TeamList view.
        setMyTeam(null);
      }
      setLoadingTeam(false);
    });

    // Cleanup function to detach the listener when the component unmounts
    // or when the profile object changes (e.g., user logs out or joins a new team).
    return () => {
      teamRef.off('value', listener);
    };
  }, [profile]); // Rerun this effect whenever the profile object from AuthContext changes.


  const hasTeam = !!profile?.teamId && !!myTeam;

  const myTeamMembers = (myTeam && myTeam.members)
    ? Object.keys(myTeam.members).map(id => users.find(u => u.id === id)).filter((u): u is UserProfile => !!u)
    : [];
  
  const renderTeamsView = () => {
    if (loadingTeam) {
        return (
            <div className="flex justify-center items-center p-16">
                <Spinner size="lg" />
            </div>
        );
    }

    if (hasTeam && myTeam) {
      return (
        <div className="space-y-8">
          <MyTeamDashboard team={myTeam} members={myTeamMembers} />
          <OtherTeamsList />
        </div>
      );
    }
    return <TeamList />;
  };

  const renderMainContent = () => {
    return activeView === 'teams' ? renderTeamsView() : <TeammateList />;
  }

  return (
    <div className="bg-neutral-100 min-h-screen">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div>
            <div className="bg-white rounded-xl shadow-lg p-2 mb-8 max-w-md mx-auto">
            <div className="flex justify-center space-x-1">
                <button
                onClick={() => setActiveView('teams')}
                className={`w-1/2 py-2.5 px-4 text-center font-semibold rounded-lg transition-all duration-300 ${activeView === 'teams' ? 'bg-primary text-white shadow-md' : 'text-neutral-500 hover:bg-primary/10'}`}
                >
                {hasTeam ? '✨ My Team' : '🚪 Explore Rooms'}
                </button>
                <button
                onClick={() => setActiveView('teammates')}
                className={`w-1/2 py-2.5 px-4 text-center font-semibold rounded-lg transition-all duration-300 ${activeView === 'teammates' ? 'bg-primary text-white shadow-md' : 'text-neutral-500 hover:bg-primary/10'}`}
                >
                🧑‍🤝‍🧑 Find Teammates
                </button>
            </div>
            </div>
            {renderMainContent()}
        </div>
      </main>
      <CommunityChat />
    </div>
  );
};

export default HomePage;
