import assert from "node:assert/strict";
import { test } from "node:test";
import { CommonActions, StackRouter, TabRouter } from "expo-router/build/react-navigation/routers";
import { findDivergentState, getPayloadFromStateRoute } from "expo-router/build/global-state/stateUtils";

// Drives the installed expo-router's own routers + target-resolution helpers
// over this app's real navigator layout:
//   root Stack: (tabs) | (shared)      (app/_layout.tsx)
//   (tabs) Tabs: home | business | directory | profile | create   (app/(tabs)/_layout.tsx)
// to pin down which router action actually brings the user back to Home from a
// finished creation flow. Not a render test — the glue below mirrors
// expo-router's getNavigateAction / useOnAction / useNavigationBuilder.

const TAB_NAMES = ["home", "business", "directory", "profile", "create"];
const ROOT_NAMES = ["(auth)", "(tabs)", "(shared)"];
const tabRouter: any = TabRouter({});
const rootRouter: any = StackRouter({});
const tabOpts = { routeNames: TAB_NAMES, routeParamList: {}, routeGetIdList: {} };
const rootOpts = { routeNames: ROOT_NAMES, routeParamList: {}, routeGetIdList: {} };

function tabsFocused(name: string) {
  const initial = tabRouter.getInitialState(tabOpts);
  return tabRouter.getStateForAction(initial, { type: "JUMP_TO", payload: { name } }, tabOpts) ?? initial;
}

// `onShared` = a (shared)/* screen (create-event/poll/service) pushed above (tabs).
function appState(focusedTab: string, onShared: boolean) {
  const routes: any[] = [{ key: "tabs-route", name: "(tabs)", state: tabsFocused(focusedTab) }];
  if (onShared) routes.push({ key: "shared-route", name: "(shared)", state: { routes: [{ name: "create-poll" }] } });
  return { stale: false, type: "stack", key: "root", index: routes.length - 1, routeNames: ROOT_NAMES, routes, preloadedRoutes: [] };
}

// What linking.getStateFromPath("/(tabs)/home") yields.
const HOME_PATH_STATE = { routes: [{ name: "(tabs)", state: { routes: [{ name: "home" }] } }] };

// Mirrors getNavigateAction: target the navigator where the action and the
// current state diverge; only "expo-tab" (native tabs) rewrites the type, the
// JS Tabs used here are type "tab", so the event type is kept as-is.
function buildAction(rootState: any, event: "POP_TO" | "NAVIGATE") {
  const { actionStateRoute, navigationState } = findDivergentState(HOME_PATH_STATE as any, rootState);
  const payload = getPayloadFromStateRoute(actionStateRoute || ({} as any));
  return { type: event, target: navigationState.key, payload: { name: payload.screen, params: payload.params } };
}

// Mirrors useOnAction: a navigator whose key is the action's target handles it;
// when its router returns null the result is "the current state" (handled, no
// bubbling), so an action the router doesn't support is a silent no-op.
function dispatch(rootState: any, action: any) {
  const tabsRoute = rootState.routes.find((r: any) => r.name === "(tabs)");
  const navigators: any[] = [
    { state: rootState, router: rootRouter, opts: rootOpts },
    { state: tabsRoute.state, router: tabRouter, opts: tabOpts },
  ];
  const nav = navigators.find((n) => n.state.key === action.target);
  assert.ok(nav, "action target must be a mounted navigator");
  const result = nav.router.getStateForAction(nav.state, action, nav.opts);
  if (result === null) return rootState; // handled as a no-op
  if (nav === navigators[0]) return result;
  return { ...rootState, routes: rootState.routes.map((r: any) => (r.name === "(tabs)" ? { ...r, state: result } : r)) };
}

// Mirrors useNavigationBuilder: a nested navigator consumes route.params.screen
// as a navigate action when its route's params change.
function consumeNestedParams(rootState: any) {
  const tabsRoute = rootState.routes.find((r: any) => r.name === "(tabs)");
  const p = tabsRoute.params;
  if (!p || typeof p.screen !== "string") return rootState;
  const next = tabRouter.getStateForAction(
    tabsRoute.state,
    CommonActions.navigate({ name: p.screen, params: p.params }),
    tabOpts,
  );
  return { ...rootState, routes: rootState.routes.map((r: any) => (r.name === "(tabs)" ? { ...r, state: next } : r)) };
}

const focusedTabName = (rootState: any) => {
  const tabs = rootState.routes.find((r: any) => r.name === "(tabs)").state;
  return tabs.routes[tabs.index].name;
};

test("dismissTo (POP_TO) from the Create tab targets the tab navigator and changes nothing", () => {
  const before = appState("create", false);
  const action = buildAction(before, "POP_TO");
  assert.equal(action.target, before.routes[0].state.key, "divergence is inside the tab navigator");
  const after = dispatch(before, action);
  assert.equal(focusedTabName(after), "create", "TabRouter has no POP_TO — the redirect silently never happens");
  assert.equal(after.routes.length, before.routes.length);
});

test("navigate from the Create tab switches to Home", () => {
  const before = appState("create", false);
  const after = dispatch(before, buildAction(before, "NAVIGATE"));
  assert.equal(focusedTabName(after), "home");
});

test("dismissTo (POP_TO) from a (shared) stack screen pops it and lands on Home", () => {
  const before = appState("create", true);
  const action = buildAction(before, "POP_TO");
  assert.equal(action.target, "root", "divergence is at the root stack");
  const popped = dispatch(before, action);
  assert.deepEqual(popped.routes.map((r: any) => r.name), ["(tabs)"]);
  assert.equal(focusedTabName(consumeNestedParams(popped)), "home");
});
