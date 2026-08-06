// Global Audio Manager for Priority-Based Audio Synchronization
type AudioPriority = 'BACKGROUND' | 'FOREGROUND';

export interface AudioSubscriber {
  id: string;
  priority: AudioPriority;
  onPauseByManager?: () => void;
  onResumeByManager?: () => void;
}

class AudioManager {
  private activeSourceId: string | null = null;
  private activePriority: AudioPriority | null = null;
  private wasBackgroundMusicPlaying: boolean = false;

  private subscribers: Map<string, AudioSubscriber> = new Map();

  /**
   * Register an audio subscriber component (e.g., MusicPlayer or ArticleSpeech)
   */
  register(subscriber: AudioSubscriber) {
    this.subscribers.set(subscriber.id, subscriber);
  }

  /**
   * Unregister an audio subscriber
   */
  unregister(id: string) {
    if (this.activeSourceId === id) {
      this.notifyStopped(id);
    }
    this.subscribers.delete(id);
  }

  /**
   * Request permission/notify intent to play audio.
   * Pauses lower-priority or conflicting audio automatically.
   */
  requestPlay(id: string, priority: AudioPriority) {
    if (priority === 'FOREGROUND') {
      // If background music is playing, pause it and record pre-empted state
      if (this.activePriority === 'BACKGROUND' && this.activeSourceId) {
        const bgSub = this.subscribers.get(this.activeSourceId);
        if (bgSub && bgSub.onPauseByManager) {
          this.wasBackgroundMusicPlaying = true;
          bgSub.onPauseByManager();
        }
      } else if (this.activePriority === 'FOREGROUND' && this.activeSourceId && this.activeSourceId !== id) {
        // If another foreground audio is playing, pause it first
        const currentFg = this.subscribers.get(this.activeSourceId);
        if (currentFg && currentFg.onPauseByManager) {
          currentFg.onPauseByManager();
        }
      }

      this.activeSourceId = id;
      this.activePriority = 'FOREGROUND';
    } else if (priority === 'BACKGROUND') {
      // If user explicitly triggers background music while foreground audio is playing,
      // pause foreground audio and reset pre-empted flag
      if (this.activePriority === 'FOREGROUND' && this.activeSourceId) {
        const currentFg = this.subscribers.get(this.activeSourceId);
        if (currentFg && currentFg.onPauseByManager) {
          currentFg.onPauseByManager();
        }
        this.wasBackgroundMusicPlaying = false;
      }

      this.activeSourceId = id;
      this.activePriority = 'BACKGROUND';
      this.wasBackgroundMusicPlaying = false;
    }
  }

  /**
   * Called when audio finishes naturally or is closed/unmounted
   */
  notifyStopped(id: string) {
    if (this.activeSourceId === id) {
      const prevPriority = this.activePriority;
      this.activeSourceId = null;
      this.activePriority = null;

      // If a foreground audio stopped and background music was pre-empted, resume background music
      if (prevPriority === 'FOREGROUND' && this.wasBackgroundMusicPlaying) {
        this.wasBackgroundMusicPlaying = false;

        for (const sub of this.subscribers.values()) {
          if (sub.priority === 'BACKGROUND') {
            if (sub.onResumeByManager) {
              sub.onResumeByManager();
              this.activeSourceId = sub.id;
              this.activePriority = 'BACKGROUND';
            }
            break;
          }
        }
      }
    }
  }

  /**
   * Called when audio is manually paused by the user
   */
  notifyPaused(id: string) {
    if (this.activeSourceId === id) {
      const prevPriority = this.activePriority;
      this.activeSourceId = null;
      this.activePriority = null;

      // If foreground sound was manually paused by user and background music was pre-empted, resume background music
      if (prevPriority === 'FOREGROUND' && this.wasBackgroundMusicPlaying) {
        this.wasBackgroundMusicPlaying = false;

        for (const sub of this.subscribers.values()) {
          if (sub.priority === 'BACKGROUND') {
            if (sub.onResumeByManager) {
              sub.onResumeByManager();
              this.activeSourceId = sub.id;
              this.activePriority = 'BACKGROUND';
            }
            break;
          }
        }
      } else if (prevPriority === 'BACKGROUND') {
        this.wasBackgroundMusicPlaying = false;
      }
    }
  }

  /**
   * Check if background music is currently pre-empted by foreground audio
   */
  isBackgroundPreempted(): boolean {
    return this.wasBackgroundMusicPlaying;
  }
}

export const audioManager = new AudioManager();

// Attach global DOM listener for any HTML5 <audio> or <video> media elements across the site
if (typeof window !== 'undefined') {
  window.addEventListener('play', (e) => {
    const target = e.target as HTMLMediaElement;
    if (target && (target.tagName === 'AUDIO' || target.tagName === 'VIDEO') && target.id !== 'bg-music-audio-element') {
      const mediaId = `media-${target.src || Math.random()}`;
      
      // Register temporary subscriber for this media element
      audioManager.register({
        id: mediaId,
        priority: 'FOREGROUND',
        onPauseByManager: () => {
          if (!target.paused) {
            target.pause();
          }
        }
      });

      audioManager.requestPlay(mediaId, 'FOREGROUND');

      const cleanup = () => {
        audioManager.notifyStopped(mediaId);
        audioManager.unregister(mediaId);
        target.removeEventListener('pause', cleanup);
        target.removeEventListener('ended', cleanup);
      };

      target.addEventListener('pause', cleanup, { once: true });
      target.addEventListener('ended', cleanup, { once: true });
    }
  }, true);
}
