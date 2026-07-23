export type UserRole = 'admin' | 'dad';

export interface Member {
  id: string;
  name: string;
  role: UserRole;
  photoUrl?: string;
  avatar?: string;
  totalPoints: number;
}

export interface Child {
  id: string;
  name: string;
  photoUrl?: string;
  avatar?: string;
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

export interface UserHoliday {
  id: string;
  holidayName: string;
  role: UserRole;
  joinedAt: string;
}

export interface Meal {
  date: string;
  breakfast?: string;
  breakfastCook?: string;
  lunch?: string;
  lunchCook?: string;
  dinner?: string;
  dinnerCook?: string;
}

export interface Trip {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  notes?: string;
  imageUrl?: string;
  rsvp?: Record<string, boolean>;
}

export interface Guest {
  id: string;
  name: string;
}

export interface Competition {
  id: string;
  name: string;
  description?: string;
  scores: Record<string, number>;
  guests?: Guest[];
}

export interface CleaningTask {
  id: string;
  task: string;
  assignedTo: string;
  date: string;
  done: boolean;
}
