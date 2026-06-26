// State Variables
let conversations = [];
let activeChatId = null;
let currentModel = 'groq'; // groq
let opMode = 'simulation'; // simulation, api
let themeMode = 'device'; // device, dark, light
let apiKeys = {
  gemini: '',
  openai: '',
  openrouter: '',
  groq: ''
};

// DOM Elements
const body = document.body;
const modelSelect = document.getElementById('modelSelect');
const statusBadge = document.getElementById('statusBadge');
const statusText = document.getElementById('statusText');
const activeModelInfo = document.getElementById('activeModelInfo');
const chatHistoryList = document.getElementById('chatHistoryList');
const conversationFeed = document.getElementById('conversationFeed');
const welcomeScreen = document.getElementById('welcomeScreen');
const messagesViewport = document.getElementById('messagesViewport');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const charCounter = document.getElementById('charCounter');
const newChatBtn = document.getElementById('newChatBtn');

// Sidebar toggle mobile elements
const menuToggleBtn = document.getElementById('menuToggleBtn');
const sidebar = document.getElementById('sidebar');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');

// Settings modal elements
const settingsModal = document.getElementById('settingsModal');
const openSettingsBtn = document.getElementById('openSettingsBtn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const modeSimRadio = document.getElementById('modeSimRadio');
const modeApiRadio = document.getElementById('modeApiRadio');
const keysSection = document.getElementById('keysSection');
const geminiKeyInput = document.getElementById('geminiKey');
const openaiKeyInput = document.getElementById('openaiKey');
const openrouterKeyInput = document.getElementById('openrouterKey');
const groqKeyInput = document.getElementById('groqKey');
const themeToggleContainer = document.getElementById('themeToggleContainer');
const themeSliderTrack = document.getElementById('themeSliderTrack');
const themeButtons = document.querySelectorAll('.theme-btn');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadConversations();
  setupEventListeners();
  applyThemeMode(themeMode);
  updateUIForCurrentMode();
  updateUIForCurrentModel();
  
  if (conversations.length > 0) {
    switchChat(conversations[0].id);
  } else {
    createNewChat();
  }
});

// Setup All Event Listeners
function setupEventListeners() {
  // Model Select Change
  modelSelect.addEventListener('change', (e) => {
    currentModel = e.target.value;
    updateUIForCurrentModel();
  });
  
  // Settings modal visibility
  openSettingsBtn.addEventListener('click', () => {
    // Populate keys in modal inputs
    geminiKeyInput.value = apiKeys.gemini || '';
    openaiKeyInput.value = apiKeys.openai || '';
    openrouterKeyInput.value = apiKeys.openrouter || '';
    groqKeyInput.value = apiKeys.groq || '';
    
    if (opMode === 'simulation') {
      modeSimRadio.checked = true;
      keysSection.classList.add('disabled');
    } else {
      modeApiRadio.checked = true;
      keysSection.classList.remove('disabled');
    }
    
    settingsModal.classList.add('show');
  });
  
  const closeModal = () => settingsModal.classList.remove('show');
  closeSettingsBtn.addEventListener('click', closeModal);
  cancelSettingsBtn.addEventListener('click', closeModal);
  
  // Toggle operational mode radios
  modeSimRadio.addEventListener('change', () => keysSection.classList.add('disabled'));
  modeApiRadio.addEventListener('change', () => keysSection.classList.remove('disabled'));
  
  // Save Settings
  saveSettingsBtn.addEventListener('click', () => {
    opMode = modeSimRadio.checked ? 'simulation' : 'api';
    apiKeys.gemini = geminiKeyInput.value.trim();
    apiKeys.openai = openaiKeyInput.value.trim();
    apiKeys.openrouter = openrouterKeyInput.value.trim();
    apiKeys.groq = groqKeyInput.value.trim();
    
    saveSettings();
    updateUIForCurrentMode();
    updateUIForCurrentModel();
    closeModal();
  });
  
  // Password Visibility Toggle Button
  document.querySelectorAll('.toggle-key-visibility').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const input = e.target.previousElementSibling;
      if (input.type === 'password') {
        input.type = 'text';
        e.target.textContent = '🙈';
      } else {
        input.type = 'password';
        e.target.textContent = '👁️';
      }
    });
  });
  
  // Auto-grow textarea & character counter
  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = (chatInput.scrollHeight - 4) + 'px';
    charCounter.textContent = `${chatInput.value.length} characters`;
  });
  
  // Send Message Form Submit
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleMessageSubmit();
  });
  
  // Textarea Shift+Enter handling
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatForm.dispatchEvent(new Event('submit'));
    }
  });
  
  // New Chat Click
  newChatBtn.addEventListener('click', () => {
    createNewChat();
    // On mobile, close sidebar automatically
    sidebar.classList.remove('show');
  });
  
  // Sidebar toggles for mobile view
  menuToggleBtn.addEventListener('click', () => sidebar.classList.add('show'));
  closeSidebarBtn.addEventListener('click', () => sidebar.classList.remove('show'));
  
  // Suggestion card prompts click handler
  document.querySelectorAll('.prompt-card').forEach(card => {
    card.addEventListener('click', () => {
      const text = card.dataset.prompt;
      chatInput.value = text;
      chatInput.focus();
      chatInput.dispatchEvent(new Event('input'));
    });
  });
  
  // Theme Toggle Buttons
  themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      themeMode = theme;
      applyThemeMode(theme);
      localStorage.setItem('nexus_theme_mode', theme);
    });
  });
  
  // Listen for system theme preference changes (for 'device' mode)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (themeMode === 'device') {
      applyThemeMode('device');
    }
  });
}

