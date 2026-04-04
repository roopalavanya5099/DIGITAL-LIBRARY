/**
 * User utilities for Digital Library
 * Optimized for performance with batch DOM updates
 */

// Debounce function
const debounce = (func, delay = 300) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

// Safe localStorage operations
const safeJSONParse = (value, fallback = null) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.warn('JSON Parse Error:', error);
    return fallback;
  }
};

const safeJSONStringify = (value) => {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.warn('JSON Stringify Error:', error);
    return null;
  }
};

/**
 * Download book with validation
 */
const downloadBook = debounce((bookName) => {
  const username = localStorage.getItem('currentUser');

  // Validate user is logged in
  if (!username) {
    showNotification('Please log in to download books', 'warning');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
    return;
  }

  if (!bookName || typeof bookName !== 'string') {
    console.warn('Invalid book name provided');
    return;
  }

  try {
    // Get user downloads
    let userDownloads = safeJSONParse(localStorage.getItem('userDownloads'), {});

    // Initialize user record if needed
    if (!userDownloads[username]) {
      userDownloads[username] = [];
    }

    // Check if already downloaded
    const isAlreadyDownloaded = userDownloads[username].includes(bookName);

    if (!isAlreadyDownloaded) {
      userDownloads[username].push(bookName);
      const serialized = safeJSONStringify(userDownloads);
      if (serialized) {
        localStorage.setItem('userDownloads', serialized);
        showNotification(`✓ "${bookName}" downloaded successfully`, 'success');
      }
    } else {
      showNotification(`"${bookName}" already in your downloads`, 'info');
    }

  } catch (error) {
    console.error('Download error:', error);
    showNotification('Error downloading book. Please try again.', 'error');
  }
}, 300);

/**
 * Show notification with improved UX
 */
const showNotification = (message, type = 'info') => {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  const bgColor = {
    success: '#27ae60',
    error: '#e74c3c',
    warning: '#f39c12',
    info: '#3498db'
  }[type] || '#3498db';

  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${bgColor};
    color: white;
    border-radius: 4px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease-out;
    max-width: 500px;
    z-index: 1000;
  `;

  document.body.appendChild(notification);

  // Auto remove
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
};

/**
 * Batch load downloads - more efficient than individual DOM updates
 */
const loadDownloads = () => {
  const username = localStorage.getItem('currentUser');
  if (!username) return;

  const userDownloads = safeJSONParse(localStorage.getItem('userDownloads'), {});
  const downloads = userDownloads[username] || [];

  const downloadsList = document.getElementById('downloadsList');
  if (!downloadsList) return;

  // Use DocumentFragment for batch DOM updates (more efficient)
  const fragment = document.createDocumentFragment();

  if (downloads.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'No downloads yet';
    empty.style.cssText = 'text-align: center; color: #7f8c8d; margin: 20px 0;';
    fragment.appendChild(empty);
  } else {
    downloads.forEach(book => {
      const item = document.createElement('div');
      item.className = 'download-item';
      item.innerHTML = `
        <span>${book}</span>
        <button onclick="removeDownload('${book.replace(/'/g, "\\'")}')">Remove</button>
      `;
      item.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        border-bottom: 1px solid #ecf0f1;
      `;
      fragment.appendChild(item);
    });
  }

  // Single DOM operation
  downloadsList.innerHTML = '';
  downloadsList.appendChild(fragment);
};

/**
 * Remove download from list
 */
const removeDownload = (bookName) => {
  const username = localStorage.getItem('currentUser');
  if (!username) return;

  const userDownloads = safeJSONParse(localStorage.getItem('userDownloads'), {});
  if (userDownloads[username]) {
    userDownloads[username] = userDownloads[username].filter(b => b !== bookName);
    const serialized = safeJSONStringify(userDownloads);
    if (serialized) {
      localStorage.setItem('userDownloads', serialized);
      loadDownloads(); // Refresh the list
      showNotification(`"${bookName}" removed from downloads`, 'info');
    }
  }
};

// Load downloads when page loads
document.addEventListener('DOMContentLoaded', () => {
  loadDownloads();

  // Attach download handlers to all download buttons
  const downloadButtons = document.querySelectorAll('[data-book-download]');
  downloadButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const bookName = btn.getAttribute('data-book-download');
      downloadBook(bookName);
    });
    btn.removeAttribute('onclick');
  });

  // Refresh every 10 seconds to catch external changes
  setInterval(loadDownloads, 10000);
});
