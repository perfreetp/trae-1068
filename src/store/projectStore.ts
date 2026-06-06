import { create } from 'zustand';
import { ProjectInfo } from '@/types';
import { mockProjectInfo } from '@/mock/project';

interface ProjectStore {
  project: ProjectInfo;
  
  updateProject: (updates: Partial<ProjectInfo>) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  project: mockProjectInfo,

  updateProject: (updates) =>
    set((state) => ({
      project: {
        ...state.project,
        ...updates,
        updatedAt: new Date().toISOString(),
      },
    })),
}));
