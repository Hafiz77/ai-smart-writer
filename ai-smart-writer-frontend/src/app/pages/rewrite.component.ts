import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { HistoryService } from '../services/history.service';

@Component({
  standalone: true,
  selector: 'app-rewrite',
  imports: [FormsModule, CommonModule],
  template: `
  <div class="card">
    <h2>Article Rewriter</h2>
    <label>Original text</label>
    <textarea class="input" rows="8" [(ngModel)]="text"></textarea>
    <label>Tone</label>
    <select class="input" [(ngModel)]="tone">
      <option *ngFor="let t of tones" [value]="t">{{t}}</option>
    </select>
    <div style="margin-top:10px; display:flex; gap:8px;">
      <button class="btn" (click)="generateArticle()" [disabled]="articleLoading">
        <span *ngIf="articleLoading">⏳ Generating Article...</span>
        <span *ngIf="!articleLoading">Generate Article</span>
      </button>
      <button class="btn" (click)="startMic()" [disabled]="speechLoading">
        <span *ngIf="speechLoading">🎙️ Listening...</span>
        <span *ngIf="!speechLoading">🎙️ Dictate</span>
      </button>
      <button class="btn" (click)="rewrite()" [disabled]="rewriteLoading">
        <span *ngIf="rewriteLoading">⏳ Rewriting...</span>
        <span *ngIf="!rewriteLoading">Rewrite</span>
      </button>
      <button class="btn" [disabled]="!output" (click)="copy(output)">Copy</button>
      <button class="btn" [disabled]="!output" (click)="saveHistory()">Save</button>
    </div>
    @if (output) {

      <div style="margin-top:12px;" class="output">{{output}}</div>
    }
    <div style="margin-top:10px;">
      <input type="file" (change)="onFileChange($event)" accept=".docx" />
      <button class="btn" (click)="getDocxSummary()" [disabled]="docxLoading || !docxFile">
        <span *ngIf="docxLoading">⏳ Summarizing...</span>
        <span *ngIf="!docxLoading">Summarize Docx</span>
      </button>
      <button class="btn" (click)="recheckDocx()" [disabled]="docxLoading || !docxFile">Recheck</button>
    </div>
    <div *ngIf="docxSummary">
      <h3>Document Summary</h3>
      <div>{{docxSummary}}</div>
    </div>
  </div>
  `,
  providers: [HistoryService, HttpClient]
})
export class RewriteComponent {
  text = '';
  tone = 'Professional';
  tones = ['Professional', 'Friendly', 'Formal', 'Casual', 'Persuasive', 'Empathetic', 'Confident', 'Concise', 'Playful'];
  output = '';
  loading = false;
  rewriteLoading = false;
  articleLoading = false;
  speechLoading = false;
  docxSummary = '';
  docxLoading = false;
  docxFile: File | null = null;

  constructor(private http: HttpClient, private hs: HistoryService, private cdr: ChangeDetectorRef) { }

  rewrite() {
    this.rewriteLoading = true;
    this.http.post<any>('/api/rewrite-article', {
      content: this.text,
      tone: this.tone
    })
      .subscribe(
        res => {
          this.output = res.rewritten ?? '';
          this.saveHistoryAuto();
          this.rewriteLoading = false;
          this.cdr.detectChanges();
        },
        err => {
          this.output = 'Error rewriting';
          this.rewriteLoading = false;
          this.cdr.detectChanges();
        }
      );
  }

  generateArticle() {
    this.articleLoading = true;
    this.http.post<any>('/api/generate-article', {
      content: this.text,
      tone: this.tone
    })
      .subscribe(
        res => {
          this.output = res.article ?? '';
          this.saveHistoryAuto();
          this.articleLoading = false;
          this.cdr.detectChanges();
        },
        err => {
          this.output = 'Error generating article';
          this.articleLoading = false;
          this.cdr.detectChanges();
        }
      );
  }

  startMic() {
    const w: any = window as any;
    const SpeechRec = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRec) return alert('Speech Recognition not supported in this browser.');
    this.speechLoading = true;
    this.text = '';
    const rec = new SpeechRec();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      this.text = e.results[0][0].transcript;
      console.log('this.text: ', this.text);
      this.speechLoading = false;
      this.cdr.detectChanges();
      alert('Speech captured!');
      this.generateArticle();
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

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.docx')) {
      this.docxFile = file;
    } else {
      alert('Please upload a .docx file');
      this.docxFile = null;
    }
  }
  getDocxSummary() {
    if (!this.docxFile) return;
    this.docxLoading = true;
    const formData = new FormData();
    formData.append('file', this.docxFile);
    this.http.post<any>('/api/docx-summary', formData)
      .subscribe(
        res => {
          this.docxSummary = res.summary ?? '';
          this.docxLoading = false;
          this.cdr.detectChanges();
        },
        err => {
          this.docxSummary = 'Error summarizing document';
          this.docxLoading = false;
          this.cdr.detectChanges();
        }
      );
  }
  recheckDocx() {
    this.getDocxSummary();
  }
  copy(text: string) { navigator.clipboard.writeText(text); alert('Copied'); }
  saveHistory() { if (this.output) this.hs.add({ type: 'Article', result: this.output }); alert('Saved to history'); }
  saveHistoryAuto() { if (this.output) this.hs.add({ type: 'Article', result: this.output }); }
}
