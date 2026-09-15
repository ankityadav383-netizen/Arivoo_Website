// Arivoo AI chat widget — shared across every page. Appends itself
// directly to <body>, outside the <x-dc> root that support.js's React
// render replaces, so it's unaffected by that render/re-render cycle.
// Talks to a small backend proxy (see the arivoo-chatbot-worker project)
// that holds the Anthropic API key server-side.
function mountArivooChatWidget() {
  var CHAT_API_URL = 'https://arivoo-chatbot.arivoo-ankit.workers.dev/chat';

  var style = document.createElement('style');
  style.textContent =
    // Collapsed = just the pill-shaped ask bar. Opening it does not pop up a
    // separate overlay — this same element grows in place into the full
    // chat panel, anchored to the same bottom-center spot.
    '.arv-chat-widget{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);display:flex;flex-direction:column;width:420px;max-width:calc(100vw - 32px);height:60px;background:linear-gradient(135deg,#2f8fe0,#126FB8 48%,#6C4CD8);background-size:160% 160%;border-radius:999px;box-shadow:0 10px 30px rgba(31,52,110,.4);overflow:hidden;z-index:99998;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;transition:width .32s cubic-bezier(.2,.9,.25,1.1),height .32s cubic-bezier(.2,.9,.25,1.1),border-radius .32s ease,background-color .32s ease,background-position .5s ease,box-shadow .32s ease}' +
    '.arv-chat-widget.arv-open{width:600px;height:680px;max-height:calc(100vh - 56px);border-radius:26px;background:#fdfcfa;box-shadow:0 40px 100px rgba(10,12,20,.45)}' +
    '.arv-chat-top{flex:1;min-height:0;max-height:0;display:flex;flex-direction:column;opacity:0;overflow:hidden;pointer-events:none;transition:opacity .15s ease,max-height .32s ease}' +
    '.arv-chat-widget.arv-open .arv-chat-top{max-height:2000px;opacity:1;pointer-events:auto;transition:opacity .25s ease .14s,max-height .32s ease}' +
    '.arv-chat-head{background:linear-gradient(120deg,#14151a,#1c2340 65%,#2b2160);color:#fff;padding:22px 22px 20px;display:flex;align-items:flex-start;gap:14px;flex:none}' +
    '.arv-chat-head .arv-orb-lg{width:38px;height:38px;border-radius:50%;flex:none;margin-top:1px;background:radial-gradient(circle at 32% 28%,#fff,#bfe0ff 28%,#126FB8 62%,#6C4CD8 100%);box-shadow:0 0 0 5px rgba(255,255,255,.08)}' +
    '.arv-chat-head-text{flex:1;min-width:0}' +
    '.arv-chat-head strong{display:block;font-size:16.5px;letter-spacing:-.01em}' +
    '.arv-chat-head span{display:block;font-size:12.5px;color:#aab0c8;margin-top:3px}' +
    '.arv-chat-close{background:rgba(255,255,255,.08);border:none;color:#fff;cursor:pointer;font-size:18px;line-height:1;width:30px;height:30px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;transition:background .15s ease}' +
    '.arv-chat-close:hover{background:rgba(255,255,255,.18)}' +
    '.arv-chat-body{flex:1;overflow-y:auto;padding:22px 24px;display:flex;flex-direction:column;gap:18px}' +
    '.arv-msg-row{display:flex;gap:11px;max-width:92%}' +
    '.arv-msg-row.arv-user{align-self:flex-end;flex-direction:row-reverse;max-width:80%}' +
    '.arv-avatar{width:26px;height:26px;border-radius:50%;flex:none;margin-top:2px;background:radial-gradient(circle at 32% 28%,#fff,#bfe0ff 28%,#126FB8 62%,#6C4CD8 100%)}' +
    '.arv-msg-text{font-size:14.5px;line-height:1.55;white-space:pre-wrap;word-wrap:break-word;padding-top:2px}' +
    '.arv-msg-row.arv-user .arv-msg-text{background:linear-gradient(135deg,#126FB8,#6C4CD8);color:#fff;padding:10px 15px;border-radius:16px 16px 4px 16px}' +
    '.arv-msg-row.arv-bot .arv-msg-text{color:#20222b}' +
    '.arv-typing-row{display:flex;gap:11px;align-items:center}' +
    '.arv-typing{display:flex;gap:4px;padding:8px 0}' +
    '.arv-typing span{width:6px;height:6px;border-radius:50%;background:#b9bdd6;animation:arv-bounce 1.2s infinite ease-in-out}' +
    '.arv-typing span:nth-child(2){animation-delay:.15s}' +
    '.arv-typing span:nth-child(3){animation-delay:.3s}' +
    '@keyframes arv-bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}' +
    // Foot holds the ask bar in BOTH states — it never gets swapped out,
    // it just gets roomier padding and a visible hint once expanded.
    '.arv-chat-foot{flex:none;padding:7px;transition:padding .3s ease}' +
    '.arv-chat-widget.arv-open .arv-chat-foot{padding:10px 16px 14px}' +
    '.arv-ask-bar{display:flex;align-items:center;gap:8px;width:100%}' +
    '.arv-ask-input-wrap{flex:1;min-width:0;background:#fff;border-radius:999px;padding:0 20px;box-shadow:0 2px 8px rgba(20,20,30,.05)}' +
    '.arv-ask-input{width:100%;border:none;outline:none;background:transparent;font:15px/1.3 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#14151a;padding:13px 0}' +
    '.arv-ask-input::placeholder{color:#a9adb6}' +
    '.arv-ask-send{flex:none;width:44px;height:44px;border-radius:50%;border:none;background:linear-gradient(135deg,#2f8fe0,#126FB8 55%,#6C4CD8);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:filter .15s ease,transform .1s ease}' +
    '.arv-ask-send:hover{filter:brightness(1.08)}' +
    '.arv-ask-send:active{transform:scale(.94)}' +
    '.arv-chat-widget:not(.arv-open):hover{background-position:60% 40%}' +
    '.arv-ask-send:disabled{opacity:.5;cursor:default}' +
    '.arv-chat-hint{text-align:center;font-size:11px;color:#a8a49a;max-height:0;opacity:0;overflow:hidden;transition:opacity .2s ease,max-height .2s ease,margin-top .2s ease}' +
    '.arv-chat-widget.arv-open .arv-chat-hint{margin-top:10px;max-height:20px;opacity:1;transition:opacity .25s ease .16s,max-height .25s ease .16s,margin-top .25s ease .16s}' +
    '@media (max-width:480px){.arv-chat-widget{width:calc(100vw - 32px)}.arv-chat-widget.arv-open{width:calc(100vw - 32px);height:calc(100vh - 56px);border-radius:20px}}' +
    // The Home page's own scroll-triggered "fly to CTA" button lands at the
    // same bottom-center spot as this widget on pages that have it, so the
    // two would fight for the same pixels. The ask bar already surfaces
    // "Book a demo call" itself, so hide the legacy floating button.
    '[data-fly-cta]{display:none!important}';
  document.head.appendChild(style);

  var widget = document.createElement('div');
  widget.className = 'arv-chat-widget';
  widget.setAttribute('role', 'dialog');
  widget.setAttribute('aria-label', 'Arivoo AI assistant');
  widget.innerHTML =
    '<div class="arv-chat-top">' +
      '<div class="arv-chat-head">' +
        '<span class="arv-orb-lg"></span>' +
        '<div class="arv-chat-head-text"><strong>Arivoo AI</strong><span>Ask about UMS, SMS, LMS, TestGUARD or booking a demo</span></div>' +
        '<button class="arv-chat-close" aria-label="Collapse chat">&times;</button>' +
      '</div>' +
      '<div class="arv-chat-body"></div>' +
    '</div>' +
    '<div class="arv-chat-foot">' +
      '<div class="arv-ask-bar">' +
        '<div class="arv-ask-input-wrap"><input class="arv-ask-input" type="text" placeholder="Ask me anything" aria-label="Ask Arivoo AI" autocomplete="off"></div>' +
        '<button class="arv-ask-send" aria-label="Send"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="M6 11l6-6 6 6"/></svg></button>' +
      '</div>' +
      '<div class="arv-chat-hint">AI-generated — verify anything critical with our team.</div>' +
    '</div>';

  document.body.appendChild(widget);

  var body = widget.querySelector('.arv-chat-body');
  var askInput = widget.querySelector('.arv-ask-input');
  var askSend = widget.querySelector('.arv-ask-send');
  var closeBtn = widget.querySelector('.arv-chat-close');

  var history = [];
  var greeted = false;

  // Quirky rotating placeholder — typewriters through a few prompts instead
  // of sitting on one static "Ask me anything". Paused while the panel is
  // expanded so it doesn't distract mid-conversation.
  var placeholders = [
    'Ask me anything…',
    'Book a demo call →',
    'What is TestGUARD?',
    'Curious about pricing?',
    'Show me the LMS',
    'Talk to a real human'
  ];
  var phIndex = 0, phChar = 0, phDeleting = false, phTimer = null, phPaused = false;

  function tickPlaceholder() {
    if (phPaused) return;
    var current = placeholders[phIndex];
    var delay = 55;
    if (!phDeleting) {
      phChar++;
      askInput.placeholder = current.slice(0, phChar);
      if (phChar === current.length) {
        phDeleting = true;
        delay = 1400;
      }
    } else {
      phChar--;
      askInput.placeholder = current.slice(0, phChar);
      if (phChar === 0) {
        phDeleting = false;
        phIndex = (phIndex + 1) % placeholders.length;
        delay = 300;
      } else {
        delay = 30;
      }
    }
    phTimer = setTimeout(tickPlaceholder, delay);
  }

  function pausePlaceholder() {
    phPaused = true;
    clearTimeout(phTimer);
  }

  function resumePlaceholder() {
    if (!phPaused) return;
    phPaused = false;
    tickPlaceholder();
  }

  tickPlaceholder();

  function addMessage(role, text) {
    var row = document.createElement('div');
    row.className = 'arv-msg-row ' + (role === 'user' ? 'arv-user' : 'arv-bot');
    var textEl = document.createElement('div');
    textEl.className = 'arv-msg-text';
    textEl.textContent = text;
    if (role !== 'user') {
      var avatar = document.createElement('span');
      avatar.className = 'arv-avatar';
      row.appendChild(avatar);
    }
    row.appendChild(textEl);
    body.appendChild(row);
    body.scrollTop = body.scrollHeight;
    return row;
  }

  function showTyping() {
    var row = document.createElement('div');
    row.className = 'arv-typing-row';
    row.innerHTML = '<span class="arv-avatar"></span><span class="arv-typing"><span></span><span></span><span></span></span>';
    body.appendChild(row);
    body.scrollTop = body.scrollHeight;
    return row;
  }

  function expand() {
    pausePlaceholder();
    if (widget.classList.contains('arv-open')) return;
    widget.classList.add('arv-open');
    if (!greeted) {
      greeted = true;
      addMessage('assistant', "Hi! I'm Arivoo AI. Ask me about our UMS, SMS, LMS or TestGUARD modules, or how to book a demo.");
    }
  }

  function collapse() {
    widget.classList.remove('arv-open');
    askInput.blur();
    resumePlaceholder();
  }

  askInput.addEventListener('focus', expand);
  askSend.addEventListener('click', function () { expand(); send(); });
  askInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); expand(); send(); }
  });
  closeBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    collapse();
  });
  document.addEventListener('click', function (e) {
    if (widget.classList.contains('arv-open') && !widget.contains(e.target)) collapse();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && widget.classList.contains('arv-open')) collapse();
  });

  async function send() {
    var text = askInput.value.trim();
    if (!text) return;
    askInput.value = '';
    askSend.disabled = true;
    addMessage('user', text);
    history.push({ role: 'user', content: text });

    var typingEl = showTyping();
    try {
      var res = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-12) })
      });
      var data = await res.json();
      typingEl.remove();
      if (!res.ok || !data.reply) throw new Error(data.error || 'Request failed');
      addMessage('assistant', data.reply);
      history.push({ role: 'assistant', content: data.reply });
    } catch (err) {
      typingEl.remove();
      addMessage('assistant', "Sorry, I couldn't reach the assistant right now. Please try again in a moment.");
      console.error('[arivoo-chat]', err);
    } finally {
      askSend.disabled = false;
    }
  }
}

mountArivooChatWidget();
