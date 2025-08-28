

export type UserYear = '1st Year' | '2nd Year' | '3rd Year' | 'Final Year';

export interface UserProfile {
  id: string; // Google UID
  email: string;
  fullName: string;
  avatarUrl?: string;
  year: UserYear;
  bio: string;
  skills: string[];
  teamId?: string | null;
}

export interface Team {
  id:string;
  name: string;
  projectIdea: string;
  leaderId: string;
  members: { [key: string]: boolean }; // Use keys for member IDs for easier lookups/updates
  isRecruiting: boolean;
  appeal?: {
    description: string;
    requiredSkills: string[];
  };
}

export interface JoinRequest {
  id: string;
  userId: string;
  teamId: string;
}

export interface Invitation {
  id: string;
  userId: string;
  teamId: string;
}

export interface ChatMessage {
  id: string;
  teamId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: number | object; // Support Firebase ServerValue.TIMESTAMP
  readBy?: { [key: string]: boolean };
}

export interface CommunityChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: number | object; // Support Firebase ServerValue.TIMESTAMP
  readBy?: { [key: string]: boolean };
}

export interface ProblemStatement {
  id: string;
  title: string;
  domain?: string;
  description: string;
  organization?: string;
  category?: string;
  theme?: string;
  department?: string;
}