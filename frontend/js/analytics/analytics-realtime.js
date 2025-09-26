// AnalyticsRealTime

import { pollSurveyUpdates } from '../api/api.js';

export class AnalyticsRealTime {
  /**
   * @param {string} surveyId
   * @param {(update: object) => void} onUpdate - invoked when backend reports updated === true
   * @param {object} [options]
   *   baseIntervalMs: number (default 15000)
   *   maxIntervalMs: number (default 120000)
   *   immediate: boolean (default true – perform immediate poll on start)
   *   debug: boolean (extra console logs)
   *   onStatusChange: function (optional callback for status changes)
   */
  constructor(surveyId, onUpdate, options = {}) {
    this.surveyId = surveyId;
    this.onUpdate = typeof onUpdate === 'function' ? onUpdate : () => {};

    this.baseInterval = options.baseIntervalMs || 15000; // 15s default
    this.maxInterval = options.maxIntervalMs || 120000;  // 120s cap
    this.currentInterval = this.baseInterval;
    this.immediate = options.immediate !== false; // default true
    this.debug = !!options.debug;

    // New optional status change callback
    this.onStatusChange = typeof options.onStatusChange === 'function' ? options.onStatusChange : null;
    this.lastStatus = null;

    // State
    this.timerId = null;
    this.isRunning = false;
    this.isPaused = false;        // manual / visibility pause flag
    this.inFlight = false;        // prevent overlapping polls
    this.consecutiveFailures = 0; // for backoff

    // Timestamps
    this.lastPollAt = null;
    this.lastSuccessAt = null;
    this.lastResponseAt = null;   // track server provided lastResponseAt to use as `since`

    // DOM status elements (lazy resolved)
    this.statusDotEl = null;
    this.statusTextEl = null;
    this.lastUpdateEl = null;

    // Bind handlers
    this._handleVisibilityChange = this._handleVisibilityChange.bind(this);
  }

  // ---- Public API ----
  start() {
    if (this.isRunning) return;
    if (!this.surveyId) {
      console.error('[AnalyticsRealTime] Missing surveyId – cannot start.');
      return;
    }
    this._resolveStatusEls();
    this.isRunning = true;
    this.isPaused = false;
    this._log('Starting real-time polling');
    document.addEventListener('visibilitychange', this._handleVisibilityChange);
    this._setStatus('active', 'Live updates active');
    if (this.immediate) {
      this._poll({ reason: 'start-immediate' });
    }
    this._scheduleNext();
  }

  stop() {
    if (!this.isRunning) return;
    this._log('Stopping real-time polling');
    this.isRunning = false;
    this.isPaused = false;
    if (this.timerId) clearTimeout(this.timerId);
    this.timerId = null;
    document.removeEventListener('visibilitychange', this._handleVisibilityChange);
    this._setStatus('stopped', 'Updates stopped');
  }

  pause(reason = 'Paused') {
    if (!this.isRunning || this.isPaused) return;
    this._log('Pausing polling');
    this.isPaused = true;
    if (this.timerId) clearTimeout(this.timerId);
    this.timerId = null;
    this._setStatus('paused', `${reason}`);
  }

  resume(immediate = true) {
    if (!this.isRunning || !this.isPaused) return;
    this._log('Resuming polling');
    this.isPaused = false;
    this._setStatus('active', 'Live updates active');
    if (immediate) this._poll({ reason: 'resume' });
    this._scheduleNext();
  }

  forcePoll() {
    if (!this.isRunning) return;
    this._log('Force poll invoked');
    this._poll({ force: true, reason: 'force' });
  }

