import axe from 'axe-core';

/**
 * Runs axe-core against a rendered fixture and throws (failing the test) if
 * any violation is found. Use after `fixture.detectChanges()` once the
 * component is in the state you want to assert (loaded / empty / error).
 *
 * `color-contrast` is disabled: jsdom has no paint engine, so axe can't
 * compute real rendered colors there and the rule is unreliable noise in
 * this environment (a known jsdom limitation, not a rule we don't care
 * about — contrast is asserted visually per CONVENTIONS.md's a11y gate).
 */
export async function assertNoA11yViolations(root: Element | Document): Promise<void> {
  const results = await axe.run(root, {
    rules: {
      'color-contrast': { enabled: false },
    },
  });

  if (results.violations.length > 0) {
    const details = results.violations
      .map((violation) => {
        const targets = violation.nodes.map((node) => node.target.join(' ')).join(', ');
        return `- ${violation.id} (${violation.impact}): ${violation.help}\n  targets: ${targets}\n  ${violation.helpUrl}`;
      })
      .join('\n');
    throw new Error(
      `axe found ${results.violations.length} accessibility violation(s):\n${details}`,
    );
  }
}
