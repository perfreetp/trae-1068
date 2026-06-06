import { create } from 'zustand';
import { Member } from '@/types';
import { mockMembers, mockCurrentUser } from '@/mock/users';

interface UserStore {
  members: Member[];
  currentUser: Member;
  
  addMember: (member: Omit<Member, 'id' | 'joinedAt'>) => void;
  updateMemberRole: (id: string, role: Member['role']) => void;
  removeMember: (id: string) => void;
  getMemberById: (id: string) => Member | undefined;
  getMemberName: (id: string) => string;
}

export const useUserStore = create<UserStore>((set, get) => ({
  members: mockMembers,
  currentUser: mockCurrentUser,

  addMember: (member) =>
    set((state) => ({
      members: [
        ...state.members,
        {
          ...member,
          id: `user${Date.now()}`,
          joinedAt: new Date().toISOString(),
        },
      ],
    })),

  updateMemberRole: (id, role) =>
    set((state) => ({
      members: state.members.map((m) => (m.id === id ? { ...m, role } : m)),
    })),

  removeMember: (id) =>
    set((state) => ({
      members: state.members.filter((m) => m.id !== id),
    })),

  getMemberById: (id) => get().members.find((m) => m.id === id),
  getMemberName: (id) => get().members.find((m) => m.id === id)?.name || '未知用户',
}));
