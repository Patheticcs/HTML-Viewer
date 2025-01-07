(function() {
        const state = {
          code: {
            html: '',
            css: '',
            javascript: ''
          },
          currentLang: 'html',
          editor: null,
          isUpdating: false
        };

        state.editor = CodeMirror(document.getElementById('editor'), {
          mode: 'htmlmixed',
          theme: 'default',
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
              saveToLocalStorage();
              showSuccessMessage('Changes saved!');
              return false;
            },
            'Ctrl-Shift-S': () => {
              downloadAllFiles();
              return false;
            },
            'Ctrl-P': () => {
              toggleShortcutsPanel();
              return false;
            }
          }
        });

        function loadFromLocalStorage() {
          try {
            const saved = localStorage.getItem('editorContent');
            if (saved) {
              state.code = JSON.parse(saved);
              state.editor.setValue(state.code[state.currentLang] || '');
              updatePreview(true);
            }
          } catch (err) {
            console.error('Error loading saved content:', err);
          }
        }

        function saveToLocalStorage() {
          try {
            localStorage.setItem('editorContent', JSON.stringify(state.code));
          } catch (err) {
            console.error('Error saving content:', err);
          }
        }

        function showSuccessMessage(message) {
          const successEl = document.getElementById('successMessage');
          successEl.textContent = message;
          successEl.style.display = 'block';
          setTimeout(() => {
            successEl.style.display = 'none';
          }, 2000);
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
              const previewSize = document.getElementById('previewSize');
              previewSize.textContent = `${preview.offsetWidth}x${preview.offsetHeight}`;
              state.isUpdating = false;
            } catch (err) {
              console.error('Preview update error:', err);
              state.isUpdating = false;
            }
          });
        }

        function toggleShortcutsPanel() {
          const panel = document.querySelector('.shortcuts-panel');
          panel.classList.toggle('visible');
        }

        function downloadAllFiles() {
          const htmlContent = `
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
          const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
          const htmlLink = document.createElement('a');
          htmlLink.href = URL.createObjectURL(htmlBlob);
          htmlLink.download = 'index.html';
          htmlLink.click();

          const cssBlob = new Blob([state.code.css || ''], { type: 'text/css' });
          const cssLink = document.createElement('a');
          cssLink.href = URL.createObjectURL(cssBlob);
          cssLink.download = 'style.css';
          cssLink.click();

          const jsBlob = new Blob([state.code.javascript || ''], { type: 'application/javascript' });
          const jsLink = document.createElement('a');
          jsLink.href = URL.createObjectURL(jsBlob);
          jsLink.download = 'script.js';
          jsLink.click();
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

        state.editor.on('change', (cm, change) => {
          state.code[state.currentLang] = cm.getValue();
          updatePreview();
          saveToLocalStorage();
        });

        document.getElementById('runBtn').addEventListener('click', () => {
          state.code[state.currentLang] = state.editor.getValue();
          updatePreview(true);
          showSuccessMessage('Code executed!');
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
          win.document.close();
        });

        document.getElementById('clearBtn').addEventListener('click', () => {
          state.code = {
            html: '',
            css: '',
            javascript: ''
          };
          state.editor.setValue('');
          localStorage.removeItem('editorContent');
          updatePreview(true);
          showSuccessMessage('Cleared!');
        });
      })();
