

import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { UserYear } from '../types';
import { MultiSelect, Button } from '../components/common/Core';
import { Avatar } from '../components/ui/Core';

const ProfileSetupPage: React.FC = () => {
  const { currentUser, createProfile } = useAuth();
  const { getSkills, addNewSkill } = useData();
  const [fullName, setFullName] = useState(currentUser?.displayName || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.photoURL || '');
  const [year, setYear] = useState<UserYear>('1st Year');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        await createProfile({ fullName, avatarUrl, year, bio, skills, teamId: null });
    } catch (error) {
        console.error(error);
        alert("Failed to create profile. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center text-primary mb-2">
          Create Your Profile
        </h1>
        <p className="text-center text-neutral-600 mb-8">
          Welcome to the IES SIH Internal Hackathon Team Formation! Let's get you set up.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-neutral-700">Full Name</label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">Profile Photo</label>
            <div className="mt-2 flex items-center gap-4">
              <Avatar src={avatarUrl} name={fullName || 'User'} size="lg" />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
                accept="image/png, image/jpeg, image/gif"
              />
              <Button type="button" variant="ghost" onClick={() => fileInputRef.current?.click()}>
                Upload Photo
              </Button>
            </div>
          </div>
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-neutral-700">Year of Study</label>
            <select
              id="year"
              value={year}
              onChange={(e) => setYear(e.target.value as UserYear)}
              className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              required
            >
              <option>1st Year</option>
              <option>2nd Year</option>
              <option>3rd Year</option>
              <option>Final Year</option>
            </select>
          </div>
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-neutral-700">Bio</label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell us about your interests, hackathon goals, and experience."
              className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              required
            />
          </div>
           <div>
            <label className="block text-sm font-medium text-neutral-700">Skills</label>
             <MultiSelect 
                options={getSkills()}
                selected={skills}
                onChange={setSkills}
                onAddNewOption={addNewSkill}
             />
             <p className="text-xs text-neutral-500 mt-1">Select from the list or type a new skill and press Enter.</p>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? 'Saving...' : 'Complete Profile'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetupPage;