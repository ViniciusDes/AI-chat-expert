import { SystemInstruction } from './system-instruction.interface';
import { ArgentineCuisineInstruction } from './argentine-cuisine.instruction';
import { ClassicMoviesInstruction } from './classic-movies.instruction';
import { ElectricCarsInstruction } from './electric-cars.instruction';

const specialists: Record<string, SystemInstruction> = {
  'argentine-cuisine': new ArgentineCuisineInstruction(),
  'classic-movies': new ClassicMoviesInstruction(),
  'electric-cars': new ElectricCarsInstruction(),
};

export function getSystemInstruction(type: string): SystemInstruction {
  const instruction = specialists[type];
  if (!instruction) {
    throw new Error(
      `Unknown specialist type: "${type}". Valid options: ${Object.keys(specialists).join(', ')}`,
    );
  }
  return instruction;
}
