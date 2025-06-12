const CSV_URLS = [
  'https://raw.githubusercontent.com/kuenastar115/scbd/refs/heads/main/scbd.csv',
  'https://raw.githubusercontent.com/kuenastar115/scbd/refs/heads/main/scbd1.csv',
  'https://raw.githubusercontent.com/kuenastar115/scbd/refs/heads/main/scbd2.csv',
  'https://raw.githubusercontent.com/kuenastar115/scbd/refs/heads/main/scbd3.csv'
];

// Auto-redirect /pdf.html → /pdf and /search.html → /search (with query and hash preserved)
const path = window.location.pathname;

if (path.endsWith('/pdf.html') || path.endsWith('/search.html')) {
  const query = window.location.search || '';
  const hash = window.location.hash || '';
  const target = path.replace('.html', '') + query + hash;
  window.location.replace(target);
}


function slugify(title) {
  return title.trim()
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^\w\-]/g, '');
}

function getQueryParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}
// ✨ Utilities for search highlighting
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlight(text, words) {
  let escapedWords = words.map(w => escapeRegExp(w));
  const pattern = new RegExp(`(${escapedWords.join('|')})`, 'gi');
  return text.replace(pattern, '<mark>$1</mark>');
}
// Load All CSVs
async function loadAllCSVs() {
  const texts = await Promise.all(CSV_URLS.map(url => fetch(url).then(res => res.text())));
  const allData = texts.flatMap(text => {
    return Papa.parse(text, { header: true, skipEmptyLines: true }).data;
  });
  return allData;
}
// 🧩 Load external HTML partials (header & footer)
document.addEventListener("DOMContentLoaded", () => {
  async function loadPartial(selector, file, callback) {
    const el = document.querySelector(selector);
    if (el) {
      try {
        const res = await fetch(file);
        const html = await res.text();
        el.innerHTML = html;
        if (typeof callback === 'function') callback();
      } catch (err) {
        console.error(`Failed to load partial ${file}:`, err);
      }
    }
  }

  loadPartial("#header-placeholder", "header.html", () => {
    const form = document.getElementById('searchForm');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const input = document.getElementById('searchInput').value.trim();
        if (input) {
          const query = input.toLowerCase().replace(/\s+/g, '-');
          const baseUrl = window.location.origin;
          window.location.href = `${baseUrl}/search?query=${query}`;
        }
      });
    }
  });

  loadPartial("#footer-placeholder", "footer.html");
});
// 📄 PDF page rendering
if (document.getElementById('title-section')) {
  const documentId = getQueryParam('document');
  const titleSlug = window.location.hash.slice(1);

  const titleEl = document.getElementById('title-section');
  const descEl = document.getElementById('description-section');
  const iframeEl = document.getElementById('iframe-section');
  const suggEl = document.getElementById('suggestion-section');

  if (!documentId || !titleSlug) {
    titleEl.innerHTML = `<p class="description">Error: Missing document ID or title in URL.</p>`;
  } else {
    loadAllCSVs()
      .then(data => {
        const doc = data.find(d => d.ID.trim() === documentId.trim() && slugify(d.Title) === titleSlug);
        const docId = getQueryParam('document');
        const currentDoc = data.find(d => d.ID === docId);

        const breadcrumb = document.getElementById('breadcrumb');
        if (currentDoc) {
          breadcrumb.innerHTML = `<a href="/index.html">Home</a> &raquo; ${currentDoc.Title}`;
        }

        if (!doc) {
          titleEl.innerHTML = `<p class="description">Document not found for ID: ${documentId} and title: ${titleSlug}</p>`;
          return;
        }
        //Title above URL
        document.title = `[PDF] ${doc.Title} | English Resources`;

        const downloadUrl = `https://ilide.info/docgeneratev2?fileurl=https://scribd.vdownloaders.com/pdownload/${doc.ID}/`;

        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
          metaDescription.setAttribute('content', doc.Summary.slice(0, 160));
        }

        titleEl.innerHTML = `<h1>${doc.Title}</h1>`;

        descEl.innerHTML = `
          <p class="description">${doc.Summary}.</p>
          <p class="description">
            <strong>${doc.Title}</strong> contains ${doc.Pages} pages in a PDF document type uploaded by SCRB Downloader Team. This PDF document with an ID ${doc.ID}
            has been downloaded for ${doc.Views} times. In this document entitled ${doc.Title}, we can get a lot of benefits and information.
          </p>
          
          <a class="download-button" href="${downloadUrl}" target="_blank"><span style="font-size: 20px;">DOWNLOAD PDF</span></a>
        `;

        iframeEl.innerHTML = `
          <iframe class="scribd_iframe_embed"
            title="${doc.Title}"
            src="https://www.scribd.com/embeds/${doc.ID}/content?start_page=1&view_mode=scroll&access_key=key-NCzuA9v6DY7zHHNCjjID"
            tabindex="0"
            data-auto-height="true"
            data-aspect-ratio="0.6536"
            scrolling="no"
            width="100%"
            height="800"
            frameborder="0">
          </iframe>
        `;

        const otherDocs = data.filter(d => d.ID.trim() !== doc.ID.trim());
        const shuffled = otherDocs.sort(() => 0.5 - Math.random()).slice(0, 10);

        const suggestions = shuffled.map(d => {
          const slug = slugify(d.Title);
          const baseUrl = window.location.origin;
          const url = `${baseUrl}/pdf.html?document=${d.ID}#${slug}`;
          return `
            <div class="related-post">
              <div class="related-post-title">
                <a href="${url}">${d.Title}</a>
              </div>
              <div class="related-post-text">${d.Summary}
                <hr class="post-divider">
              </div>
            </div>
          `;
        }).join('');

        suggEl.innerHTML = `
          <h2>Documents related to ${doc.Title}</h2>
          <hr class="post-divider">
          ${suggestions}
        `;
      })
      .catch(err => {
        console.error('Failed to load CSV:', err);
        titleEl.innerHTML = `<p>Error loading document data.</p>`;
      });
  }
}
// 🏠 Index page: show random 10 docs
if (document.getElementById('results') && !document.getElementById('header')) {
  loadAllCSVs()
    .then(data => {
      const shuffled = data.sort(() => 0.5 - Math.random()).slice(0, 10);

      const suggestions = shuffled.map(d => {
        const slug = slugify(d.Title);
        const baseUrl = window.location.origin;
        const url = `${baseUrl}/pdf.html?document=${d.ID}#${slug}`;
        return `
          <div class="related-post">
            <div class="related-post-title">
              <a href="${url}">${d.Title}</a>
            </div>
            <div class="related-post-text">
              ${d.Summary}
              <hr class="post-divider">
            </div>
          </div>
        `;
      }).join('');

      document.getElementById('results').innerHTML = suggestions;
    })
    .catch(err => {
      console.error('Error loading index:', err);
      document.getElementById('results').innerHTML = '<p>Error loading documents.</p>';
    });
}
// 🔍 Search page rendering
if (document.getElementById('header') && document.getElementById('results')) {
  const baseUrl = window.location.origin;
  const queryParam = getQueryParam('query');
  const queryWords = queryParam ? queryParam.toLowerCase().split('-').filter(Boolean) : [];
  const headerEl = document.getElementById('header');
  const container = document.getElementById('results');

  if (!queryParam || queryWords.length === 0) {
    headerEl.textContent = "Please enter a search query.";
    container.innerHTML = "";
  } else {
    document.title = `SCRIBD documents related to ${queryParam.replace(/-/g, ' ')}`;
    loadAllCSVs()
      .then(data => {
        const matches = data.filter(d => {
          const title = d.Title.toLowerCase();
          const summary = d.Summary.toLowerCase();
          return queryWords.some(q => title.includes(q) || summary.includes(q));
        });

        if (matches.length > 0) {
          headerEl.textContent = `${matches.length} document${matches.length !== 1 ? 's' : ''} found for '${queryParam.replace(/-/g, ' ')}'.`;
          const output = matches.map(d => {
            const slug = slugify(d.Title);
            const url = `${baseUrl}/pdf.html?document=${d.ID}#${slug}`;
            const highlightedTitle = highlight(d.Title, queryWords);
            const highlightedSummary = highlight(d.Summary, queryWords);
            return `
              <hr class="post-divider">
              <div class="related-post">
                <div class="related-post-title">
                  <a href="${url}">${highlightedTitle}</a>
                </div>
                <div class="related-post-text">${highlightedSummary}</div>
              </div>
            `;
          }).join('');

          container.innerHTML = output;
        } else {
          headerEl.textContent = `No documents found for '${queryParam.replace(/-/g, ' ')}'. But, these documents might be interesting for you.`;
          const suggestions = data.sort(() => 0.5 - Math.random()).slice(0, 10).map(d => {
            const slug = slugify(d.Title);
            const url = `${baseUrl}/pdf?document=${d.ID}#${slug}`;
            return `
              <hr class="post-divider">
              <div class="related-post">
                <div class="related-post-title">
                  <a href="${url}">${d.Title}</a>
                </div>
                <div class="related-post-text">${d.Summary}</div>
              </div>
            `;
          }).join('');

          container.innerHTML = suggestions;
        }
      })
      .catch(err => {
        console.error('Error loading search results:', err);
        container.innerHTML = '<p>Error loading search results.</p>';
      });
  }
}
