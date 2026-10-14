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
      id: `${Date.now()}-${digits.slice(-4)}`,
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
      this.contacts = saved ? JSON.parse(saved) as TrustedContact[] : [];
    } catch {
      this.contacts = [];
      localStorage.removeItem(this.storageKey);
    }
  }

  private saveContacts(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(this.contacts));
    }
  }
}