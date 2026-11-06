import { TrustedContactsService } from './trusted-contacts.service';

describe('TrustedContactsService', () => {
  const storageKey = 'cliccontigo-trusted-contacts';

  beforeEach(() => {
    localStorage.removeItem(storageKey);
  });

  it('normalizes and stores a Colombian contact', () => {
    const service = new TrustedContactsService();

    expect(service.addContact('  Ana  ', '300 123 4567')).toBeTrue();
    expect(service.contacts).toEqual([
      jasmine.objectContaining({ name: 'Ana', phone: '+573001234567' })
    ]);
    expect(service.persistenceAvailable).toBeTrue();
  });

  it('ignores malformed saved contact data', () => {
    localStorage.setItem(storageKey, JSON.stringify({ name: 'Ana' }));
    spyOn(console, 'warn');

    const service = new TrustedContactsService();

    expect(service.contacts).toEqual([]);
    expect(service.persistenceAvailable).toBeFalse();
  });

  it('keeps contacts usable when browser storage is unavailable', () => {
    spyOn(Storage.prototype, 'setItem').and.throwError('Storage unavailable');
    spyOn(console, 'warn');
    const service = new TrustedContactsService();

    expect(service.addContact('Ana', '300 123 4567')).toBeTrue();
    expect(service.contacts.length).toBe(1);
    expect(service.persistenceAvailable).toBeFalse();
  });
});
