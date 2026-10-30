type FlowRouter = {
  dismissTo: (href: any) => void;
};

/**
 * Leaves a finished submission flow. `dismissTo` pops every screen above the
 * destination in one call, so none of the completed form/step screens can be
 * reached again through Back (hardware, header or swipe). Flow-specific: pass
 * the destination that fits the feature.
 */
export function leaveCompletedFlow(router: FlowRouter, destination: any) {
  router.dismissTo(destination);
}

/**
 * Same goal as `leaveCompletedFlow`, for a flow that lives on a *tab* screen
 * (the Create tab). `dismissTo` dispatches POP_TO, which only stack navigators
 * handle: aimed at a tab navigator it is swallowed as a silent no-op, so the
 * user never leaves. Switching tabs is a navigate.
 */
export function leaveCompletedTabFlow(router: { navigate: (href: any) => void }, destination: any) {
  router.navigate(destination);
}

/**
 * Confirmation screens sit on top of the form steps. Any Back attempt on them
 * must exit the flow instead of revealing a completed step. Returns true when
 * the removal was intercepted (caller should then leave the flow).
 */
export function interceptBackOnConfirmation(
  event: { preventDefault: () => void; data?: { action?: { type?: string } } },
  alreadyLeaving: { current: boolean },
): boolean {
  if (alreadyLeaving.current) return false;
  event.preventDefault();
  return true;
}
