export interface Studio {
  id: string;
  name: string;
  isCompleted: boolean;
}

export type StudioRole = 'OWNER' | 'MANAGER' | 'MEMBER';

export interface StudioInfo {
  id: string;
  name: string;
  isCompleted: boolean;
  userRole: StudioRole;
}

