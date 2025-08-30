import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { HistoryService } from '../services/history.service';

@Component({
  standalone: true,
  selector: 'app-grammar',
  imports: [FormsModule, CommonModule],
  template: `
  <div class="card">
    <h2>Grammar Checker</h2>
    <label>Text</label>
    <textarea class="input" rows="8" [(ngModel)]="text"></textarea>
    <div style="margin-top:10px; display:flex; gap:8px;">
      <button class="btn" (click)="checkGrammar()" [disabled]="loading">
        <span *ngIf="loading">⏳ Checking...</span>
        <span *ngIf="!loading">Check Grammar</span>
      </button>
      <button class="btn" [disabled]="!output" (click)="copy(output)">Copy</button>
      <button class="btn" [disabled]="!output" (click)="saveHistory()">Save</button>
    </div>
    <div *ngIf="corrected">
      <h3>Corrected Text</h3>
      <div>{{corrected}}</div>
      <h4>Highlighted Changes</h4>
      <div [innerHTML]="diffHtml"></div>
    </div>
  </div>
  `,
  providers: [HistoryService, HttpClient]
})
export class GrammarComponent {
  text = '';
  output = '';
  loading = false;
  corrected = '';
  diffHtml = '';
  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, private hs: HistoryService) { }
  checkGrammar() {
    this.loading = true;
    this.http.post<any>('/api/grammar-check', {
      content: this.text
    })
      .subscribe(
        res => {
          this.corrected = res.corrected ?? '';
          this.diffHtml = this.getDiffHtml(this.text, this.corrected);
          this.loading = false;
          this.cdr.detectChanges();
        },
        err => {
          this.corrected = 'Error checking grammar';
          this.diffHtml = '';
          this.loading = false;
          this.cdr.detectChanges();
        }
      );
  }
  getDiffHtml(original: string, corrected: string): string {
    // Pure TypeScript word diff: highlight added/changed words
    const origWords = original.split(/\s+/);
    const corrWords = corrected.split(/\s+/);
    let html = '';
    let i = 0, j = 0;
    while (i < origWords.length && j < corrWords.length) {
      if (origWords[i] === corrWords[j]) {
        html += corrWords[j] + ' ';
        i++;
        j++;
      } else if (!origWords.includes(corrWords[j])) {
        // Added word
        html += `<span style="background: #c3e6cb;">${corrWords[j]}</span> `;
        j++;
      } else {
        // Changed word
        html += `<span style="background: #ffeeba;">${corrWords[j]}</span> `;
        i++;
        j++;
      }
    }
    // Remaining added words
    while (j < corrWords.length) {
      html += `<span style="background: #c3e6cb;">${corrWords[j]}</span> `;
      j++;
    }
    return html.trim();
  }
  copy(text: string) { navigator.clipboard.writeText(text); alert('Copied'); }
  saveHistory() { if (this.output) this.hs.add({ type: 'Grammar', result: this.output }); alert('Saved to history'); }
  saveHistoryAuto() { if (this.output) this.hs.add({ type: 'Grammar', result: this.output }); }
}
