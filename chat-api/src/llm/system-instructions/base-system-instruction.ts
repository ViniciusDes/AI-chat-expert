import { SystemInstruction } from './system-instruction.interface';

const GLOBAL_DIRECTIVES = `
  [Language and Response]
  MANDATORY: Identify the language of the user's last input and respond EXCLUSIVELY in that language.
  If the user writes in English, respond in English. If they write in Portuguese, respond in Portuguese.

  [Deviation Handling]
  If the user goes off-topic, politely decline in the same language they used
  and redirect them back to Argentine flavors, keeping the conversation dynamic.
`;

export abstract class BaseSystemInstruction implements SystemInstruction {
  getInstruction(): string {
    return `${GLOBAL_DIRECTIVES}\n${this.getIdentityAndScope()}`;
  }

  getIdentityAndScope() {
    return `[Identity and Scope]
            ${this.getDomainInstruction()}`;
  }

  protected abstract getDomainInstruction(): string;
}