// Load configurations from LocalStorage
function loadSettings() {
  opMode = localStorage.getItem('nexus_op_mode') || 'simulation';
  themeMode = localStorage.getItem('nexus_theme_mode') || 'device';
  apiKeys.gemini = localStorage.getItem('nexus_key_gemini') || '';
  apiKeys.openai = localStorage.getItem('nexus_key_openai') || '';
  apiKeys.openrouter = localStorage.getItem('nexus_key_openrouter') || '';
  apiKeys.groq = localStorage.getItem('nexus_key_groq') || '';
}

// Save configurations to LocalStorage
function saveSettings() {
  localStorage.setItem('nexus_op_mode', opMode);
  localStorage.setItem('nexus_key_gemini', apiKeys.gemini);
  localStorage.setItem('nexus_key_openai', apiKeys.openai);
  localStorage.setItem('nexus_key_openrouter', apiKeys.openrouter);
  localStorage.setItem('nexus_key_groq', apiKeys.groq);
}

// Load Chat Conversations from LocalStorage
function loadConversations() {
  const data = localStorage.getItem('nexus_chats');
  if (data) {
    try {
      conversations = JSON.parse(data);
    } catch (e) {
      conversations = [];
    }
  }
}

// Save Chat Conversations to LocalStorage
function saveConversations() {
  localStorage.setItem('nexus_chats', JSON.stringify(conversations));
  renderSidebarHistory();
}

// Update settings UI mode badge
function updateUIForCurrentMode() {
  statusBadge.className = 'status-badge';
  
  if (opMode === 'simulation') {
    statusBadge.classList.add('mode-simulator');
    statusText.textContent = 'Simulator Mode';
  } else {
    statusBadge.classList.add('mode-live');
    statusText.textContent = 'API Active';
  }
}

// Apply Theme Mode (device/dark/light)
function applyThemeMode(mode) {
  // Remove existing theme-mode classes
  body.classList.remove('theme-mode-dark', 'theme-mode-light');
  
  if (mode === 'dark') {
    body.classList.add('theme-mode-dark');
  } else if (mode === 'light') {
    body.classList.add('theme-mode-light');
  } else {
    // Device mode: detect system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    body.classList.add(prefersDark ? 'theme-mode-dark' : 'theme-mode-light');
  }
  
  // Update active button state & slider position
  const themeOrder = ['device', 'light', 'dark'];
  const idx = themeOrder.indexOf(mode);
  
  themeButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === mode);
  });
  
  // Slide the track indicator dynamically based on actual button size
  if (themeSliderTrack && themeToggleContainer) {
    const styles = getComputedStyle(themeToggleContainer);
    const btnW = parseFloat(styles.getPropertyValue('--theme-btn-w'));
    const gap = parseFloat(styles.getPropertyValue('--theme-gap'));
    themeSliderTrack.style.transform = `translateX(${idx * (btnW + gap)}px)`;
  }
}

