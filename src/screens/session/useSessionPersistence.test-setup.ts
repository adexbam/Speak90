export const mockLoadSessionDraftAndSync = jest.fn();
export const mockSaveSessionDraftAndSync = jest.fn();
export const mockClearSessionDraftAndSync = jest.fn();
export const mockCompleteSessionAndSync = jest.fn();

jest.mock('../../state/app-progress-store', () => ({
  useAppProgressStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      loadSessionDraftAndSync: mockLoadSessionDraftAndSync,
      saveSessionDraftAndSync: mockSaveSessionDraftAndSync,
      clearSessionDraftAndSync: mockClearSessionDraftAndSync,
      completeSessionAndSync: mockCompleteSessionAndSync,
    }),
}));

export function resetSessionPersistenceTestMocks() {
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockLoadSessionDraftAndSync.mockResolvedValue(null);
  mockCompleteSessionAndSync.mockResolvedValue({});
}
