import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateSessionMetrics,
  levelFromXp,
  xpProgressInLevel,
} from "@karaoke/shared";

describe("reading metrics", () => {
  it("keeps early reading rewards in a readable scale", () => {
    const result = calculateSessionMetrics({
      wordCount: 80,
      durationSeconds: 60,
      omissions: 0,
      substitutions: 0,
      hesitations: 0,
      prosodyScore: 3,
    });

    assert.equal(result.score, 20);
    assert.equal(result.xpEarned, 10);
  });

  it("applies prosody and combo without exploding the score", () => {
    const result = calculateSessionMetrics({
      wordCount: 120,
      durationSeconds: 60,
      omissions: 0,
      substitutions: 0,
      hesitations: 0,
      prosodyScore: 5,
      comboMultiplier: 1.5,
    });

    assert.equal(result.score, 59);
    assert.equal(result.xpEarned, 30);
  });

  it("keeps level progression stable", () => {
    assert.equal(levelFromXp(0), 1);
    assert.equal(levelFromXp(499), 1);
    assert.equal(levelFromXp(500), 2);
    assert.deepEqual(xpProgressInLevel(625), {
      current: 125,
      needed: 500,
      percent: 25,
    });
  });
});