// Update theme colors and labels for active model choice
function updateUIForCurrentModel() {
  // Preserve theme-mode class while updating model theme
  const themeClass = [...body.classList].find(c => c.startsWith('theme-mode-'));
  body.className = `theme-${currentModel}`;
  if (themeClass) body.classList.add(themeClass);
  modelSelect.value = currentModel;
  
  let modelLabel = '';
  if (currentModel === 'gemini') {
    modelLabel = opMode === 'simulation' ? 'Gemini 2.0 Flash Simulation' : 'Gemini 2.0 Flash Live API';
  } else if (currentModel === 'claude') {
    modelLabel = opMode === 'simulation' ? 'Claude 3.5 Haiku Simulation' : (apiKeys.openrouter ? 'Claude 3.5 Haiku Live (OpenRouter)' : 'Claude 3.5 Haiku (Needs OpenRouter Key)');
  } else if (currentModel === 'chatgpt') {
    modelLabel = opMode === 'simulation' ? 'GPT-4o-mini Simulation' : (apiKeys.openrouter || apiKeys.openai ? 'GPT-4o-mini Live API' : 'GPT-4o-mini (Needs API Key)');
  } else if (currentModel === 'groq') {
    modelLabel = opMode === 'simulation' ? 'Nexus Simulation' : (apiKeys.groq ? 'Nexus Live (Groq)' : 'Nexus (Needs Groq Key)');
  }
  
  activeModelInfo.textContent = `Powered by ${modelLabel}`;
}

// Sidebar Chat History rendering
function renderSidebarHistory() {
  chatHistoryList.innerHTML = '';
  
  conversations.forEach(chat => {
    const li = document.createElement('li');
    li.className = `history-item ${chat.id === activeChatId ? 'active' : ''}`;
    li.dataset.chatId = chat.id;
    
    // Icon based on model choice
    let icon = '✨';
    if (chat.model === 'claude') icon = '🔸';
    if (chat.model === 'chatgpt') icon = '🟢';
    if (chat.model === 'groq') icon = '💎';
    
    li.innerHTML = `
      <span class="history-title">${icon} ${escapeHtml(chat.title)}</span>
      <button class="delete-chat-btn" aria-label="Delete Chat">✕</button>
    `;
    
    // Switch chat click handler
    li.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-chat-btn')) {
        e.stopPropagation();
        deleteChat(chat.id);
      } else {
        switchChat(chat.id);
        sidebar.classList.remove('show'); // close sidebar on mobile
      }
    });
    
    chatHistoryList.appendChild(li);
  });
}

// Create New Conversation Thread
function createNewChat() {
  const newId = 'chat_' + Date.now();
  const newChat = {
    id: newId,
    title: 'New Conversation',
    model: currentModel,
    messages: []
  };
  
  conversations.unshift(newChat);
  activeChatId = newId;
  saveConversations();
  switchChat(newId);
}

// Delete Chat from History
function deleteChat(id) {
  conversations = conversations.filter(c => c.id !== id);
  saveConversations();
  
  if (activeChatId === id) {
    if (conversations.length > 0) {
      switchChat(conversations[0].id);
    } else {
      createNewChat();
    }
  }
}

// Switch Active Chat Log
function switchChat(id) {
  activeChatId = id;
  const chat = conversations.find(c => c.id === id);
  if (!chat) return;
  
  currentModel = chat.model;
  updateUIForCurrentModel();
  
  // Render active item selection state
  document.querySelectorAll('.history-item').forEach(item => {
    item.classList.toggle('active', item.dataset.chatId === id);
  });
  
  renderChatMessages(chat.messages);
}

// Render Messages viewport
function renderChatMessages(messages) {
  conversationFeed.innerHTML = '';
  
  if (messages.length === 0) {
    welcomeScreen.style.display = 'flex';
    return;
  }
  
  welcomeScreen.style.display = 'none';
  
  messages.forEach(msg => {
    appendMessageHTML(msg.role, msg.content);
  });
  
  scrollToBottom();
}

