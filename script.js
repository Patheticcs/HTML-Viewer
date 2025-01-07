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

  // Tab switching
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

  // Editor change listener
  state.editor.on('change', (cm) => {
    state.code[state.currentLang] = cm.getValue();
    updatePreview();
    saveToLocalStorage();
  });

  // Run button
  document.getElementById('runBtn').addEventListener('click', () => {
    state.code[state.currentLang] = state.editor.getValue();
    updatePreview(true);
    showSuccessMessage('Code executed!');
  });

  // Preview button
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

  // Save button
  document.getElementById('saveBtn').addEventListener('click', () => {
    saveToLocalStorage();
    showSuccessMessage('Saved!');

    // Save as files
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

    const saveFile = (content, type, filename) => {
      const blob = new Blob([content], { type });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    };

    saveFile(htmlContent, 'text/html', 'index.html');
    saveFile(state.code.css || '', 'text/css', 'style.css');
    saveFile(state.code.javascript || '', 'application/javascript', 'script.js');
  });

  // Clear button
  document.getElementById('clearBtn').addEventListener('click', () => {
    state.code = { html: '', css: '', javascript: '' };
    state.editor.setValue('');
    localStorage.removeItem('editorContent');
    updatePreview(true);
    showSuccessMessage('Cleared!');
  });

  // Theme selector
  const themeSelector = document.getElementById('themeSelector');
  themeSelector.addEventListener('change', (e) => {
    const selectedTheme = e.target.value;
    state.editor.setOption('theme', selectedTheme);
    showSuccessMessage(`Theme switched to ${selectedTheme}`);
  });

  loadFromLocalStorage();
  updatePreview(true);
})();
