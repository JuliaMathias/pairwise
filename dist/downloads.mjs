/** Requests separate browser downloads in output order; browser policy owns completion and destination. */
import { downloadBlob } from './photos.mjs';

/** Returns the number requested, preserving filenames and bytes. Adapters keep timing and failures testable. */
export async function downloadAll(outputs, {
  download = downloadBlob,
  pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)),
  progress = () => {},
} = {}) {
  let requested = 0;
  for (const output of outputs) {
    download(output.blob, output.name);
    progress(++requested, outputs.length);
    // Avoid flooding the browser; this delay does not bypass multiple-download permission.
    if (requested < outputs.length) await pause(300);
  }
  return requested;
}