// Append Chat Message HTML Bubble
function appendMessageHTML(role, content) {
  const messageNode = document.createElement('div');
  messageNode.className = `message ${role === 'user' ? 'user-message' : 'assistant-message'}`;
  
  const avatarText = role === 'user' ? 'U' : (currentModel === 'gemini' ? 'G' : (currentModel === 'claude' ? 'C' : (currentModel === 'chatgpt' ? 'GPT' : 'N')));
  
  messageNode.innerHTML = `
    <div class="message-avatar">${avatarText}</div>
    <div class="message-bubble">
      <div class="message-sender">${role === 'user' ? 'You' : (currentModel === 'gemini' ? 'Gemini 2.0' : (currentModel === 'claude' ? 'Claude 3.5' : (currentModel === 'chatgpt' ? 'ChatGPT' : 'Nexus')))}</div>
      <div class="message-content">${role === 'user' ? escapeHtml(content) : parseMarkdown(content)}</div>
    </div>
  `;
  
  conversationFeed.appendChild(messageNode);
  
  // Wire code blocks copy buttons
  messageNode.querySelectorAll('.copy-code-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const code = decodeURIComponent(e.target.dataset.code);
      navigator.clipboard.writeText(code).then(() => {
        const prevText = e.target.textContent;
        e.target.textContent = 'Copied!';
        e.target.style.borderColor = 'var(--accent-color)';
        setTimeout(() => {
          e.target.textContent = prevText;
          e.target.style.borderColor = '';
        }, 1500);
      });
    });
  });
}

// Scroll viewport to bottom
function scrollToBottom() {
  messagesViewport.scrollTop = messagesViewport.scrollHeight;
}

// Submit prompt handler
async function handleMessageSubmit() {
  const text = chatInput.value.trim();
  if (!text) return;
  
  // Clear textarea size & characters counter
  chatInput.value = '';
  chatInput.style.height = 'auto';
  charCounter.textContent = '0 characters';
  
  // Find current active chat thread
  const chat = conversations.find(c => c.id === activeChatId);
  if (!chat) return;
  
  // If first user message, update title based on first prompt
  const isFirstMessage = chat.messages.length === 0;
  if (isFirstMessage) {
    chat.title = text.length > 25 ? text.substring(0, 22) + '...' : text;
    chat.model = currentModel;
    welcomeScreen.style.display = 'none';
  }
  
  // Append user message
  chat.messages.push({ role: 'user', content: text });
  appendMessageHTML('user', text);
  scrollToBottom();
  saveConversations();
  
  // Append temporary Typing skeleton indicator
  const skeletonNode = document.createElement('div');
  skeletonNode.className = `message assistant-message skeleton-indicator`;
  const avatarText = currentModel === 'gemini' ? 'G' : (currentModel === 'claude' ? 'C' : (currentModel === 'chatgpt' ? 'GPT' : 'N'));
  const senderName = currentModel === 'gemini' ? 'Gemini 2.0' : (currentModel === 'claude' ? 'Claude 3.5' : (currentModel === 'chatgpt' ? 'ChatGPT' : 'Nexus'));
  skeletonNode.innerHTML = `
    <div class="message-avatar">${avatarText}</div>
    <div class="message-bubble">
      <div class="message-sender">${senderName}</div>
      <div class="message-content">
        <div class="typing-indicator">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
      </div>
    </div>
  `;
  conversationFeed.appendChild(skeletonNode);
  scrollToBottom();
  
  // Lock textarea input during loading state
  chatInput.disabled = true;
  sendBtn.disabled = true;
  
  try {
    let responseText = '';
    
    if (opMode === 'simulation') {
      responseText = await getSimulatedResponse(currentModel, text, chat.messages);
    } else {
      responseText = await getLiveApiResponse(currentModel, text, chat.messages);
    }
    
    // Remove skeleton
    skeletonNode.remove();
    
    // Save response
    chat.messages.push({ role: 'assistant', content: responseText });
    saveConversations();
    
    // Append answer with typewriter animations
    appendMessageHTML('assistant', responseText);
    scrollToBottom();
  } catch (error) {
    console.error('Request failed:', error);
    skeletonNode.remove();
    
    const errorText = `⚠️ **Error generating response**: ${error.message || 'Check your internet connection, API keys, or browser console.'}`;
    chat.messages.push({ role: 'assistant', content: errorText });
    saveConversations();
    
    appendMessageHTML('assistant', errorText);
    scrollToBottom();
  } finally {
    // Unlock input form
    chatInput.disabled = false;
    sendBtn.disabled = false;
    chatInput.focus();
  }
}

