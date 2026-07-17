import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SecurityLabStore } from './security-lab.store';

@Component({
  selector: 'app-security-lab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SecurityLabStore],
  imports: [RouterLink, JsonPipe],
  templateUrl: './security-lab.html',
  styleUrl: './security-lab.css',
})
export class SecurityLab {
  protected readonly store = inject(SecurityLabStore);

  protected readonly sqlInput = signal("' OR 1=1 --");
  protected readonly xssInput = signal('<script>alert(1)</script>');

  protected onSql(event: Event): void {
    this.sqlInput.set((event.target as HTMLInputElement).value);
  }

  protected onXss(event: Event): void {
    this.xssInput.set((event.target as HTMLInputElement).value);
  }
}
