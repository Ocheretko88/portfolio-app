import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Hero } from '../sections/hero/hero';
import { Profile } from '../sections/profile/profile';
import { Skills } from '../sections/skills/skills';
import { Experience } from '../sections/experience/experience';
import { Education } from '../sections/education/education';
import { Explore } from '../sections/explore/explore';
import { Contact } from '../sections/contact/contact';

/**
 * The landing page. A single scrollable document composed of self-contained,
 * data-driven section components — each one standalone, OnPush, and reading
 * from the ResumeService signal.
 */
@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Hero, Profile, Skills, Experience, Education, Explore, Contact],
  template: `
    <app-hero />
    <app-profile />
    <app-skills />
    <app-experience />
    <app-education />
    <app-explore />
    <app-contact />
  `,
})
export class Home {}
