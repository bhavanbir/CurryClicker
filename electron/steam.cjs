// Steam wrappers. Every call no-ops when Steam isn't running or the native
// module fails to load (dev machines, review builds) so the game always runs.

// TODO steam-appid: replace 480 (Spacewar test app) with the real Curry Clicker
// App ID before release. Overridable via env for local testing.
const STEAM_APP_ID = Number(process.env.CURRY_STEAM_APPID) || 480;

// Must match the leaderboard/stat name configured in the Steamworks partner
// dashboard.
const LEADERBOARD_NAME = "weekly_curry";

let client = null;

function init(appId = STEAM_APP_ID) {
  try {
    const steamworks = require("steamworks.js");
    client = steamworks.init(appId);
    console.log(`[steam] init ok (app ${appId}) as ${client.localplayer.getName()}`);
    return true;
  } catch (err) {
    console.warn("[steam] unavailable, continuing without Steam:", err.message);
    client = null;
    return false;
  }
}

function isAvailable() {
  return client !== null;
}

function unlockAchievement(id) {
  if (!client) return false;
  try {
    return client.achievement.activate(id);
  } catch (err) {
    console.warn("[steam] unlockAchievement failed:", err.message);
    return false;
  }
}

function submitWeekScore(value) {
  if (!client) return false;
  try {
    // steamworks.js (this version) exposes achievements + stats but NOT the
    // ISteamUserStats leaderboard upload API. We record the week's total as an
    // int stat as a stand-in so the renderer->bridge->main plumbing is proven;
    // swap for a real leaderboard upload when the binding supports it.
    const clamped = Math.max(0, Math.min(Math.floor(Number(value) || 0), 2147483647));
    client.stats.setInt(LEADERBOARD_NAME, clamped);
    return client.stats.store();
  } catch (err) {
    console.warn("[steam] submitWeekScore failed:", err.message);
    return false;
  }
}

module.exports = { init, isAvailable, unlockAchievement, submitWeekScore };