  getState() {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      currentInterval: this.currentInterval,
      consecutiveFailures: this.consecutiveFailures,
      lastPollAt: this.lastPollAt,
      lastSuccessAt: this.lastSuccessAt,
      lastResponseAt: this.lastResponseAt
    };
  }

  // ---- Internal helpers ----
  _scheduleNext() {
    if (!this.isRunning || this.isPaused) return;
    if (this.timerId) clearTimeout(this.timerId);
    this.timerId = setTimeout(() => this._poll({ reason: 'interval' }), this.currentInterval);
    this._log(`Next poll scheduled in ${this.currentInterval / 1000}s`);
  }

  async _poll(meta = {}) {
    if (!this.isRunning || this.isPaused) return;
    if (this.inFlight) {
      this._log('Poll skipped – in flight');
      return;
    }
    this.inFlight = true;
    this.lastPollAt = new Date();
    this._updateLastUpdateLabel(); // show that a check occurred (optimistic)

    const since = this.lastResponseAt || null;
    this._log(`Polling (since=${since || 'none'}) reason=${meta.reason || 'n/a'}`);

    try {
      const result = await pollSurveyUpdates(this.surveyId, since);

      if (result.success) {
        // Reset backoff on any successful round trip
        this.consecutiveFailures = 0;
        this.currentInterval = this.baseInterval;
        this.lastSuccessAt = new Date();
        if (result.lastResponseAt) {
          this.lastResponseAt = result.lastResponseAt;
        }
        this._setStatus('active');
        this._updateLastUpdateLabel(result.updated);

        if (result.updated) {
          this._log(`Update detected (newCount=${result.newCount})`);
          // Provide payload + meta to callback
          try {
            this.onUpdate({
              ...result,
              meta: { triggeredAt: this.lastPollAt, reason: meta.reason || null }
            });
          } catch (cbErr) {
            console.error('[AnalyticsRealTime] onUpdate callback error:', cbErr);
          }
        } else {
          this._log('No changes');
        }
      } else {
        this._handleFailure(result.error || 'Unknown failure');
      }
    } catch (err) {
      this._handleFailure(err?.message || 'Network error');
    } finally {
      this.inFlight = false;
      // Schedule next only if still running
      this._scheduleNext();
    }
  }

  _handleFailure(errorMsg) {
    this.consecutiveFailures += 1;
    this._log(`Poll failed (#${this.consecutiveFailures}): ${errorMsg}`);

    // Exponential backoff: double interval until max
    const next = Math.min(this.currentInterval * 2, this.maxInterval);
    this.currentInterval = next;

    // Update visual status
    this._setStatus('error', this.consecutiveFailures > 1 ? 'Reconnecting…' : 'Temporary issue');
    this._updateLastUpdateLabel(false, true);
    // Fire status change manually so listeners can act on failure thresholds
    if (this.onStatusChange) {
      this.onStatusChange({ state: 'error', message: 'failure', meta: this.getState() });
    }
  }

  _handleVisibilityChange() {
    if (document.hidden) {
      this._log('Document hidden – auto pause');
      this.pause('Paused (tab hidden)');
    } else {
      this._log('Document visible – immediate poll');
      this.resume(true); // immediate poll on focus
    }
  }

  _setStatus(state, messageOverride) {
    // state: 'active' | 'paused' | 'error' | 'stopped'
    const dot = this.statusDotEl;
    const text = this.statusTextEl;
    if (!dot || !text) {
      // still fire callback even if UI elements missing
      if (this.onStatusChange && state !== this.lastStatus) {
        this.onStatusChange({ state, message: messageOverride || null, meta: this.getState() });
        this.lastStatus = state;
      }
      return;
    }

    dot.className = 'status-dot';
    switch (state) {
      case 'active':
        dot.classList.add('online');
        text.textContent = messageOverride || 'Live';
        break;
      case 'paused':
        dot.classList.add('paused');
        text.textContent = messageOverride || 'Paused';
        break;
      case 'error':
        dot.classList.add('error');
        text.textContent = messageOverride || 'Reconnecting…';
        break;
      case 'stopped':
      default:
        dot.classList.add('stopped');
        text.textContent = messageOverride || 'Stopped';
    }

    // Accessibility live region announcement
    const announcer = document.getElementById('statusAnnouncer');
    if (announcer) {
      announcer.textContent = `Realtime status: ${text.textContent}`;
    }

    if (this.onStatusChange && state !== this.lastStatus) {
      this.onStatusChange({ state, message: text.textContent, meta: this.getState() });
      this.lastStatus = state;
    }
  }

  _updateLastUpdateLabel(hadChanges = false, isError = false) {
    if (!this.lastUpdateEl) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (isError) {
      this.lastUpdateEl.textContent = `Last check: ${timeStr} (error)`;
      return;
    }

    if (hadChanges) {
      this.lastUpdateEl.textContent = `Last update: ${timeStr}`;
    } else {
      this.lastUpdateEl.textContent = `Last check: ${timeStr}`;
    }
  }

  _resolveStatusEls() {
    this.statusDotEl = document.getElementById('statusDot');
    this.statusTextEl = document.getElementById('statusText');
    this.lastUpdateEl = document.getElementById('lastUpdate');
  }

  _log(msg) {
    if (this.debug) {
      console.log(`[AnalyticsRealTime] ${msg}`);
    }
  }
}

export default AnalyticsRealTime;
