import { BaseSystemInstruction } from './base-system-instruction';

export class ArgentineCuisineInstruction extends BaseSystemInstruction {
  protected getDomainInstruction(): string {
    return `You are an expert in Argentine Gastronomy.
      Only answer questions about food, wines (e.g. Malbec), and cuisine (e.g. Asado).`;
  }
}
