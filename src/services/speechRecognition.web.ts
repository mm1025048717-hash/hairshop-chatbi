export type SpeechStartOptions = {
  onResult: (text: string) => void;
  onError?: (message: string) => void;
};

export function startSpeechRecognition(opts: SpeechStartOptions): { stop: () => void } {
  const w = window as any;
  const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    opts.onError?.('当前浏览器不支持语音识别（Web Speech API）。');
    return { stop: () => {} };
  }

  const recog = new SpeechRecognition();
  recog.lang = 'zh-CN';
  recog.interimResults = false;
  recog.maxAlternatives = 1;

  recog.onresult = (event: any) => {
    const text = event?.results?.[0]?.[0]?.transcript;
    if (typeof text === 'string' && text.trim()) opts.onResult(text.trim());
  };
  recog.onerror = (event: any) => {
    opts.onError?.(event?.error || '语音识别失败');
  };

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/9225323d-8200-4428-b04f-96488eb8c000',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/services/speechRecognition.web.ts:32',message:'speech start',data:{supported:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H_voice_web'})}).catch(()=>{});
  // #endregion

  recog.start();
  return {
    stop: () => {
      try { recog.stop(); } catch {}
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/9225323d-8200-4428-b04f-96488eb8c000',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/services/speechRecognition.web.ts:43',message:'speech stop',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H_voice_web'})}).catch(()=>{});
      // #endregion
    }
  };
}


