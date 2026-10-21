import assert from "node:assert/strict";
import { test } from "node:test";
import { filterFlats, getTowerFlats, reconcileFlat, toTowerOptions } from "../towerFlats";

const C1A = ["101","102","103","104","105","106","107","108","109","110","205","206","207","208","209","210",
  "301","302","303","304","305","306","307","308","309","310","402","403","404","405","406","407"];
const towerA: any = { _id: "a", name: "C1A", flats: C1A };
const towerB: any = { _id: "b", name: "C1B", flats: ["101", "102", "201A", "0101"] };

test("returns all 32 flats exactly as given", () => {
  assert.deepEqual(getTowerFlats(towerA), C1A);
  assert.equal(getTowerFlats(towerA).length, 32);
});
test("no flats invented when missing/empty/legacy", () => {
  assert.deepEqual(getTowerFlats({ _id: "x", name: "X", totalFlats: 40 } as any), []);
  assert.deepEqual(getTowerFlats({ _id: "x", name: "X", flats: [] } as any), []);
  assert.deepEqual(getTowerFlats(null), []);
});
test("preserves alphanumeric and leading zeros; dedupes; stringifies", () => {
  assert.deepEqual(getTowerFlats(towerB), ["101", "102", "201A", "0101"]);
  assert.deepEqual(getTowerFlats({ flats: [101, "101", " 102 ", "", null] } as any), ["101", "102"]);
});
test("search '20' returns only matching flats of that tower", () => {
  assert.deepEqual(filterFlats(getTowerFlats(towerA), "20"), ["205", "206", "207", "208", "209"]);
});
test("search 205 / 407 / nonexistent / trim / case / clear", () => {
  const a = getTowerFlats(towerA);
  assert.deepEqual(filterFlats(a, "205"), ["205"]);
  assert.deepEqual(filterFlats(a, " 407 "), ["407"]);
  assert.deepEqual(filterFlats(a, "999"), []);
  assert.equal(filterFlats(a, "   ").length, 32);
  assert.deepEqual(filterFlats(getTowerFlats(towerB), "a"), ["201A"]);
  assert.deepEqual(filterFlats(getTowerFlats(towerB), "0101"), ["0101"]);
});
test("same flat in two towers stays per-tower", () => {
  assert.ok(getTowerFlats(towerA).includes("101") && getTowerFlats(towerB).includes("101"));
  assert.deepEqual(filterFlats(getTowerFlats(towerB), "2"), ["102", "201A"]);
});
test("reconcileFlat clears selection invalid for the tower", () => {
  assert.equal(reconcileFlat("407", getTowerFlats(towerB)), null);
  assert.equal(reconcileFlat("101", getTowerFlats(towerB)), "101");
  assert.equal(reconcileFlat(null, C1A), null);
});
test("tower options show real flat counts", () => {
  const opts = toTowerOptions([towerA, towerB, { _id: "c", name: "C2" } as any]);
  assert.equal(opts[0].name, "C1A — 32 flats");
  assert.equal(opts[1].name, "C1B — 4 flats");
  assert.equal(opts[2].name, "C2");
});
