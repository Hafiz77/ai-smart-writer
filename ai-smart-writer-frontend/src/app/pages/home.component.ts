import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [RouterLink],
  template: `
  <div class="card">
    <h2>Welcome to AI Smart Writer</h2>
    <p>Use the navigation to generate emails, rewrite articles, check grammar, or view history.</p>
    <div style="margin-top:12px;"><a class="btn" routerLink="/email">Try Email Generator</a></div>
  </div>
  `
})
export class HomeComponent {}
