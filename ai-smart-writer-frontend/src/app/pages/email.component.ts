import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { HistoryService } from '../services/history.service';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-email',
  imports: [FormsModule, CommonModule],
  template: `
  <div class="card">
    <h2>Email Generator</h2>
    <label>Subject</label>
    <input class="input" [(ngModel)]="subject" placeholder="Subject" />
    <label>Write your requirement email context</label>
    <textarea class="input" rows="5" [(ngModel)]="points"></textarea>
    <label>Tone</label>
    <select class="input" [(ngModel)]="tone">
      <option *ngFor="let t of tones" [value]="t">{{t}}</option>
    </select>
    <label>Input Language</label>
    <select class="input" [(ngModel)]="inputLanguage">
      <option *ngFor="let lang of languages" [value]="lang.code">{{lang.name}}</option>
    </select>
    <label>Output Language</label>
    <select class="input" [(ngModel)]="outputLanguage">
      <option *ngFor="let lang of languages" [value]="lang.code">{{lang.name}}</option>
    </select>
    <div style="margin-top:10px; display:flex; gap:8px;">
      <button class="btn" (click)="generate()" [disabled]="loading">
        <span *ngIf="loading">⏳ Generating...</span>
        <span *ngIf="!loading">Generate</span>
      </button>
      <button class="btn" (click)="startMic()" [disabled]="speechLoading">
        <span *ngIf="speechLoading">🎙️ Listening...</span>
        <span *ngIf="!speechLoading">🎙️ Dictate</span>
      </button>
      <button class="btn" [disabled]="!output" (click)="copy(output)">Copy</button>
      <button class="btn" [disabled]="!output" (click)="saveHistory()">Save</button>
    </div>
    <ng-container *ngIf="output">
      <div style="margin-top:12px;" class="output">{{output}}</div>
    </ng-container>
    <div *ngIf="speechLoading" style="color: #007bff; margin-top:8px;">🎤 Listening... Please speak now.</div>
  </div>
  `,
  providers: [HistoryService, HttpClient],


})
export class EmailComponent {
  subject = '';
  points = '';
  tone = 'Professional';
  tones = ['Professional', 'Friendly', 'Formal', 'Casual', 'Persuasive', 'Empathetic', 'Confident', 'Concise'];
  languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'zh', name: 'Chinese' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ar', name: 'Arabic' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'bn', name: 'Bangla (Bengali)' }
  ];
  inputLanguage = 'en';
  outputLanguage = 'en';
  output = '';
  loading = false;
  speechLoading = false;

  constructor(private http: HttpClient, private hs: HistoryService, private cdr: ChangeDetectorRef) { }

  generate() {
    this.loading = true;
    this.http.post<any>('/api/generate-email', {
      subject: this.subject,
      points: this.points,
      tone: this.tone,
      inputLanguage: this.inputLanguage,
      outputLanguage: this.outputLanguage
    }).subscribe({
      next: (res) => {
        this.output = res.email ?? '';
        this.saveHistoryAuto();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.output = 'Error generating';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  copy(text: string) { navigator.clipboard.writeText(text); alert('Copied'); }

  startMic() {
    const w: any = window as any;
    const SpeechRec = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRec) return alert('Speech Recognition not supported in this browser.');
    this.speechLoading = true;
    this.points = '';
    const rec = new SpeechRec();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      this.points = e.results[0][0].transcript;
      console.log('this.points: ', this.points);
      this.speechLoading = false;
      alert('Speech captured!');
      this.cdr.detectChanges();
    };
    rec.onend = () => {
      this.speechLoading = false;
      this.cdr.detectChanges();

    };
    rec.onerror = () => {
      this.speechLoading = false;
      this.cdr.detectChanges();
      alert('Speech recognition error.');
    };
    rec.start();
    this.cdr.detectChanges();
  }

  saveHistory() { if (this.output) this.hs.add({ type: 'Email', title: this.subject || undefined, result: this.output }); alert('Saved to history'); }

  saveHistoryAuto() { if (this.output) this.hs.add({ type: 'Email', title: this.subject || undefined, result: this.output }); }
}
