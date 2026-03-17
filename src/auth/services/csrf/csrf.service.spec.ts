import { CsrfService } from './csrf.service';

describe('CsrfService', () => {
  let service: CsrfService;

  beforeEach(() => {
    service = new CsrfService();
  });

  it('should issue and verify a token for a given user', () => {
    const token = service.issue(42);
    const payload = service.verify(token, 42);
    expect(payload.sub).toBe(42);
  });

  it('should reject token with different user', () => {
    const token = service.issue(1);
    expect(() => service.verify(token, 2)).toThrow(
      /non valide pour cet utilisateur/i,
    );
  });
});
