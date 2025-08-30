import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private key = 'aiHistory_v1';

  getAll() {
    const raw = localStorage.getItem(this.key);
    return raw ? JSON.parse(raw) : [];
  }

  add(item: { type: string; title?: string; result: string }) {
    const arr = this.getAll();
    arr.unshift({ ...item, timestamp: new Date().toISOString() });
    localStorage.setItem(this.key, JSON.stringify(arr));
  }

  remove(index: number) {
    const arr = this.getAll();
    arr.splice(index, 1);
    localStorage.setItem(this.key, JSON.stringify(arr));
  }

  clear() {
    localStorage.removeItem(this.key);
  }
}
