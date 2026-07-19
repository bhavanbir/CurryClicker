// Steam wrappers. Every call no-ops when Steam isn't running or the native
// module fails to load (dev machines, review builds) so the game always runs.

// TODO steam-appid: replace 480 (Spacewar test app) with the real Curry Clicker
// App ID before release. Overridable via env for local testing.
const STEAM_APP_ID = Number(process.env.CURRY_STEAM_APPID) || 480;

// Must match the stat name configured in the Steamworks partner dashboard.
// Holds the player's best single-calendar-day curry total.
const STAT_NAME = "daily_curry_best";

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

function getPlayerName() {
  if (!client) return null;
  try {
    return client.localplayer.getName();
  } catch (err) {
    console.warn("[steam] getPlayerName failed:", err.message);
    return null;
  }
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

function submitDayScore(value) {
  if (!client) return false;
  try {
    // steamworks.js exposes achievements + stats but NOT the ISteamUserStats
    // leaderboard API (verified against latest upstream, 2026-07). We record
    // the best day's total as an int stat as a stand-in. Real Steam
    // leaderboards are possible once the real App ID exists, but require
    // forking steamworks.js to expose leaderboards (its underlying Rust crate,
    // steamworks-rs, already supports them) or switching bindings.
    const clamped = Math.max(0, Math.min(Math.floor(Number(value) || 0), 2147483647));
    // Max-merge: a weaker day (or a clock/save trick) can never lower the
    // recorded best.
    const prev = client.stats.getInt(STAT_NAME) || 0;
    if (clamped <= prev) return true;
    client.stats.setInt(STAT_NAME, clamped);
    return client.stats.store();
  } catch (err) {
    console.warn("[steam] submitDayScore failed:", err.message);
    return false;
  }
}

// Trusted clock for the daily/weekly rollover (anti clock-manipulation).
// Unix seconds from Steam's servers, or null when Steam isn't running.
function getServerTime() {
  if (!client) return null;
  try {
    return client.utils.getServerRealTime();
  } catch (err) {
    console.warn("[steam] getServerTime failed:", err.message);
    return null;
  }
}

module.exports = { init, isAvailable, getPlayerName, unlockAchievement, submitDayScore, getServerTime };
