import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HistoryService } from '../services/history.service';
import { HttpClient } from '@angular/common/http';

@Component({
  standalone: true,
  selector: 'app-history',
  template: `
  <div class="card">
    <h2>History</h2>
    <button class="btn" (click)="clearAll()">Clear All</button>
    <div *ngIf="items.length === 0" style="margin-top:12px;">No history yet.</div>
    <ul style="margin-top:12px;">
      <li *ngFor="let it of items; let i = index" style="margin-bottom:10px; padding:8px; background:#fff; border-radius:8px;">
        <div style="display:flex; justify-content:space-between;">
          <div>
            <strong>{{it.type}}</strong> <span style="color:#666; font-size:12px;">{{ it.timestamp | date:'short' }}</span>
            <div style="margin-top:6px; white-space:pre-wrap;">{{ it.result }}</div>
          </div>
          <div style="display:flex; flex-direction:column; gap:6px;">
            <button class="btn" (click)="reuse(i)">Reuse</button>
            <button class="btn" (click)="remove(i)" style="background:#ef4444">Delete</button>
          </div>
        </div>
      </li>
    </ul>
  </div>
  `,
  providers: [HistoryService, HttpClient],
  imports: [DatePipe, CommonModule]
})
export class HistoryComponent {
  items: any[] = [];
  constructor(private hs: HistoryService) { this.load(); }
  load() { this.items = this.hs.getAll(); }
  clearAll() { this.hs.clear(); this.load(); }
  remove(i: number) { this.hs.remove(i); this.load(); }
  reuse(i: number) { const it = this.items[i]; alert('Reuse item:\n\n' + it.result); }
}
