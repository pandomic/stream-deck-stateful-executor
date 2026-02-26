import { Eta } from 'eta';

const eta = new Eta({
  useWith: true,
  tags: ['{{', '}}'],
});

export function renderTemplate(template: string, data: any): string {
  try {
    const templateParams = typeof data === 'object' ? { ...data } : { result: data };
    return eta.renderString(template, templateParams);
  } catch (error) {
    throw new Error(`Failed to render template: ${error instanceof Error ? error.message : String(error)}`);
  }
}
