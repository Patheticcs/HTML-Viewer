<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Synprev</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/theme/dracula.min.css" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            height: 100vh;
            background: black;
            color: white;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .toolbar {
            background: black;
            padding: 12px;
            display: flex;
            gap: 12px;
            border-bottom: 1px solid white;
        }

        .action-button {
            padding: 8px 16px;
            background: black;
            border: 1px solid white;
            color: white;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: transform 0.2s, background-color 0.2s;
        }

        .action-button:hover {
            background: white;
            color: black;
        }

        .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .editors-container {
            height: 60%;
            display: flex;
            flex-direction: column;
            min-height: 100px;
        }

        .tab-buttons {
            display: flex;
            background: black;
            padding: 5px 5px 0;
        }

        .tab-button {
            padding: 10px 24px;
            background: #333;
            border: none;
            color: white;
            cursor: pointer;
            margin-right: 5px;
            margin-left: 5px;
            border-top-left-radius: 4px;
            border-top-right-radius: 4px;
            font-size: 14px;
            transition: all 0.2s;
        }

        .tab-button:hover {
            background: #444;
        }

        .tab-button.active {
            background: #1f1f1e;
            color: white;
        }

        .editor-wrapper {
            flex: 1;
            overflow: hidden;
            position: relative;
            display: flex;
            flex-direction: column;
        }

        #editor {
            flex: 1;
            height: 100%;
            overflow-y: auto;
        }

        .CodeMirror {
            height: 100%;
            font-family: 'Fira Code', 'Consolas', monospace;
            font-size: 14px;
            line-height: 1.6;
            overflow: hidden;
        }

        .resize-handle {
            height: 8px;
            background: #333;
            cursor: ns-resize;
            position: relative;
        }

        .resize-handle:hover {
            background: #444;
        }

        .resize-handle::after {
            content: '';
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 50px;
            height: 2px;
            background: #666;
            border-radius: 1px;
        }

        .preview-container {
            flex: 1;
            background: white;
            min-height: 100px;
        }

        #preview {
            width: 100%;
            height: 100%;
            border: none;
        }

        .error-message {
            color: #ff4444;
            padding: 8px;
            margin: 8px;
            border-radius: 4px;
            background: rgba(255, 68, 68, 0.1);
            display: none;
        }

        .input-url-container {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        #inputUrl {
            padding: 8px;
            border-radius: 4px;
            border: 1px solid #ddd;
            font-size: 14px;
            width: 200px;
        }

        .action-button-url {
            padding: 8px 16px;
            background: #444;
            border: 1px solid white;
            color: white;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
        }

    </style>
</head>
<body>
    <div class="toolbar">
        <button class="action-button" id="runBtn">Run</button>
        <button class="action-button" id="previewBtn">Open Preview</button>
        <button class="action-button" id="clearBtn">Clear All</button>
    </div>
    <div class="input-url-container">
        <input type="text" id="inputUrl" placeholder="Enter a website URL" />
        <button class="action-button-url" id="loadHtmlBtn">Load HTML</button>
    </div>
    <div class="main-content">
        <div class="editors-container" id="editorsContainer">
            <div class="tab-buttons">
                <button class="tab-button active" data-lang="html">HTML</button>
                <button class="tab-button" data-lang="css">CSS</button>
                <button class="tab-button" data-lang="javascript">JavaScript</button>
            </div>
            <div class="editor-wrapper">
                <div id="editor"></div>
            </div>
            <div class="error-message" id="errorMessage"></div>
        </div>
        <div class="resize-handle" id="resizeHandle"></div>
        <div class="preview-container">
            <iframe id="preview"></iframe>
        </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/xml/xml.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/javascript/javascript.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/css/css.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/htmlmixed/htmlmixed.min.js"></script>

    <script>
        (function() {
            const code = { html: '', css: '', javascript: '' };
            let currentLang = 'html';
            let editor;

            editor = CodeMirror(document.getElementById('editor'), {
                mode: 'htmlmixed',
                theme: 'dracula',
                lineNumbers: true,
                autoCloseTags: true,
                autoCloseBrackets: true,
                matchBrackets: true,
                lineWrapping: true,
                tabSize: 2,
                indentWithTabs: false,
                extraKeys: { 'Ctrl-Space': 'autocomplete' }
            });

            editor.on('change', () => {
                code[currentLang] = editor.getValue();
                updatePreview();
            });

            document.querySelectorAll('.tab-button').forEach(button => {
                button.addEventListener('click', () => {
                    const lang = button.dataset.lang;
                    if (currentLang === lang) return;

                    code[currentLang] = editor.getValue();

                    document.querySelector('.tab-button.active').classList.remove('active');
                    button.classList.add('active');

                    currentLang = lang;
                    editor.setOption('mode', lang === 'html' ? 'htmlmixed' : lang);
                    editor.setValue(code[lang]);
                });
            });

            const resizeHandle = document.getElementById('resizeHandle');
            const editorsContainer = document.getElementById('editorsContainer');
            let isDragging = false;

            resizeHandle.addEventListener('mousedown', (e) => {
                isDragging = true;
                document.body.style.cursor = 'ns-resize';
                e.preventDefault();
            });

            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;

                const containerHeight = document.querySelector('.main-content').offsetHeight;
                const minHeight = 100;
                const maxHeight = containerHeight - minHeight;

                const newHeight = Math.min(maxHeight, Math.max(minHeight, e.clientY));
                editorsContainer.style.height = newHeight + 'px';
            });

            document.addEventListener('mouseup', () => {
                isDragging = false;
                document.body.style.cursor = '';
            });

            function updatePreview() {
                const previewContent = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <style>${code.css}</style>
                    </head>
                    <body>
                        ${code.html}
                        <script>${code.javascript}<\/script>
                    </body>
                    </html>
                `;

                const preview = document.getElementById('preview');
                const previewDoc = preview.contentDocument || preview.contentWindow.document;
                previewDoc.open();
                previewDoc.write(previewContent);
                previewDoc.close();
            }

            document.getElementById('runBtn').addEventListener('click', updatePreview);

            document.getElementById('previewBtn').addEventListener('click', () => {
                const win = window.open('', '_blank');
                win.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <style>${code.css}</style>
                    </head>
                    <body>
                        ${code.html}
                        <script>${code.javascript}<\/script>
                    </body>
                    </html>
                `);
                win.document.close();
            });

            document.getElementById('clearBtn').addEventListener('click', () => {
                code.html = '';
                code.css = '';
                code.javascript = '';
                editor.setValue('');
            });

            document.getElementById('loadHtmlBtn').addEventListener('click', () => {
                const url = document.getElementById('inputUrl').value;
                if (url) {
                    fetch(`/fetch-html?url=${encodeURIComponent(url)}`)
                        .then(response => response.text())
                        .then(data => {
                            code.html = data; // Set the HTML content in the editor
                            editor.setValue(code.html);
                        })
                        .catch(error => {
                            alert('Error loading HTML: ' + error);
                        });
                }
            });

            updatePreview();
        })();
    </script>
</body>
</html>