// ================= Offline Simulated response Personas =================
function getSimulatedResponse(model, prompt, history) {
  return new Promise((resolve) => {
    setTimeout(() => {
      let reply = '';
      const lower = prompt.toLowerCase();
      
      if (model === 'gemini') {
        reply = `Hello! Gemini here! 🌟 I'm functioning in Offline Simulation Mode.

Here is a structured overview of what I can help you do when you paste your Google Gemini Key:
1. **Direct API Key Integration**: Directly fetches answers from Google Generative Language endpoints.
2. **Coding & Logic**: I can write, refactor, and review code in any major programming language (JS, Python, C#, etc.).
3. **Speed & Efficiency**: Real-time content queries utilizing Google's fast Flash architecture.

As an assistant, I am optimistic, friendly, and structured! Let me know if you would like me to show you a demo of some code or explain a technical concept.`;

        if (lower.includes('debounce')) {
          reply = `Here is a clean JavaScript implementation of a **debounce** function. Debouncing limits the rate at which a function gets called, which is extremely useful for search bar auto-completes!

\`\`\`javascript
function debounce(func, delay = 300) {
  let timeoutId;
  
  return function(...args) {
    const context = this;
    
    // Clear any active timer to reset the delay window
    clearTimeout(timeoutId);
    
    // Setup a new delay window
    timeoutId = setTimeout(() => {
      func.apply(context, args);
    }, delay);
  };
}

// Example usage:
const handleSearchInput = debounce((event) => {
  console.log("Fetching search results for:", event.target.value);
}, 400);

document.getElementById("searchInput").addEventListener("input", handleSearchInput);
\`\`\`

### How it works:
1. **\`timeoutId\`**: Stores the reference to our active delay timer.
2. **\`clearTimeout\`**: Clears the pending timer if the user presses another key before the delay (e.g. 400ms) has finished.
3. **\`apply\`**: Invokes the original callback function with the correct lexical scope and arguments once the delay completes.`;
        } else if (lower.includes('database') || lower.includes('sql')) {
          reply = `Databases are generally split into two major paradigms: **SQL (Relational)** and **NoSQL (Non-Relational)**. Here is a simple breakdown:

### 📊 SQL Databases (Relational)
- **Structure**: Uses structured tables with fixed rows and columns.
- **Relationships**: Connects tables together using strict keys (foreign keys).
- **Language**: Queries data using **SQL** (Structured Query Language).
- **Scale**: Scaled vertically (faster hardware CPU/RAM).
- **Examples**: PostgreSQL, MSSQL, SQLite, Oracle SQL.

### 🌐 NoSQL Databases (Non-Relational)
- **Structure**: Uses documents (JSON), key-value pairs, wide-column graphs, or nodes.
- **Relationships**: Data is usually nested or decentralized rather than strictly joined.
- **Scale**: Scaled horizontally (adding more servers).
- **Examples**: MongoDB, Redis, Cassandra.

Let me know if you want me to write a query example for SQL!`;
        }
      } 
      
      else if (model === 'claude') {
        reply = `I am Claude, an artificial intelligence developed by Anthropic. I am currently operating under a local simulation.

From a conceptual perspective, my design focuses on logical precision, clear explanation of technical ideas, and objective programming analysis. 

Should you configure an **OpenRouter Key** in settings, we can bypass CORS browser restrictions and talk to my live models directly. How may I assist you with your design or development goals today?`;

        if (lower.includes('debounce')) {
          reply = `To limit the rate of callback executions in JavaScript, we utilize the **debounce** design pattern. Below is a logically structured debounce implementation:

\`\`\`javascript
/**
 * Creates a debounced function that delays execution until 'wait' milliseconds 
 * have elapsed since the last call.
 */
function debounce(fn, wait = 300) {
  let timerId = null;

  return function debounced(...args) {
    // If the debounced function is invoked, cancel any pending timeout
    if (timerId !== null) {
      clearTimeout(timerId);
    }

    // Set a new timer to execute the function after the wait duration
    timerId = setTimeout(() => {
      fn.apply(this, args);
      timerId = null; // Clear reference
    }, wait);
  };
}
\`\`\`

### Execution Flow Analysis:
- **Lexical Context**: Using \`apply(this, args)\` ensures that if the debounced function is a method on an object, it retains the correct execution context.
- **Garbage Collection**: Setting \`timerId = null\` inside the execution callback ensures memory resources are cleaned up cleanly.`;
        } else if (lower.includes('database') || lower.includes('sql')) {
          reply = `Relational (SQL) and Non-Relational (NoSQL) databases represent fundamentally different architectural decisions.

### 1. Relational Databases (SQL)
Relational databases enforce **ACID** (Atomicity, Consistency, Isolation, Durability) properties, making them optimal for transactions.
- **Schema**: Rigid, predefined.
- **Use Case**: Financial ledgers, ERP systems, core transactional models.
- **Key concept**: Joins are computationally expensive but preserve absolute integrity.

### 2. Document Databases (NoSQL)
NoSQL engines align with the **CAP Theorem** (Consistency, Availability, Partition Tolerance), prioritizing speed and distribution.
- **Schema**: Dynamic, schema-less.
- **Use Case**: Content management, real-time analytics feeds, cache layers.
- **Key concept**: Denormalized schemas reduce joints at the cost of document redundancy.`;
        }
      } 
      
      else if (model === 'chatgpt') {
        reply = `Hey! I'm ChatGPT (representing OpenAI's GPT-4o-mini). I'm running in Offline Simulation mode.

When you configure your OpenAI API Key, I can make live REST requests to standard completions. Here's a brief checklist of my key highlights:
- **Generalist Capabilities**: Excel at coding, debugging, summarizing text, and structuring emails.
- **Fast Execution**: Extremely quick turnaround times in development workflows.

Feel free to ask me to write code, design templates, or explain algorithms!`;

        if (lower.includes('debounce')) {
          reply = `Here is a standard, lightweight **debounce** implementation in modern JavaScript (ES6+):

\`\`\`javascript
const debounce = (func, delay = 300) => {
  let timeout;
  
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

// Quick Test:
const onResize = debounce(() => {
  console.log("Window resized! Performing layout adjustments.");
}, 250);

window.addEventListener('resize', onResize);
\`\`\`

### Highlights:
- **Arrow functions**: Lexically bind the \`this\` context automatically, keeping the code short.
- **Rest/Spread operator**: Passes all callback arguments (\`...args\`) seamlessly to the target function.`;
        } else if (lower.includes('database') || lower.includes('sql')) {
          reply = `Here's a quick comparison table to help you choose between SQL and NoSQL for your next project:

| Feature | SQL Databases | NoSQL Databases |
| :--- | :--- | :--- |
| **Data Model** | Relational (Tables, Joins) | Document, Key-Value, Graph |
| **Schema** | Pre-defined, Strict | Dynamic, Flexible |
| **Scaling** | Vertical (Scale Up) | Horizontal (Scale Out) |
| **Transactions** | Strict ACID Compliance | Eventual Consistency (BASE) |
| **Examples** | PostgreSQL, MySQL, MSSQL | MongoDB, Redis, Cassandra |

Use **SQL** when data integrity and strict relationships are critical. Use **NoSQL** when you need to store unstructured data and scale rapidly.`;
        }
      } 
      
      else if (model === 'groq') {
        reply = `Hello! I'm Nexus, your AI assistant powered by Groq's ultra-fast LPU architecture! ⚡ I am currently operating in Offline Simulation Mode.

When you save your Groq API Key in settings, we can make blazing-fast, live requests. Here is what I offer:
- **Instant Response Times**: Groq's LPU delivers tokens at a fraction of standard latency.
- **Advanced Intelligence**: High-quality coding, reasoning, and system analysis.

Let me know what you'd like to build or explain!`;

        if (lower.includes('debounce')) {
          reply = `Here is a standard, lightweight **debounce** implementation in modern JavaScript (ES6+):

\`\`\`javascript
const debounce = (func, delay = 300) => {
  let timeout;
  
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

// Example usage:
const processChange = debounce(() => {
  console.log("Input processed");
}, 300);
\`\`\`

### Highlights:
- Uses a simple arrow closure to preserve lexically bound contexts.
- Simple, high-speed, and non-blocking.`;
        } else if (lower.includes('database') || lower.includes('sql')) {
          reply = `Databases are generally split into:
1. **SQL (Relational)**: Structured tables, schemas, ACID compliance. (e.g. PostgreSQL, MSSQL).
2. **NoSQL (Non-Relational)**: Dynamic, scalable, document/key-value storage. (e.g. MongoDB, Redis).

Choose SQL for high-integrity transactions, and NoSQL for high-write, flexible content workloads!`;
        }
      }
      
      if (!reply) {
        reply = `You said: "${prompt}"

I am currently running in **Simulation Mode** for model: \`${model}\`. Since this is an offline response, I want to remind you that once you enter your API keys in the Settings Panel (gear icon), I will execute real requests to return live, real-time completions.

Let me know if there's a specific coding snippet you'd like me to mock!`;
      }
      
      resolve(reply);
    }, 1000);
  });
}

