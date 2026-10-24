import { LearningContentService } from './learning-content.service';

describe('LearningContentService', () => {
  const storageKey = 'teacompano-learning-progress';

  beforeEach(() => {
    localStorage.clear();
  });

  it('persists completed tutorials and verification answers', () => {
    const service = new LearningContentService();

    service.markTutorialComplete(1);
    expect(service.checkVerification(1, 'protect')).toBeTrue();

    const restored = new LearningContentService();
    expect(restored.totalCompletedTutorials).toBe(1);
    expect(restored.completedVerifications).toBe(1);
  });

  it('ignores invalid progress records', () => {
    localStorage.setItem(storageKey, JSON.stringify({
      tutorials: ['1', 999],
      verifications: null
    }));

    const service = new LearningContentService();

    expect(service.totalCompletedTutorials).toBe(0);
    expect(service.completedVerifications).toBe(0);
  });
});
