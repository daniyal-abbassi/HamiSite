export type MobileRuntimeEnvironment = {
  viewportWidth: number;
  coarsePointer: boolean;
  reducedMotion: boolean;
};

function isMobileRuntime({ viewportWidth, coarsePointer }: MobileRuntimeEnvironment) {
  return coarsePointer || viewportWidth <= 780;
}

export function shouldRunScrollChoreography(environment: MobileRuntimeEnvironment) {
  return !environment.reducedMotion && !isMobileRuntime(environment);
}

export function shouldUseObserverReveal(environment: MobileRuntimeEnvironment) {
  return !environment.reducedMotion && !isMobileRuntime(environment);
}

export function getMobileHeroObjectPosition() {
  return "88% center";
}
