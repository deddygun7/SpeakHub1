import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "../utils/cn";

const DEFAULT_SRC =
  "https://videos.pexels.com/video-files/4584883/4584883-uhd_3840_2160_25fps.mp4";

const SPEEDS = [0.5, 1, 1.5, 2];

function fmt(t: number) {
  if (!isFinite(t) || isNaN(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [loop, setLoop] = useState(true);
  const [showSpeed, setShowSpeed] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [fileName, setFileName] = useState("default_clip.mp4");
  const hideTimer = useRef<number | null>(null);
  const [src, setSrc] = useState<string>(DEFAULT_SRC);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  }, []);

  // reveal controls briefly
  const flashControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setControlsVisible(false);
    }, 2600);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onTime = () => {
      setCurrent(v.currentTime);
      if (v.buffered.length) {
        try {
          setBuffered(v.buffered.end(v.buffered.length - 1));
        } catch {
          /* noop */
        }
      }
    };
    const onLoaded = () => setDuration(v.duration);
    const onPlay = () => {
      setPlaying(true);
      flashControls();
    };
    const onPause = () => {
      setPlaying(false);
      setControlsVisible(true);
    };
    const onWaiting = () => setLoading(true);
    const onPlaying = () => setLoading(false);
    const onCanPlay = () => setLoading(false);
    const onEnd = () => setControlsVisible(true);
    const onVol = () => {
      setVolume(v.volume);
      setMuted(v.muted);
    };

    v.addEventListener("timeupdate", onTime);
    v.addEventListener("progress", onTime);
    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("durationchange", onLoaded);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("ended", onEnd);
    v.addEventListener("volumechange", onVol);

    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("progress", onTime);
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("durationchange", onLoaded);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("ended", onEnd);
      v.removeEventListener("volumechange", onVol);
    };
  }, [flashControls, src]);

  // fullscreen sync
  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const seek = (t: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = t;
    setCurrent(t);
  };

  const changeVol = (val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    v.muted = val === 0;
  };

  const toggleFs = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  const changeSpeed = (s: number) => {
    const v = videoRef.current;
    if (v) v.playbackRate = s;
    setSpeed(s);
    setShowSpeed(false);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSrc(url);
    setFileName(file.name);
    setLoading(true);
    setPlaying(false);
    setCurrent(0);
  };

  const pct = duration ? (current / duration) * 100 : 0;
  const bufPct = duration ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={wrapRef}
      onMouseMove={flashControls}
      onMouseLeave={() => playing && setControlsVisible(false)}
      className="group relative aspect-video w-full overflow-hidden rounded-2xl border-2 border-ember-600/60 bg-black shadow-[0_0_60px_-12px_rgba(249,115,22,0.7)] ring-1 ring-ember-500/20"
    >
      <video
        ref={videoRef}
        src={src}
        loop={loop}
        autoPlay
        muted={muted}
        playsInline
        onClick={togglePlay}
        onDoubleClick={toggleFs}
        className="h-full w-full bg-black object-cover"
      />

      {/* loading spinner */}
      {loading && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/30">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-ember-500/30 border-t-ember-500" />
        </div>
      )}

      {/* center play button when paused */}
      {!playing && !loading && (
        <button
          onClick={togglePlay}
          aria-label="Play"
          className="animate-pop absolute inset-0 grid place-items-center"
        >
          <span className="grid h-20 w-20 place-items-center rounded-full bg-ember-500/90 text-white shadow-[0_0_40px_rgba(249,115,22,0.9)] backdrop-blur transition hover:scale-110 hover:bg-ember-400">
            <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-9 w-9">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}

      {/* top badge bar */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 flex items-center justify-between gap-2 bg-gradient-to-b from-black/80 to-transparent p-3 transition-opacity duration-300",
          controlsVisible || !playing ? "opacity-100" : "opacity-0"
        )}
      >
        <span className="flex items-center gap-2 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
          <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> Live • LFU TV
        </span>
        <span className="max-w-[55%] truncate rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-ember-200 backdrop-blur">
          ▶ {fileName}
        </span>
      </div>

      {/* controls */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent px-3 pb-3 pt-10 transition-opacity duration-300 sm:px-4",
          controlsVisible || !playing ? "opacity-100" : "opacity-0"
        )}
      >
        {/* scrubber */}
        <div className="group/bar relative mb-3 flex items-center">
          <div className="absolute h-1.5 w-full rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-white/25"
              style={{ width: `${bufPct}%` }}
            />
            <div
              className="absolute top-0 h-full rounded-full bg-gradient-to-r from-ember-500 to-orange-400"
              style={{ width: `${pct}%`, boxShadow: "0 0 10px rgba(249,115,22,0.9)" }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.01}
            value={current}
            onChange={(e) => seek(Number(e.target.value))}
            className="range-ember relative z-10 w-full opacity-0 group-hover/bar:opacity-0"
            aria-label="Seek"
            style={{ background: "transparent" }}
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={togglePlay}
            className="text-white transition hover:scale-110 hover:text-ember-400"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* skip back 10s */}
          <button
            onClick={() => seek(Math.max(0, current - 10))}
            className="hidden text-white/80 transition hover:scale-110 hover:text-ember-400 sm:block"
            aria-label="Back 10s"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M12 5V1L7 6l5 5V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z" />
            </svg>
          </button>

          {/* volume */}
          <div className="group/vol flex items-center gap-2">
            <button
              onClick={() => {
                const v = videoRef.current;
                if (v) v.muted = !v.muted;
              }}
              className="text-white/90 transition hover:scale-110 hover:text-ember-400"
              aria-label="Mute"
            >
              {muted || volume === 0 ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45A4.6 4.6 0 0 0 16.5 12zM3 27h2l9-9v6a1 1 0 0 0 1.6.8L22 19l5 5 1.4-1.4L3.4 0 2 1.4l5 5L4 9.2A1 1 0 0 0 4 11h2.6l6.4 6.4V12l4 4-6 4.8z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M3 10v4h4l5 5V5L7 10H3zm13.5 2A4.5 4.5 0 0 0 14 7.97v8.05A4.5 4.5 0 0 0 16.5 12zM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06a9 9 0 0 0 0-17.54z" />
                </svg>
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => changeVol(Number(e.target.value))}
              className="range-ember w-0 opacity-0 transition-all duration-300 group-hover/vol:w-20 group-hover/vol:opacity-100"
              aria-label="Volume"
            />
          </div>

          <span className="ml-1 font-mono text-xs tabular-nums text-white/80">
            {fmt(current)} <span className="text-white/40">/ {fmt(duration)}</span>
          </span>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            {/* speed */}
            <div className="relative">
              <button
                onClick={() => setShowSpeed((s) => !s)}
                className="rounded-md px-2 py-1 text-xs font-bold text-white/90 transition hover:bg-white/10 hover:text-ember-400"
              >
                {speed}×
              </button>
              {showSpeed && (
                <div className="absolute bottom-9 right-0 flex flex-col overflow-hidden rounded-xl border border-ember-600/40 bg-black/95 shadow-xl backdrop-blur">
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      onClick={() => changeSpeed(s)}
                      className={cn(
                        "px-5 py-1.5 text-left text-xs font-semibold transition hover:bg-ember-600/30",
                        s === speed ? "text-ember-400" : "text-white/80"
                      )}
                    >
                      {s}×
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* loop */}
            <button
              onClick={() => setLoop((l) => !l)}
              className={cn(
                "rounded-md p-1 transition hover:bg-white/10",
                loop ? "text-ember-400" : "text-white/60"
              )}
              aria-label="Loop"
              title="Loop"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                <path d="M17 1l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 23l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* upload */}
            <button
              onClick={() => fileRef.current?.click()}
              className="rounded-md p-1 text-white/70 transition hover:bg-white/10 hover:text-ember-400"
              aria-label="Upload your own video"
              title="Свое відео"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M17 8l-5-5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              onChange={onFile}
              className="hidden"
            />

            {/* fullscreen */}
            <button
              onClick={toggleFs}
              className="rounded-md p-1 text-white/80 transition hover:bg-white/10 hover:text-ember-400"
              aria-label="Fullscreen"
            >
              {fullscreen ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                  <path d="M8 3v4H4M16 3v4h4M8 21v-4H4M16 21v-4h4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                  <path d="M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
