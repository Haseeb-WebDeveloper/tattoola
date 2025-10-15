import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";

type TattooSizeOption =
  | "credit_card"
  | "palm"
  | "hand"
  | "half_sleeve";

type ColorChoice = "black_white" | "color";

export type PrivateRequestAnswers = {
  artistUserId: string;
  size?: TattooSizeOption;
  referenceMedia: Array<{ id: string; uri: string; type: "image" | "video"; cloud?: string }>;
  color?: ColorChoice;
  description?: string;
  isAdult?: boolean; // true if >= 18
};

type StepKey = 1 | 2 | 3 | 4 | 5 | 6; // 6 = success

type PrivateRequestState = {
  currentStep: StepKey;
  answers: PrivateRequestAnswers;
  setArtist(userId: string): void;
  setSize(size: TattooSizeOption): void;
  addReference(media: { uri: string; type: "image" | "video"; cloud?: string }): void;
  removeReference(id: string): void;
  setReferences(media: Array<{ id: string; uri: string; type: "image" | "video"; cloud?: string }>): void;
  setColor(choice: ColorChoice): void;
  setDescription(text: string): void;
  setIsAdult(isAdult: boolean): void;
  next(): void;
  back(): void;
  reset(): void;
};

export const usePrivateRequestStore = create<PrivateRequestState>((set, get) => ({
  currentStep: 1,
  answers: { artistUserId: "", referenceMedia: [] },
  setArtist: (userId) => set((s) => ({ answers: { ...s.answers, artistUserId: userId } })),
  setSize: (size) => set((s) => ({ answers: { ...s.answers, size } })),
  addReference: (media) =>
    set((s) => ({
      answers: {
        ...s.answers,
        referenceMedia: [...s.answers.referenceMedia, { id: uuidv4(), ...media }],
      },
    })),
  removeReference: (id) =>
    set((s) => ({
      answers: {
        ...s.answers,
        referenceMedia: s.answers.referenceMedia.filter((m) => m.id !== id),
      },
    })),
  setReferences: (media) => set((s) => ({ answers: { ...s.answers, referenceMedia: media } })),
  setColor: (color) => set((s) => ({ answers: { ...s.answers, color } })),
  setDescription: (description) => set((s) => ({ answers: { ...s.answers, description } })),
  setIsAdult: (isAdult) => set((s) => ({ answers: { ...s.answers, isAdult } })),
  next: () => set((s) => ({ currentStep: (Math.min(6, (s.currentStep + 1)) as StepKey) })),
  back: () => set((s) => ({ currentStep: (Math.max(1, (s.currentStep - 1)) as StepKey) })),
  reset: () => set({ currentStep: 1, answers: { artistUserId: "", referenceMedia: [] } }),
}));


