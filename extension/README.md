# Chordy Chrome extension (experimental)

This extension uses Chrome's `tabCapture` API after a **user click** to analyze the audible YouTube tab, then sends chord estimates and playback position to the Chordy site. Chrome does not permit automatic tab capture just because a website opens a video.

## Install
1. Open `chrome://extensions` in Chrome, enable **Developer mode**.
2. Choose **Load unpacked** and select the `extension/` folder.
3. Open a YouTube watch page, play a video, then click the Chordy extension toolbar icon.
4. Chordy opens in a new tab. Chords will populate **as the song plays**, not instantaneously for the whole song.

No backend, paid APIs, YouTube downloads, or third-party data transfers. Audio remains in the browser. Requires Chrome with `tabCapture` and `offscreen` support. Playback should continue because the captured stream is connected to the AudioContext destination.

This is an experimental heuristic FFT/chroma detector. Accuracy and capture behavior vary by browser, music mix and content restrictions. The extension's permissions apply only to YouTube and the Chordy site. Do not treat generated chord labels as verified.

Third-party research: Chorduction (MIT) inspired the architecture, but no Chorduction source code is copied into this extension.
