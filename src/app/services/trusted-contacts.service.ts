import { Injectable } from '@angular/core';

export interface TrustedContact {
  id: string;
  name: string;
  phone: string;
}

@Injectable({ providedIn: 'root' })
export class TrustedContactsService {
  private readonly storageKey = 'teacompano-trusted-contacts';
  contacts: TrustedContact[] = [];

  constructor() {
    this.loadContacts();
  }

  addContact(name: string, phone: string): boolean {
    const normalizedName = name.trim();
    const digits = phone.replace(/\D/g, '');
    if (!normalizedName || digits.length < 10 || digits.length > 15) {
      return false;
    }

    const normalizedPhone = phone.trim().startsWith('+')
      ? `+${digits}`
      : digits.length === 10 ? `+57${digits}` : `+${digits}`;

    if (this.contacts.some(contact => contact.phone === normalizedPhone)) {
      return false;
    }

    this.contacts = [...this.contacts, {
      id: normalizedPhone,
      name: normalizedName,
      phone: normalizedPhone
    }];
    this.saveContacts();
    return true;
  }

  removeContact(contactId: string): void {
    this.contacts = this.contacts.filter(contact => contact.id !== contactId);
    this.saveContacts();
  }

  private loadContacts(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const saved = localStorage.getItem(this.storageKey);
      if (!saved) {
        return;
      }

      const parsed: unknown = JSON.parse(saved);
      if (!Array.isArray(parsed)) {
        throw new Error('Saved trusted contacts must be an array.');
      }

      const validContacts = parsed.filter((contact): contact is TrustedContact => this.isTrustedContact(contact));
      const uniqueContacts = validContacts.filter((contact, index) =>
        validContacts.findIndex(item => item.id === contact.id || item.phone === contact.phone) === index
      );
      if (uniqueContacts.length !== parsed.length) {
        console.warn('Some saved trusted contacts were invalid or duplicated and were ignored.');
      }
      this.contacts = uniqueContacts;
    } catch (error: unknown) {
      console.warn('Could not load saved trusted contacts; clearing the invalid data.', error);
      localStorage.removeItem(this.storageKey);
    }
  }

  private isTrustedContact(value: unknown): value is TrustedContact {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return false;
    }

    const contact = value as Record<string, unknown>;
    const digits = typeof contact['phone'] === 'string' ? contact['phone'].replace(/\D/g, '') : '';
    return typeof contact['id'] === 'string'
      && contact['id'].length > 0
      && typeof contact['name'] === 'string'
      && contact['name'].trim().length > 0
      && typeof contact['phone'] === 'string'
      && digits.length >= 10
      && digits.length <= 15;
  }

  private saveContacts(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(this.contacts));
    }
  }
}