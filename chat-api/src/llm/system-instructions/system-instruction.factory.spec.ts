import { getSystemInstruction } from './system-instruction.factory';

describe('getSystemInstruction', () => {
  it('returns an instruction for argentine-cuisine', () => {
    const instruction = getSystemInstruction('argentine-cuisine');
    expect(instruction.getInstruction()).toContain('Argentine');
  });

  it('returns an instruction for classic-movies', () => {
    const instruction = getSystemInstruction('classic-movies');
    expect(instruction.getInstruction()).toContain('cinema');
  });

  it('returns an instruction for electric-cars', () => {
    const instruction = getSystemInstruction('electric-cars');
    expect(instruction.getInstruction()).toContain('electric');
  });

  it('throws a descriptive error for unknown specialist types', () => {
    expect(() => getSystemInstruction('cooking-tips')).toThrow(
      /Unknown specialist type/,
    );
  });

  it('error message lists the valid options', () => {
    expect(() => getSystemInstruction('random')).toThrow(
      /argentine-cuisine.*classic-movies.*electric-cars/,
    );
  });
});
