
import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home.component';
import { EmailComponent } from './pages/email.component';
import { RewriteComponent } from './pages/rewrite.component';
import { GrammarComponent } from './pages/grammar.component';
import { HistoryComponent } from './pages/history.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'email', component: EmailComponent },
  { path: 'rewrite', component: RewriteComponent },
  { path: 'grammar', component: GrammarComponent },
  { path: 'history', component: HistoryComponent }
];
