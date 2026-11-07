import { Injectable } from '@angular/core';

export interface TrustedContact {
  id: string;
  name: string;
  phone: string;
}

@Injectable({ providedIn: 'root' })
export class TrustedContactsService {
  private readonly storageKey = 'cliccontigo-trusted-contacts';
  contacts: TrustedContact[] = [];
  persistenceAvailable = true;

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
      this.persistenceAvailable = false;
      return;
    }

    try {
      const saved = localStorage.getItem(this.storageKey);
      if (!saved) {
        return;
      }

      const parsed: unknown = JSON.parse(saved);
      if (!Array.isArray(parsed)) {
        throw new Error('El formato de contactos guardados no es válido.');
      }

      this.contacts = parsed.filter((contact): contact is TrustedContact =>
        typeof contact === 'object' &&
        contact !== null &&
        'id' in contact &&
        typeof contact.id === 'string' &&
        'name' in contact &&
        typeof contact.name === 'string' &&
        'phone' in contact &&
        typeof contact.phone === 'string'
      );
    } catch {
      this.contacts = [];
      this.persistenceAvailable = false;
      console.warn('No se pudieron recuperar los contactos guardados; puedes agregarlos nuevamente.');
    }
  }

  private saveContacts(): void {
    if (typeof localStorage === 'undefined') {
      this.persistenceAvailable = false;
      return;
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.contacts));
      this.persistenceAvailable = true;
    } catch {
      this.persistenceAvailable = false;
      console.warn('No se pudieron guardar los contactos en este navegador.');
    }
  }
}