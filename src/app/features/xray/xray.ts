import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { XRayStore } from './xray.store';

interface PipelineNode {
  readonly key: string;
  readonly label: string;
  readonly side: 'client' | 'network' | 'server';
  readonly durationMs?: number;
}

@Component({
  selector: 'app-xray',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [XRayStore],
  imports: [RouterLink],
  templateUrl: './xray.html',
  styleUrl: './xray.css',
})
export class XRay {
  protected readonly store = inject(XRayStore);

  /** Client + network framing around the real server stages from the API. */
  protected readonly nodes = computed<PipelineNode[]>(() => {
    const server = this.store.stages().map((s): PipelineNode => ({
      key: s.key,
      label: s.label,
      side: 'server',
      durationMs: s.durationMs,
    }));
    return [
      { key: 'component', label: 'Component click → SignalStore', side: 'client' },
      { key: 'http', label: 'HttpClient interceptor', side: 'client' },
      { key: 'network', label: 'HTTPS → Render', side: 'network' },
      ...server,
      { key: 'response', label: 'JSON → signal.set() → OnPush render', side: 'client' },
    ];
  });

  /** Map the store's server activeIndex onto the framed node list. */
  protected readonly activeNode = computed(() => {
    const idx = this.store.activeIndex();
    if (idx < 0) return this.store.status() === 'loading' ? 2 : -1; // network while loading
    const serverCount = this.store.stages().length;
    if (idx >= serverCount) return 3 + serverCount; // response node
    return 3 + idx; // offset past the 3 client/network nodes
  });

  protected state(i: number): 'done' | 'active' | 'pending' {
    const active = this.activeNode();
    if (active < 0) return 'pending';
    if (i < active) return 'done';
    if (i === active) return 'active';
    return 'pending';
  }
}
