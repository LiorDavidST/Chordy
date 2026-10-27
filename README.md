# Chordy

Chordy is a personal chord-practice web app with a YouTube player, synchronized chord strip, piano diagrams, and local audio analysis.

Live website: https://chordy-9rfa.onrender.com/

## Automatic chord detection from a YouTube tab (Chrome desktop)

**No audio file upload is required.** This uses a user-initiated Chrome extension to analyze the sound playing in your own YouTube tab. The website's embedded YouTube player cannot expose its audio to JavaScript. This is **live detection**, not a precomputed transcription of the full song.

1. Download this GitHub repository as a ZIP, extract it, and open `chrome://extensions` in desktop Chrome.
2. Enable **Developer mode** and select **Load unpacked**. Select the extracted repository's **extension** directory (the folder containing `manifest.json`).
3. Open a song at `https://www.youtube.com/watch?v=...` and start playback. Click the **Chordy extension icon** while on the YouTube tab.
4. Allow the browser to capture the current tab when prompted. The extension opens Chordy in a new tab. Keep the YouTube tab playing.
5. The Chordy tab displays the current chord and gradually builds a timestamped chord map, synchronized to the YouTube tab's playback clock. The map is saved in that browser's local storage.
6. Click the extension icon on the YouTube tab again to stop capture. Refresh the extension in `chrome://extensions` after pulling updated source files.

**Limitations:** Chrome desktop extension required; not supported by mobile browsers or as a simple website-only flow. The first pass must play through in real time. Chords are estimates, not validated musical transcriptions. Capture may fail for protected or unavailable media. Use only content you are authorized to analyze and respect platform terms and applicable rights.

## Other modes

- Paste a YouTube URL into the website to play a video (does not enable automatic capture).
- Search iTunes previews; analyze available authorized preview audio.
- Analyze an audio file you own or are authorized to use, or import a chord timeline.
- Adjust timing offsets and transpose for practice.

## Development

```sh
npm install
npm run dev
npm run build
```

No Supabase or paid AI API is needed for the current version.
