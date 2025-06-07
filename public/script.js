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

    const documentId = getQueryParam('document');
    const titleSlug = window.location.hash.slice(1);

    const titleEl = document.getElementById('title-section');
    const descEl = document.getElementById('description-section');
    const iframeEl = document.getElementById('iframe-section');
    const suggEl = document.getElementById('suggestion-section');

    if (!documentId || !titleSlug) {
      titleEl.innerHTML = `<p>Error: Missing document ID or title in URL.</p>`;
      throw new Error('Missing document ID or title');
    }

    fetch('https://raw.githubusercontent.com/zie2store/tipirusak/main/public/scrbd.csv')
      .then(response => response.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: function(results) {
            const data = results.data;

            const doc = data.find(d =>
              d.ID.trim() === documentId.trim() &&
              slugify(d.Title) === titleSlug
            );

            if (!doc) {
              titleEl.innerHTML = `<p>Document not found for ID: ${documentId} and title: ${titleSlug}</p>`;
              return;
            }

            document.title = doc.Title;

            const downloadUrl = `https://ilide.info/docgeneratev2?fileurl=https://scribd.vdownloaders.com/pdownload/${doc.ID}/`;
            
            //Set meta description
            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
              metaDescription.setAttribute('content', doc.Summary.slice(0,160));
            }
            
            // Set title
            titleEl.innerHTML = `<h1>${doc.Title}</h1>`;
            
            // Set description
            descEl.innerHTML = `
              <p class="description">
                This document is entitled <strong>${doc.Title}</strong> uploaded by Scribd Download Team.
                It contains ${doc.Pages} pages in a PDF document type. This document with ID ${doc.ID}
                has been downloaded for ${doc.Views} times. The information we can get from
                ${doc.Title} includes ${doc.Summary}.
              </p>
              <a class="download-button" href="${downloadUrl}" target="_blank"> DOWNLOAD <span style="font-size: 20px;">⬇️</span></a>
            `;

            // Set iframe
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

            // Set suggestions
            const otherDocs = data.filter(d => d.ID.trim() !== doc.ID.trim());
            const shuffled = otherDocs.sort(() => 0.5 - Math.random()).slice(0, 10);

            const suggestions = shuffled.map(d => {
              const slug = slugify(d.Title);
              const baseUrl = window.location.origin;
              const url = `${baseUrl}/viewer.html?document=${d.ID}#${slug}`;
              return `
                <div class="related-post">
                <div class="related-post-title">
                  <a href="${url}">
                    ${d.Title}
                  </a></div>
                  <div class="related-post-text">
                    ${d.Summary}
                    <hr class="post-divider">
                  </div>
               </div>
              `;
            }).join('');

            suggEl.innerHTML = `
            <h2>These documents might be related to ${doc.Title}</h2>
          
              ${suggestions}
            `;
          }
        });
      })
      .catch(err => {
        console.error('Failed to load CSV:', err);
        titleEl.innerHTML = `<p>Error loading document data.</p>`;
      });

    document.getElementById('searchForm').addEventListener('submit', function(e) {
      e.preventDefault();
      const input = document.getElementById('searchInput').value.trim();
      if (input) {
        const query = input.toLowerCase().replace(/\s+/g, '-');
        const baseUrl = window.location.origin;
        window.location.href = `${baseUrl}/search.html?query=${query}`;
      }
    });
