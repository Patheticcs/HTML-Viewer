      (function() {
          const state = {
            code: {
              html: '',
              css: '',
              javascript: ''
            },
            currentLang: 'html',
            editor: null,
            isUpdating: false,
            settings: {
              theme: 'default',
              fontSize: '14'
            }
          };
          state.editor = CodeMirror(document.getElementById('editor'), {
            mode: 'htmlmixed',
            theme: state.settings.theme,
            lineNumbers: true,
            autoCloseTags: true,
            autoCloseBrackets: true,
            matchBrackets: true,
            lineWrapping: true,
            tabSize: 2,
            indentWithTabs: false,
            extraKeys: {
              'Ctrl-Enter': () => document.getElementById('runBtn').click(),
              'Ctrl-S': (cm) => {
                showNotification('Changes saved!', 'success');
                return false;
              },
              'Ctrl-Space': 'autocomplete',
              'Ctrl-/': 'toggleComment'
            }
          });
          document.querySelector('.CodeMirror').style.fontSize = `${state.settings.fontSize}px`;

          function showNotification(message, type = 'success') {
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;
            document.body.appendChild(notification);
            setTimeout(() => {
              notification.remove();
            }, 3000);
          }

          function updatePreview(force = false) {
            if (state.isUpdating && !force) return;
            state.isUpdating = true;
            requestAnimationFrame(() => {
              try {
                const previewContent = `

                                                                                                                                                
															<!DOCTYPE html>
															<html>
																<head>
																	<meta charset="UTF-8">
																		<meta name="viewport" content="width=device-width, initial-scale=1.0">
																			<style>${state.code.css || ''}</style>
																		</head>
																		<body>
              ${state.code.html || ''}

                                                                                                                                                                                
																			<script>${state.code.javascript || ''}<\/script>
																			</body>
																		</html>`;
                const preview = document.getElementById('preview');
                const previewDoc = preview.contentDocument || preview.contentWindow.document;
                previewDoc.open();
                previewDoc.write(previewContent);
                previewDoc.close();
                updatePreviewSize();
                state.isUpdating = false;
              } catch (err) {
                console.error('Preview update error:', err);
                state.isUpdating = false;
                showNotification('Error updating preview', 'error');
              }
            });
          }

          function updatePreviewSize() {
            const preview = document.getElementById('preview');
            const previewSize = document.getElementById('previewSize');
            previewSize.textContent = `${preview.offsetWidth}x${preview.offsetHeight}`;
          }
          document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
              const lang = button.dataset.lang;
              if (state.currentLang === lang) return;
              state.code[state.currentLang] = state.editor.getValue();
              document.querySelector('.tab-button.active').classList.remove('active');
              button.classList.add('active');
              state.currentLang = lang;
              state.editor.setOption('mode', lang === 'html' ? 'htmlmixed' : lang);
              state.editor.setValue(state.code[lang] || '');
            });
          });
          state.editor.on('change', (cm) => {
            state.code[state.currentLang] = cm.getValue();
            updatePreview();
          });
          document.querySelectorAll('.device-button').forEach(button => {
            button.addEventListener('click', () => {
              document.querySelector('.device-button.active').classList.remove('active');
              button.classList.add('active');
              const preview = document.getElementById('preview');
              preview.style.width = button.dataset.width;
              preview.style.height = button.dataset.height;
              updatePreviewSize();
            });
          });
          const settingsPanel = document.getElementById('settingsPanel');
          const settingsBtn = document.getElementById('settingsBtn');
          const closeSettings = document.getElementById('closeSettings');
          settingsBtn.addEventListener('click', () => {
            settingsPanel.classList.add('visible');
          });
          closeSettings.addEventListener('click', () => {
            settingsPanel.classList.remove('visible');
          });
          const themeSelect = document.getElementById('themeSelect');
          themeSelect.value = state.settings.theme;
          themeSelect.addEventListener('change', (e) => {
            const theme = e.target.value;
            applyTheme(theme);
            state.settings.theme = theme;
          });
          const fontSizeSelect = document.getElementById('fontSizeSelect');
          fontSizeSelect.value = state.settings.fontSize;
          fontSizeSelect.addEventListener('change', (e) => {
            const fontSize = e.target.value;
            document.querySelector('.CodeMirror').style.fontSize = `${fontSize}px`;
            state.settings.fontSize = fontSize;
          });
          document.getElementById('runBtn').addEventListener('click', () => {
            state.code[state.currentLang] = state.editor.getValue();
            updatePreview(true);
            showNotification('Code executed!', 'success');
          });
          document.getElementById('previewBtn').addEventListener('click', () => {
            const win = window.open('', '_blank');
            win.document.write(`

                                                                                                                                                                        
																		<!DOCTYPE html>
																		<html>
																			<head>
																				<meta charset="UTF-8">
																					<meta name="viewport" content="width=device-width, initial-scale=1.0">
																						<style>${state.code.css || ''}</style>
																					</head>
																					<body>
              ${state.code.html || ''}

                                                                                                                                                                                                        
																						<script>${state.code.javascript || ''}<\/script>
																						</body>
																					</html>`);
          });
          document.getElementById('clearBtn').addEventListener('click', () => {
            state.code = {
              html: '',
              css: '',
              javascript: ''
            };
            state.editor.setValue('');
            updatePreview(true);
            showNotification('All content cleared!', 'success');
          });
          document.getElementById('saveBtn').addEventListener('click', () => {
            const htmlContent = state.code.html || '';
            const cssContent = state.code.css || '';
            const javascriptContent = state.code.javascript || '';
            const zip = new JSZip();
            if (htmlContent) {
              zip.file('index.html', htmlContent);
            }
            if (cssContent) {
              zip.file('styles.css', cssContent);
            }
            if (javascriptContent) {
              zip.file('script.js', javascriptContent);
            }
            zip.generateAsync({
              type: 'blob'
            }).then(function(content) {
              const link = document.createElement('a');
              const url = URL.createObjectURL(content);
              link.href = url;
              link.download = 'project.zip';
              link.click();
              URL.revokeObjectURL(url);
              showNotification('Your files are being downloaded as a zip!', 'success');
            }).catch(function(err) {
              console.error('Error generating zip file:', err);
              showNotification('Error generating zip file', 'error');
            });
          });
          document.getElementById('shareBtn').addEventListener('click', async () => {
            try {
              const shareUrl = window.location.origin;
              await navigator.clipboard.writeText(shareUrl);
              showNotification('Domain URL copied to clipboard!', 'success');
            } catch (err) {
              showNotification('Error copying domain URL', 'error');
            }
          });

          function applyTheme(theme) {
            const themeColors = {
              nord: {
                '--primary-bg': '#2E3440',
                '--secondary-bg': '#3B4252',
                '--accent-color': '#88C0D0',
                '--text-primary': '#ECEFF4',
                '--text-secondary': '#D8DEE9',
                '--border-color': '#434C5E'
              },
              monokai: {
                '--primary-bg': '#272822',
                '--secondary-bg': '#383830',
                '--accent-color': '#F92672',
                '--text-primary': '#F8F8F2',
                '--text-secondary': '#75715E',
                '--border-color': '#3E3D32'
              },
              material: {
                '--primary-bg': '#263238',
                '--secondary-bg': '#37474F',
                '--accent-color': '#FF4081',
                '--text-primary': '#ECEFF1',
                '--text-secondary': '#B0BEC5',
                '--border-color': '#455A64'
              },
              dracula: {
                '--primary-bg': '#282a36',
                '--secondary-bg': '#44475a',
                '--accent-color': '#ff79c6',
                '--text-primary': '#f8f8f2',
                '--text-secondary': '#6272a4',
                '--border-color': '#6272a4'
              },
              'tomorrow-night-bright': {
                '--primary-bg': '#1d1f21',
                '--secondary-bg': '#282c34',
                '--accent-color': '#e0e0e0',
                '--text-primary': '#f0f0f0',
                '--text-secondary': '#b0b0b0',
                '--border-color': '#4e5b67'
              },
              default: {
                '--primary-bg': '#1a1b26',
                '--secondary-bg': '#24283b',
                '--accent-color': '#7aa2f7',
                '--text-primary': '#c0caf5',
                '--text-secondary': '#9aa5ce',
                '--border-color': '#414868'
              }
            };
            const root = document.documentElement;
            const colors = themeColors[theme] || themeColors['default'];
            Object.keys(colors).forEach(key => {
              root.style.setProperty(key, colors[key]);
            });
            localStorage.setItem('selectedTheme', theme);
            state.editor.setOption('theme', theme);
          }
          document.addEventListener('DOMContentLoaded', () => {
            const savedTheme = localStorage.getItem('selectedTheme') || 'default';
            applyTheme(savedTheme);
          });
          const consoleBtn = document.getElementById("consoleBtn");
          const consolePanel = document.getElementById("consolePanel");
          const consoleOutput = document.getElementById("consoleOutput");
          const originalConsole = {
            error: console.error,
            log: console.log,
            warn: console.warn,
            info: console.info
          };
          console.log = function(...args) {
            originalConsole.log(...args);
            appendToConsole("log", args);
          };
          console.error = function(...args) {
            originalConsole.error(...args);
            appendToConsole("error", args);
          };
          console.warn = function(...args) {
            originalConsole.warn(...args);
            appendToConsole("warning", args);
          };
          console.info = function(...args) {
            originalConsole.info(...args);
            appendToConsole("info", args);
          };

          function appendToConsole(type, args) {
            const line = document.createElement("div");
            line.className = `console-line console-${type}`;
            const output = args.map(function(arg) {
              if (typeof arg === "object") {
                return JSON.stringify(arg, null, 2);
              }
              return String(arg);
            }).join(" ");
            const timestamp = new Date().toLocaleTimeString();
            line.innerHTML = `[${timestamp}] ${output}`;
            consoleOutput.appendChild(line);
            consoleOutput.scrollTop = consoleOutput.scrollHeight;
          }
          consoleBtn.addEventListener("click", function() {
            consolePanel.classList.toggle("visible");
            const editorWrapper = document.querySelector(".editor-wrapper");
            if (consolePanel.classList.contains("visible")) {
              editorWrapper.style.height = "calc(100% - 200px)";
            } else {
              editorWrapper.style.height = "100%";
            }
          });
          document.getElementById("clearBtn").addEventListener("click", function() {
            consoleOutput.innerHTML = "";
          });
          document.addEventListener("keydown", function(e) {
            if (e.ctrlKey && e.key === "`") {
              e.preventDefault();
              consoleBtn.click();
            }
          });
          let autoSaveInterval;

          function setupAutoSave() {
            const autoSaveSelect = document.getElementById('autoSaveSelect');
            clearInterval(autoSaveInterval);
            if (autoSaveSelect.value !== 'off') {
              const seconds = parseInt(autoSaveSelect.value);
              autoSaveInterval = setInterval(() => {
                localStorage.setItem('synprev_autosave', JSON.stringify(state.code));
                showNotification('Auto-saved', 'success');
              }, seconds * 1000);
            }
          }
          const savedContent = localStorage.getItem('synprev_autosave');
          if (savedContent) {
            state.code = JSON.parse(savedContent);
            state.editor.setValue(state.code[state.currentLang] || '');
          }
          document.getElementById('autoSaveSelect').addEventListener('change', setupAutoSave);
          const editorWrapper = document.querySelector('.editor-wrapper');
          editorWrapper.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            editorWrapper.classList.add('drag-over');
          });
          editorWrapper.addEventListener('dragleave', () => {
            editorWrapper.classList.remove('drag-over');
          });
          editorWrapper.addEventListener('drop', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            editorWrapper.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (!file) return;
            const content = await file.text();
            const extension = file.name.split('.').pop().toLowerCase();
            switch (extension) {
              case 'html':
                state.code.html = content;
                break;
              case 'css':
                state.code.css = content;
                break;
              case 'js':
                state.code.javascript = content;
                break;
              default:
                showNotification('Unsupported file type', 'error');
                return;
            }
            if (extension === state.currentLang || (extension === 'js' && state.currentLang === 'javascript')) {
              state.editor.setValue(content);
            }
            updatePreview(true);
            showNotification(`${file.name} loaded successfully`, 'success');
          });
          const undoManager = {
            stack: [],
            position: -1,
            maxSize: 100,
            push(state) {
              this.position++;
              this.stack.splice(this.position);
              this.stack.push(JSON.stringify(state));
              if (this.stack.length > this.maxSize) {
                this.stack.shift();
                this.position--;
              }
            },
            undo() {
              if (this.position > 0) {
                this.position--;
                return JSON.parse(this.stack[this.position]);
              }
              return null;
            },
            redo() {
              if (this.position < this.stack.length - 1) {
                this.position++;
                return JSON.parse(this.stack[this.position]);
              }
              return null;
            }
          };

          function setupErrorHandling() {
            const preview = document.getElementById('preview');
            const previewWindow = preview.contentWindow;
            previewWindow.onerror = (msg, url, lineNo, columnNo, error) => {
              console.error(`${msg}\nLine: ${lineNo}, Column: ${columnNo}`);
              showNotification('JavaScript error detected', 'error');
              return false;
            };
          }

          function setupResizeHandle() {
            const handle = document.getElementById('resizeHandle');
            const editorsContainer = document.querySelector('.editors-container');
            const previewContainer = document.querySelector('.preview-container');
            let isResizing = false;
            let startX, startWidth;
            handle.addEventListener('mousedown', (e) => {
              isResizing = true;
              startX = e.pageX;
              startWidth = editorsContainer.offsetWidth;
              document.body.classList.add('resizing');
            });
            document.addEventListener('mousemove', (e) => {
              if (!isResizing) return;
              const diff = e.pageX - startX;
              const newWidth = Math.max(300, Math.min(startWidth + diff, document.body.offsetWidth - 300));
              editorsContainer.style.width = `${newWidth}px`;
              previewContainer.style.width = `calc(100% - ${newWidth}px - 4px)`;
              updatePreviewSize();
            });
            document.addEventListener('mouseup', () => {
              isResizing = false;
              document.body.classList.remove('resizing');
            });
          }
          const keyboardShortcuts = {
            'Ctrl-Z': (cm) => {
              const previousState = undoManager.undo();
              if (previousState) {
                state.code = previousState;
                cm.setValue(state.code[state.currentLang]);
                updatePreview(true);
              }
            },
            'Ctrl-Y': (cm) => {
              const nextState = undoManager.redo();
              if (nextState) {
                state.code = nextState;
                cm.setValue(state.code[state.currentLang]);
                updatePreview(true);
              }
            },
            'Alt-F': () => {
              document.getElementById('preview').requestFullscreen();
            }
          };
          Object.assign(state.editor.options.extraKeys, keyboardShortcuts);

          function initializeNewFeatures() {
            setupAutoSave();
            setupErrorHandling();
            setupResizeHandle();
            state.editor.on('change', () => {
              undoManager.push({
                ...state.code
              });
            });
          }
          initializeNewFeatures();
          const newStyles = `
      .drag-over {
      border: 2px dashed var(--accent-color);
      background: rgba(59, 130, 246, 0.1);
      }

      body.resizing {
      cursor: ew-resize;
      user-select: none;
      }

      .console-line {
      font-family: 'JetBrains Mono', monospace;
      white-space: pre-wrap;
      border-bottom: 1px solid var(--border-color);
      }

      @media (prefers-reduced-motion: reduce) {
      .notification {
      animation: none;
      }
      }

      @media (max-width: 640px) {
      .toolbar-group {
      display: none;
      }

      .toolbar-group:first-child {
      display: flex;
      }
      }
      `;
          const newToolbar = document.createElement('div');
          newToolbar.className = 'toolbar-group advanced-features';
          newToolbar.innerHTML = `

                                                                                                                                                                                                
																					<button class="button" id="formatBtn" title="Format Code">
																						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
																							<path d="M21 10H3M21 6H3M21 14H3M21 18H3"/>
																						</svg>
      Format

                                                                                                                                                                                                
																					</button>
																					<button class="button" id="snippetsBtn" title="Code Snippets">
																						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
																							<path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/>
																						</svg>
      Snippets

                                                                                                                                                                                                
																					</button>
																					<button class="button" id="searchBtn" title="Search in Files">
																						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
																							<circle cx="11" cy="11" r="8"/>
																							<line x1="21" y1="21" x2="16.65" y2="16.65"/>
																						</svg>
      Search

                                                                                                                                                                                                
																					</button>
      `;
          document.querySelector('.toolbar').appendChild(newToolbar);
          const snippetsPanel = document.createElement('div');
          snippetsPanel.className = 'side-panel snippets-panel';
          snippetsPanel.innerHTML = `

                                                                                                                                                                                                
																					<div class="panel-header">
																						<h2>Code Snippets</h2>
																						<button class="button" id="closeSnippets">
																							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
																								<line x1="18" y1="6" x2="6" y2="18"/>
																								<line x1="6" y1="6" x2="18" y2="18"/>
																							</svg>
																						</button>
																					</div>
																					<div class="panel-content">
																						<div class="snippet-categories">
																							<button class="active" data-category="html">HTML</button>
																							<button data-category="css">CSS</button>
																							<button data-category="js">JavaScript</button>
																						</div>
																						<div class="snippet-list"></div>
																					</div>
      `;
          document.body.appendChild(snippetsPanel);
          const searchPanel = document.createElement('div');
          searchPanel.className = 'search-panel';
          searchPanel.innerHTML = `

                                                                                                                                                                                                
																					<div class="search-header">
																						<input type="text" id="searchInput" placeholder="Search in files...">
																							<div class="search-options">
																								<label>
																									<input type="checkbox" id="caseSensitive"> Case sensitive

                                                                                                                                                                                                                                
																									</label>
																									<label>
																										<input type="checkbox" id="regexSearch"> Regular expression

                                                                                                                                                                                                                                        
																										</label>
																									</div>
																								</div>
																								<div class="search-results"></div>
      `;
          document.body.appendChild(searchPanel);
          const additionalStyles = `
      .side-panel {
      position: fixed;
      top: 0;
      right: -400px;
      width: 400px;
      height: 100vh;
      background: var(--secondary-bg);
      border-left: 1px solid var(--border-color);
      transition: right 0.3s ease;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      }

      .side-panel.visible {
      right: 0;
      }

      .panel-header {
      padding: 1rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      }

      .panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      }

      .snippet-categories {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
      }

      .snippet-categories button {
      padding: 0.5rem 1rem;
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      border-radius: 0.375rem;
      cursor: pointer;
      transition: all 0.2s;
      }

      .snippet-categories button.active {
      background: var(--accent-color);
      border-color: var(--accent-color);
      color: #fff;
      }

      .snippet-item {
      padding: 1rem;
      background: var(--primary-bg);
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
      margin-bottom: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
      }

      .snippet-item:hover {
      border-color: var(--accent-color);
      transform: translateY(-1px);
      }

      .snippet-title {
      font-weight: 500;
      margin-bottom: 0.5rem;
      }

      .snippet-description {
      font-size: 0.875rem;
      color: var(--text-secondary);
      }

      .search-panel {
      position: fixed;
      top: 20%;
      left: 50%;
      transform: translateX(-50%) translateY(-20%);
      width: 600px;
      max-width: 90vw;
      background: var(--secondary-bg);
      border-radius: 0.5rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      display: none;
      z-index: 1000;
      }

      .search-panel.visible {
      display: block;
      }

      .search-header {
      padding: 1rem;
      border-bottom: 1px solid var(--border-color);
      }

      .search-header input[type="text"] {
      width: 100%;
      padding: 0.75rem;
      background: var(--primary-bg);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      border-radius: 0.375rem;
      margin-bottom: 0.5rem;
      }

      .search-options {
      display: flex;
      gap: 1rem;
      font-size: 0.875rem;
      }

      .search-results {
      max-height: 400px;
      overflow-y: auto;
      padding: 1rem;
      }

      .search-result {
      padding: 0.75rem;
      border-bottom: 1px solid var(--border-color);
      cursor: pointer;
      }

      .search-result:hover {
      background: var(--primary-bg);
      }

      .search-result-file {
      font-weight: 500;
      margin-bottom: 0.25rem;
      }

      .search-result-preview {
      font-family: monospace;
      font-size: 0.875rem;
      color: var(--text-secondary);
      }

      .highlight {
      background: rgba(59, 130, 246, 0.2);
      border-radius: 0.25rem;
      }

      @media (max-width: 768px) {
      .side-panel {
      width: 100%;
      right: -100%;
      }

      .search-panel {
      width: 95vw;
      max-height: 80vh;
      }
      }

      .status-bar {
      background: var(--secondary-bg);
      border-top: 1px solid var(--border-color);
      padding: 0.5rem 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.875rem;
      color: var(--text-secondary);
      }

      .status-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      }

      .minimap {
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 100px;
      background: var(--primary-bg);
      opacity: 0.6;
      pointer-events: none;
      }
      `;
          const styleSheet = document.createElement('style');
          styleSheet.textContent = additionalStyles;
          document.head.appendChild(styleSheet);

          function initializeNewUI() {
            const snippets = {
              html: [{
                title: 'Responsive Container',
                description: 'A container with responsive breakpoints',
                code: ' < div class = "container mx-auto px-4" > ... < /div>'
              }, ],
              css: [{
                title: 'Flex Center',
                description: 'Center elements using flexbox',
                code: '.center {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}'
              }, ],
              js: [{
                title: 'Fetch API Template',
                description: 'Basic fetch API with error handling',
                code: 'async function fetchData(url) {\n  try {\n    const response = await fetch(url);\n    return await response.json();\n  } catch (error) {\n    console.error("Error:", error);\n  }\n}'
              }, ]
            };

            function showSnippets(category) {
              const snippetList = document.querySelector('.snippet-list');
              snippetList.innerHTML = '';
              snippets[category].forEach(snippet => {
                const snippetEl = document.createElement('div');
                snippetEl.className = 'snippet-item';
                snippetEl.innerHTML = `

                                                                                                                                                                                                                        
																								<div class="snippet-title">${snippet.title}</div>
																								<div class="snippet-description">${snippet.description}</div>
      `;
                snippetEl.addEventListener('click', () => {
                  state.editor.replaceSelection(snippet.code);
                  showNotification('Snippet inserted!', 'success');
                });
                snippetList.appendChild(snippetEl);
              });
            }
            document.getElementById('snippetsBtn').addEventListener('click', () => {
              document.querySelector('.snippets-panel').classList.add('visible');
              showSnippets('html');
            });
            document.getElementById('closeSnippets').addEventListener('click', () => {
              document.querySelector('.snippets-panel').classList.remove('visible');
            });
            document.querySelectorAll('.snippet-categories button').forEach(button => {
              button.addEventListener('click', () => {
                document.querySelector('.snippet-categories .active').classList.remove('active');
                button.classList.add('active');
                showSnippets(button.dataset.category);
              });
            });
            const statusBar = document.createElement('div');
            statusBar.className = 'status-bar';
            statusBar.innerHTML = `

                                                                                                                                                                                                                        
																								<div class="status-left">
																									<span class="status-item" id="cursorPosition">Ln 1, Col 1</span>
																									<span class="status-item" id="fileSize">0 bytes</span>
																								</div>
																								<div class="status-right">
																									<span class="status-item" id="syntaxMode">HTML</span>
																									<span class="status-item" id="encodingType">UTF-8</span>
																								</div>
      `;
            document.querySelector('.editors-container').appendChild(statusBar);
            state.editor.on('cursorActivity', () => {
              const pos = state.editor.getCursor();
              document.getElementById('cursorPosition').textContent = `Ln ${pos.line + 1}, Col ${pos.ch + 1}`;
            });
            state.editor.on('change', () => {
              const size = new Blob([state.editor.getValue()]).size;
              document.getElementById('fileSize').textContent = `${size} bytes`;
            });
            document.getElementById('formatBtn').addEventListener('click', () => {
              const value = state.editor.getValue();
              let formatted = value;
              try {
                if (state.currentLang === 'javascript') {
                  formatted = js_beautify(value, {
                    indent_size: 2,
                    space_in_empty_paren: true
                  });
                } else if (state.currentLang === 'html') {
                  formatted = html_beautify(value, {
                    indent_size: 1,
                    max_preserve_newlines: 2
                  });
                } else if (state.currentLang === 'css') {
                  formatted = css_beautify(value, {
                    indent_size: 2
                  });
                }
                state.editor.setValue(formatted);
                showNotification('Code formatted!', 'success');
              } catch (error) {
                console.error('Formatting error:', error);
                showNotification('Error formatting code', 'error');
              }
            });
          }
          initializeNewUI();

          function performSearch(query, options = {}) {
            const searchResults = document.querySelector('.search-results');
            searchResults.innerHTML = '';
            if (!query) return;
            const files = {
              'HTML': state.code.html,
              'CSS': state.code.css,
              'JavaScript': state.code.javascript
            };
            try {
              let regex;
              if (options.isRegex) {
                regex = new RegExp(query, options.caseSensitive ? 'g' : 'gi');
              } else {
                regex = new RegExp(escapeRegExp(query), options.caseSensitive ? 'g' : 'gi');
              }
              Object.entries(files).forEach(([fileName, content]) => {
                if (!content) return;
                const matches = [...content.matchAll(regex)];
                if (matches.length > 0) {
                  matches.forEach(match => {
                    const start = Math.max(0, match.index - 40);
                    const end = Math.min(content.length, match.index + match[0].length + 40);
                    const preview = content.substring(start, end);
                    const resultElement = document.createElement('div');
                    resultElement.className = 'search-result';
                    resultElement.innerHTML = `

                                                                                                                                                                                                                        
																								<div class="search-result-file">${fileName}</div>
																								<div class="search-result-preview">${highlightMatch(preview, match[0])}</div>
          `;
                    resultElement.addEventListener('click', () => {
                      const langMap = {
                        'HTML': 'html',
                        'CSS': 'css',
                        'JavaScript': 'javascript'
                      };
                      document.querySelector(`[data-lang="${langMap[fileName]}"]`).click();
                      state.editor.setCursor(state.editor.posFromIndex(match.index));
                      state.editor.focus();
                    });
                    searchResults.appendChild(resultElement);
                  });
                }
              });
              if (searchResults.children.length === 0) {
                searchResults.innerHTML = ' < div class = "search-no-results" > No results found < /div>';
              }
            } catch (error) {
              console.error('Search error:', error);
              showNotification('Invalid search pattern', 'error');
            }
          }

          function escapeRegExp(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          }

          function highlightMatch(text, match) {
            return text.replace(new RegExp(escapeRegExp(match), 'gi'), `

                                                                                                                                                                                                                        
																								<span class="highlight">${match}</span>`);
          }

          function toggleSearchPanel() {
            const searchPanel = document.querySelector('.search-panel');
            searchPanel.classList.toggle('visible');
            if (searchPanel.classList.contains('visible')) {
              document.getElementById('searchInput').focus();
            }
          }
          document.getElementById('searchBtn').addEventListener('click', toggleSearchPanel);
          document.getElementById('searchInput').addEventListener('input', (e) => {
            const caseSensitive = document.getElementById('caseSensitive').checked;
            const isRegex = document.getElementById('regexSearch').checked;
            performSearch(e.target.value, {
              caseSensitive,
              isRegex
            });
          });
          document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'f') {
              e.preventDefault();
              toggleSearchPanel();
            }
          });
          const additionalShortcuts = {
            'Ctrl-B': (cm) => {
              document.getElementById('snippetsBtn').click();
            },
            'Ctrl-P': (cm) => {
              const currentValue = cm.getValue();
              navigator.clipboard.writeText(currentValue);
              showNotification('Code copied to clipboard!', 'success');
            },
            'Alt-S': (cm) => {
              const lines = cm.getValue().split('\n');
              const sorted = lines.sort();
              cm.setValue(sorted.join('\n'));
              showNotification('Lines sorted alphabetically', 'success');
            }
          };
          Object.assign(state.editor.options.extraKeys, additionalShortcuts);
          window.addEventListener('load', () => {
            const lastEditTime = localStorage.getItem('lastEditTime');
            if (lastEditTime) {
              const hoursSinceEdit = (Date.now() - lastEditTime) / (1000 * 60 * 60);
              if (hoursSinceEdit < 24) {
                const autosavedContent = localStorage.getItem('synprev_autosave');
                if (autosavedContent) {
                  const recover = confirm('Found unsaved changes from your last session. Would you like to recover them?');
                  if (recover) {
                    const savedCode = JSON.parse(autosavedContent);
                    state.code = savedCode;
                    state.editor.setValue(state.code[state.currentLang] || '');
                    updatePreview(true);
                  }
                }
              }
            }
          });

          function toggleLineWrapping() {
            const isWrapped = state.editor.getOption('lineWrapping');
            state.editor.setOption('lineWrapping', !isWrapped);
            showNotification(`Line wrapping ${!isWrapped ? 'enabled' : 'disabled'}`, 'success');
          }

          function getWordCount() {
            const content = state.editor.getValue();
            const wordCount = content.trim().split(/\s+/).length;
            const charCount = content.length;
            showNotification(`Words: ${wordCount}, Characters: ${charCount}`, 'info');
          }

          function indentSelectedLines() {
            const selections = state.editor.getSelections();
            const indentedSelections = selections.map(text => text.split('\n').map(line => '  ' + line).join('\n'));
            state.editor.replaceSelections(indentedSelections);
          }

          function outdentSelectedLines() {
            const selections = state.editor.getSelections();
            const outdentedSelections = selections.map(text => text.split('\n').map(line => line.startsWith('  ') ? line.substring(2) : line).join('\n'));
            state.editor.replaceSelections(outdentedSelections);
          }
          Object.assign(state.editor.options.extraKeys, {
            'Ctrl-W': toggleLineWrapping,
            'Ctrl-Shift-C': getWordCount,
            'Tab': indentSelectedLines,
            'Shift-Tab': outdentSelectedLines
          });
          let lastSavedContent = state.editor.getValue();
          setInterval(() => {
            const currentContent = state.editor.getValue();
            if (currentContent !== lastSavedContent) {
              document.title = '* ' + document.title.replace('* ', '');
            } else {
              document.title = document.title.replace('* ', '');
            }
          }, 1000);
          const projectManager = {
            currentProject: {
              name: 'Untitled Project',
              id: Date.now().toString(),
              lastModified: new Date()
            },
            validateProjectData(projectData) {
              return projectData && typeof projectData === 'object' && projectData.name && projectData.id && projectData.lastModified && projectData.code;
            },
            sanitizeProjectName(name) {
              return name.trim() || 'Untitled Project';
            },
            saveCurrentProject() {
              try {
                const projectData = {
                  name: this.sanitizeProjectName(this.currentProject.name),
                  id: this.currentProject.id,
                  lastModified: new Date(),
                  code: state.code || {
                    html: '',
                    css: '',
                    javascript: ''
                  }
                };
                localStorage.setItem(`project_${this.currentProject.id}`, JSON.stringify(projectData));
                this.updateProjectsList();
                showNotification(`Project "${projectData.name}" saved`, 'success');
                return true;
              } catch (error) {
                console.error('Error saving project:', error);
                showNotification('Failed to save project', 'error');
                return false;
              }
            },
            loadProject(projectId) {
              try {
                const projectData = localStorage.getItem(`project_${projectId}`);
                if (!projectData) {
                  showNotification('Project not found', 'error');
                  return false;
                }
                const project = JSON.parse(projectData);
                if (!this.validateProjectData(project)) {
                  showNotification('Invalid project data', 'error');
                  return false;
                }
                this.currentProject = {
                  name: this.sanitizeProjectName(project.name),
                  id: project.id,
                  lastModified: new Date(project.lastModified)
                };
                state.code = project.code;
                state.editor.setValue(state.code[state.currentLang] || '');
                const projectNameInput = document.getElementById('projectName');
                if (projectNameInput) {
                  projectNameInput.value = this.currentProject.name;
                }
                updatePreview(true);
                showNotification(`Project "${this.currentProject.name}" loaded`, 'success');
                return true;
              } catch (error) {
                console.error('Error loading project:', error);
                showNotification('Failed to load project', 'error');
                return false;
              }
            },
            createNewProject() {
              const defaultProject = {
                name: 'Untitled Project',
                id: Date.now().toString(),
                lastModified: new Date()
              };
              try {
                this.currentProject = defaultProject;
                state.code = {
                  html: '',
                  css: '',
                  javascript: ''
                };
                state.editor.setValue('');
                const projectNameInput = document.getElementById('projectName');
                if (projectNameInput) {
                  projectNameInput.value = defaultProject.name;
                }
                updatePreview(true);
                return true;
              } catch (error) {
                console.error('Error creating new project:', error);
                showNotification('Failed to create new project', 'error');
                return false;
              }
            },
            getAllProjects() {
              const projects = [];
              try {
                for (let i = 0; i < localStorage.length; i++) {
                  const key = localStorage.key(i);
                  if (key && key.startsWith('project_')) {
                    const projectData = JSON.parse(localStorage.getItem(key));
                    if (this.validateProjectData(projectData)) {
                      projects.push({
                        id: projectData.id,
                        name: this.sanitizeProjectName(projectData.name),
                        lastModified: new Date(projectData.lastModified)
                      });
                    }
                  }
                }
                return projects.sort((a, b) => b.lastModified - a.lastModified);
              } catch (error) {
                console.error('Error getting projects:', error);
                return [];
              }
            },
            updateProjectsList() {
              const projectsList = document.getElementById('projectsList');
              if (!projectsList) return;
              const projects = this.getAllProjects();
              projectsList.innerHTML = `

          
																								<div class="project-item default-project">
																									<span class="project-name">Default (Clear All)</span>
																									<button class="load-project-btn" aria-label="Load default project">Load</button>
																								</div>
      `;
              projects.forEach(project => {
                const projectItem = document.createElement('div');
                projectItem.className = 'project-item';
                projectItem.innerHTML = `

           
																								<span class="project-name">${this.sanitizeProjectName(project.name)}</span>
																								<span class="project-date">${project.lastModified.toLocaleDateString()}</span>
																								<button class="load-project-btn" aria-label="Load project">Load</button>
																								<button class="delete-project-btn" aria-label="Delete project">Delete</button>
      `;
                const loadBtn = projectItem.querySelector('.load-project-btn');
                const deleteBtn = projectItem.querySelector('.delete-project-btn');
                if (loadBtn) {
                  loadBtn.addEventListener('click', () => {
                    this.loadProject(project.id);
                    const projectsPanel = document.getElementById('projectsPanel');
                    if (projectsPanel) {
                      projectsPanel.classList.remove('visible');
                    }
                  });
                }
                if (deleteBtn) {
                  deleteBtn.addEventListener('click', () => {
                    if (confirm(`Delete project "${project.name}"?`)) {
                      try {
                        localStorage.removeItem(`project_${project.id}`);
                        this.updateProjectsList();
                        showNotification(`Project "${project.name}" deleted`, 'success');
                      } catch (error) {
                        console.error('Error deleting project:', error);
                        showNotification('Failed to delete project', 'error');
                      }
                    }
                  });
                }
                projectsList.appendChild(projectItem);
              });
            }
          };
          const initializeProjectEventListeners = () => {
            const projectsBtn = document.querySelector('.button[aria-label="Open projects panel"]');
            const projectsPanel = document.getElementById('projectsPanel');
            const closeProjectsBtn = document.getElementById('closeProjects');
            const saveProjectBtn = document.getElementById('saveProjectBtn');
            const newProjectBtn = document.getElementById('newProjectBtn');
            const projectNameInput = document.getElementById('projectName');
            if (projectsBtn && projectsPanel) {
              projectsBtn.addEventListener('click', () => {
                projectsPanel.classList.add('visible');
                projectManager.updateProjectsList();
              });
            }
            if (closeProjectsBtn && projectsPanel) {
              closeProjectsBtn.addEventListener('click', () => {
                projectsPanel.classList.remove('visible');
              });
            }
            if (saveProjectBtn && projectNameInput) {
              saveProjectBtn.addEventListener('click', () => {
                projectManager.currentProject.name = projectNameInput.value;
                projectManager.saveCurrentProject();
              });
            }
            if (newProjectBtn) {
              newProjectBtn.addEventListener('click', () => {
                if (confirm('Create new project? Any unsaved changes will be lost.')) {
                  projectManager.createNewProject();
                }
              });
            }
            const defaultProjectBtn = document.querySelector('.default-project .load-project-btn');
            if (defaultProjectBtn) {
              defaultProjectBtn.addEventListener('click', () => {
                if (confirm('Load default empty project? Any unsaved changes will be lost.')) {
                  projectManager.createNewProject();
                  projectsPanel.classList.remove('visible');
                }
              });
            }
          };
          document.addEventListener('DOMContentLoaded', () => {
            initializeProjectEventListeners();
            projectManager.updateProjectsList();
          });
          const formatterConfig = {
            javascript: {
              indent_size: 2,
              space_in_empty_paren: true,
              preserve_newlines: true,
              max_preserve_newlines: 2,
              break_chained_methods: false,
              keep_array_indentation: false,
              brace_style: 'collapse,preserve-inline',
              space_before_conditional: true
            },
            html: {
              indent_size: 2,
              max_preserve_newlines: 2,
              preserve_newlines: true,
              indent_inner_html: true,
              wrap_line_length: 0,
              indent_scripts: 'keep',
              unformatted: ['code', 'pre', 'em', 'strong', 'span'],
              content_unformatted: ['pre']
            },
            css: {
              indent_size: 2,
              preserve_newlines: true,
              max_preserve_newlines: 2,
              newline_between_rules: true,
              selector_separator_newline: true,
              space_around_selector_separator: true
            }
          };
          const detectLanguage = (content) => {
            if (content.includes(' < !DOCTYPE html ') || content.includes(' < html ')) {
                return 'html';
              }
              if (content.match(/@media|@keyframes|{[\s\S]*}/)) {
                return 'css';
              }
              return 'javascript';
            };
            const formatCode = (code, language) => {
              const detectedLang = language || detectLanguage(code);
              const config = formatterConfig[detectedLang] || formatterConfig.javascript;
              try {
                let formatted;
                switch (detectedLang) {
                  case 'javascript':
                    formatted = js_beautify(code, config);
                    break;
                  case 'html':
                    formatted = html_beautify(code, config);
                    break;
                  case 'css':
                    formatted = css_beautify(code, config);
                    break;
                  default:
                    formatted = js_beautify(code, config);
                }
                return {
                  success: true,
                  formatted
                };
              } catch (error) {
                try {
                  const relaxedConfig = {
                    ...config,
                    indent_size: 2
                  };
                  return {
                    success: true,
                    formatted: js_beautify(code, relaxedConfig),
                    warning: 'Used fallback formatting due to syntax errors'
                  };
                } catch (fallbackError) {
                  return {
                    success: false,
                    error: `Formatting failed: ${error.message}`,
                    original: code
                  };
                }
              }
            };
            document.getElementById('formatBtn').addEventListener('click', () => {
              const value = state.editor.getValue();
              const result = formatCode(value, state.currentLang);
              if (result.success) {
                state.editor.setValue(result.formatted);
                if (result.warning) {
                  showNotification(result.warning, 'warning');
                } else {
                  showNotification('Code formatted successfully!', 'success');
                }
              } else {
                console.error('Formatting error:', result.error);
                showNotification('Error formatting code. Check console for details.', 'error');
              }
            });
            Object.assign(state.editor.options.extraKeys, {
              'Ctrl-Alt-F': (cm) => {
                document.getElementById('formatBtn').click();
              }
            });
          })();