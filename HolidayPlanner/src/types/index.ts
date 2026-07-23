export type UserRole = 'admin' | 'dad';

export interface Member {
  id: string;
  name: string;
  role: UserRole;
  photoUrl?: string;
  totalPoints: number;
}

export interface Child {
  id: string;
  name: string;
  photoUrl?: string;
  parentUserId: string;
  totalPoints: number;
}

export interface Holiday {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  createdBy: string;
  adminUserId: string;
  inviteCode: string;
}

export interface Activity {
  id: string;
  title: string;
  date: string;
  time?: string;
  description?: string;
  assignedTo?: string;
}

export interface Meal {
  date: string;
  breakfast?: string;
  lunch?: string;
  dinner?: string;
  cook?: string;
}

export interface Trip {
  id: string;
  title: string;
  date: string;
  location?: string;
  notes?: string;
  imageUrl?: string;
}

export interface Competition {
  id: string;
  name: string;
  description?: string;
  scores: Record<string, number>;
}

export interface CleaningTask {
  id: string;
  task: string;
  assignedTo: string;
  date: string;
  done: boolean;
}
