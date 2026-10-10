export type HeaderScrollState = {
  lastY: number;
  travel: number;
  visible: boolean;
};

const REVEAL_AT = 40;
const DIRECTION_DISTANCE = 12;

export function nextHeaderScrollState(
  state: HeaderScrollState,
  scrollY: number
): HeaderScrollState {
  const currentY = Math.max(0, scrollY);

  if (currentY <= REVEAL_AT) {
    return { lastY: currentY, travel: 0, visible: true };
  }

  const delta = currentY - state.lastY;
  if (delta === 0) return state;

  const travel = Math.sign(delta) === Math.sign(state.travel)
    ? state.travel + delta
    : delta;

  if (Math.abs(travel) >= DIRECTION_DISTANCE) {
    return { lastY: currentY, travel: 0, visible: travel < 0 };
  }

  return { lastY: currentY, travel, visible: state.visible };
}
