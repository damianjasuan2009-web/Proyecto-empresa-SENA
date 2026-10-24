import { TrustedContactsService } from './trusted-contacts.service';

describe('TrustedContactsService', () => {
  const storageKey = 'teacompano-trusted-contacts';

  beforeEach(() => {
    localStorage.clear();
  });

  it('normalizes Colombian phone numbers and rejects duplicates', () => {
    const service = new TrustedContactsService();

    expect(service.addContact('  Ana  ', '300 123 4567')).toBeTrue();
    expect(service.contacts[0]).toEqual({
      id: '+573001234567',
      name: 'Ana',
      phone: '+573001234567'
    });
    expect(service.addContact('Ana otra vez', '+57 300 123 4567')).toBeFalse();
    expect(service.contacts.length).toBe(1);
  });

  it('ignores malformed saved contact data', () => {
    localStorage.setItem(storageKey, JSON.stringify([
      { id: 'valid', name: 'Ana', phone: '+573001234567' },
      { id: '', name: '', phone: 'abc' }
    ]));
    spyOn(console, 'warn');

    const service = new TrustedContactsService();

    expect(service.contacts).toEqual([
      { id: 'valid', name: 'Ana', phone: '+573001234567' }
    ]);
    expect(console.warn).toHaveBeenCalled();
  });
});
