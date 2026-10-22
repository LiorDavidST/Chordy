const ORIGIN=location.origin;
chrome.runtime.onMessage.addListener(msg=>{if(msg.type==='CHORDY_DATA'&&msg.payload&&typeof msg.payload==='object')window.postMessage({source:'chordy-extension',payload:msg.payload},ORIGIN)});
window.postMessage({source:'chordy-extension',payload:{type:'connected'}},ORIGIN);
