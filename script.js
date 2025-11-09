// script.js - simplified & fixed

// Elements
const chatBody = document.querySelector('.chat-body');
const messageInput = document.querySelector('#message-input');
const sendMessageButton = document.querySelector('#send-message');
const fileInput = document.querySelector('#file-input');
const fileUploadButton = document.querySelector('#file-upload');
const chatForm = document.querySelector('#chat-form');
const chatbotPopup = document.querySelector('#chatbot-popup');
const closeButton = document.querySelector('#close-chatbot');

// ---------- SECURITY NOTE ----------
// Never embed real API keys in client-side JavaScript for production.
// Move API calls to a server or use a secure proxy for real apps.
const API_KEY = "AIzaSyCRqBTCBZYRHh2j4d3yjAcyrtHafSajKyQ";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// helper to create message element (content must be a string of HTML)
function createMessageElement(content, ...classes) {
  const div = document.createElement('div');
  div.classList.add('message', ...classes);
  div.innerHTML = content;
  return div;
}

// send request to API and update incomingMessageDiv when response arrives
async function generateBotResponse(incomingMessageDiv, userText) {
  const messageElement = incomingMessageDiv.querySelector('.message-text');
  try {
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: userText } // use the function param
            ]
          }
        ]
      })
    };

    const response = await fetch(`${API_URL}?key=${API_KEY}`, requestOptions);
    const data = await response.json();

    if (!response.ok) {
      // show error from API if available
      const msg = data?.error?.message || `Request failed with status ${response.status}`;
      throw new Error(msg);
    }

    // Simple, robust extraction of text from likely Gemini shapes
    let apiText = null;

    // common: data.candidates[0].content.parts[0].text
    apiText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? apiText;

    // alternate: data.candidates[0].content[0].parts[0].text
    apiText = apiText ?? data?.candidates?.[0]?.content?.[0]?.parts?.[0]?.text;

    // older/other shapes
    apiText = apiText ?? data?.output_text ?? data?.text ?? null;

    // fallback: small JSON preview
    if (!apiText) apiText = JSON.stringify(data).slice(0, 300);

    // simple markdown -> bold conversion for **bold**
    apiText = apiText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').trim();

    messageElement.innerHTML = apiText || 'No response from API';
  } catch (error) {
    console.error(error);
    messageElement.textContent = error.message || 'An error occurred';
    messageElement.style.color = '#ff0000';
  } finally {
    incomingMessageDiv.classList.remove('thinking');
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });
  }
}

// handle sending outgoing message
function handleOutgoingMessage(e) {
  if (e) e.preventDefault();

  const text = messageInput.value.trim();
  if (!text) return;

  // user message element
  const userHtml = '<div class="message-text"></div>';
  const outgoing = createMessageElement(userHtml, 'user-message');
  outgoing.querySelector('.message-text').textContent = text;
  chatBody.appendChild(outgoing);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });

  // clear input
  messageInput.value = '';

  // add bot thinking message
  const thinkingHtml =
    `<svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024">
       <path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z"></path>
     </svg>
     <div class="message-text">
       <div class="thinking-indicator">
         <div class="dot"></div>
         <div class="dot"></div>
         <div class="dot"></div>
       </div>
     </div>`;

  const incoming = createMessageElement(thinkingHtml, 'bot-message', 'thinking');
  chatBody.appendChild(incoming);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });

  // call API with the typed text
  generateBotResponse(incoming, text);
}

// form submit -> send message
chatForm.addEventListener('submit', (e) => {
  handleOutgoingMessage(e);
});

// allow Enter to send (prevent newline)
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    const trimmed = messageInput.value.trim();
    if (trimmed) handleOutgoingMessage();
  }
});

// file input handling (kept simple)
fileUploadButton.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  const file = fileInput.files && fileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const imgHtml = `<div class="message-text"><img src="${ev.target.result}" alt="attachment" style="max-width:200px; display:block; border-radius:8px;"></div>`;
    const outgoing = createMessageElement(imgHtml, 'user-message');
    chatBody.appendChild(outgoing);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });
  };
  reader.readAsDataURL(file);
});

// close/minimize button toggles visibility
closeButton.addEventListener('click', () => {
  chatbotPopup.classList.toggle('minimized');
});

// emoji button
emojiButton.addEventListener('click', () => {
  emojiPopup.classList.toggle('hidden');
});