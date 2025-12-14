export type SpeechStartOptions = {
  onResult: (text: string) => void;
  onError?: (message: string) => void;
};

export function startSpeechRecognition(opts: SpeechStartOptions): { stop: () => void } {
  // 说明：原生端要做语音转文字，通常需要原生模块（如 iOS Speech / Android Speech）。
  // Expo Managed 里可通过自定义 Dev Client + 原生插件来实现，这里先做优雅降级。
  opts.onError?.('移动端语音转文字暂未启用（需要原生语音识别能力）。');
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/9225323d-8200-4428-b04f-96488eb8c000',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/services/speechRecognition.native.ts:11',message:'speech not supported on native',data:{supported:false},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H_voice_native'})}).catch(()=>{});
  // #endregion
  return { stop: () => {} };
}