// ================= Live API Request Handlers =================
async function getLiveApiResponse(model, prompt, history) {
  // Format message payload for OpenAI/OpenRouter compatible completions
  const formattedMessages = history.map(h => ({
    role: h.role === 'user' ? 'user' : 'assistant',
    content: h.content
  }));
  
  // 1. Google Gemini API Direct Integration
  if (model === 'gemini' && !apiKeys.openrouter) {
    if (!apiKeys.gemini) {
      throw new Error("Missing Google Gemini API Key. Configure it in Settings.");
    }
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKeys.gemini}`;
    
    // Gemini expectation format
    const geminiContents = history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    }));
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: geminiContents })
    });
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Gemini API returned status ${res.status}`);
    }
    
    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  }
  
  // 2. OpenAI (ChatGPT) Direct Integration
  if (model === 'chatgpt' && !apiKeys.openrouter) {
    if (!apiKeys.openai) {
      throw new Error("Missing OpenAI API Key. Configure it in Settings.");
    }
    
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKeys.openai}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: formattedMessages
      })
    });
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `OpenAI API returned status ${res.status}`);
    }
    
    const data = await res.json();
    return data.choices[0].message.content;
  }
  
  // 3. OpenRouter Unified Integration (Enables Claude client-side and acts as fallback)
  if (apiKeys.openrouter) {
    let openRouterModel = 'google/gemini-2.0-flash:free';
    if (model === 'claude') openRouterModel = 'anthropic/claude-3-haiku';
    if (model === 'chatgpt') openRouterModel = 'openai/gpt-4o-mini';
    
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKeys.openrouter}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Nexus AI Chat client'
      },
      body: JSON.stringify({
        model: openRouterModel,
        messages: formattedMessages
      })
    });
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `OpenRouter API returned status ${res.status}`);
    }
    
    const data = await res.json();
    return data.choices[0].message.content;
  }

  // 4. Groq API Integration (OpenAI-compatible)
  if (model === 'groq' && !apiKeys.openrouter) {
    if (!apiKeys.groq) {
      throw new Error("Missing Groq API Key. Configure it in Settings.");
    }
    
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKeys.groq}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: formattedMessages
      })
    });
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Groq API returned status ${res.status}`);
    }
    
    const data = await res.json();
    return data.choices[0].message.content;
  }
  
  // Claude direct fallback warning (since Claude direct requires CORS proxy)
  if (model === 'claude' && !apiKeys.openrouter) {
    throw new Error("Claude requires an OpenRouter API key to bypass browser CORS block policies.");
  }
  
  throw new Error("No compatible API key configured for the selected model.");
}

// ================= Markdown Light Parser =================
function parseMarkdown(text) {
  let html = escapeHtml(text);
  
  // 1. Parse Fenced Code Blocks: ```javascript ... ```
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  html = html.replace(codeBlockRegex, (match, lang, code) => {
    const cleanCode = code.trim();
    const encoded = encodeURIComponent(cleanCode);
    const displayLang = lang || 'code';
    
    return `
      <div class="code-header">
        <span>${displayLang}</span>
        <button class="copy-code-btn" data-code="${encoded}">Copy Code</button>
      </div>
      <pre><code>${cleanCode}</code></pre>
    `;
  });
  
  // 2. Parse Inline Code: `code`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // 3. Parse Bold text: **bold**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // 4. Parse Headers: ### Header
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
  
  // 5. Parse Bullet points: - item
  html = html.replace(/^\s*-\s+(.+)$/gm, '<li>$1</li>');
  // Wrap consecutive <li> elements in a <ul> (rough replacement)
  html = html.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');
  // Remove nested uls
  html = html.replace(/<\/ul>\s*<ul>/g, '');
  
  // 6. Parse numbered list items: 1. item
  html = html.replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/g, '<ol>$1</ol>');
  html = html.replace(/<\/ol>\s*<ol>/g, '');
  
  // 7. Parse line breaks into paragraphs
  const paragraphs = html.split('\n\n');
  html = paragraphs.map(p => {
    const trimmed = p.trim();
    if (!trimmed) return '';
    // Skip wrapping if it's already a code block, list, or header element
    if (trimmed.startsWith('<div') || trimmed.startsWith('<pre') || trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<ol')) {
      return trimmed;
    }
    return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
  }).join('');
  
  return html;
}

// Helper: Escape HTML strings to prevent XSS
function escapeHtml(string) {
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
