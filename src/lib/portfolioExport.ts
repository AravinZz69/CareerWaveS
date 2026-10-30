import { PortfolioData } from '../components/portfolio/PublicPortfolioView';

export function generateStandalonePortfolioHtml(data: PortfolioData): string {
  const isTerminal = data.theme === 'terminal-dark';
  const isEditorial = data.theme === 'minimal-editorial';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.profile.name} - ${data.profile.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600;700&family=Playfair+Display:ital,wght@0,600;0,800;1,400&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ${isTerminal ? "'Fira Code', monospace" : isEditorial ? "'Playfair Display', Georgia, serif" : "'Poppins', sans-serif"};
      background-color: ${isTerminal ? '#0D1117' : isEditorial ? '#FDFBF7' : '#FAF8FF'};
      color: ${isTerminal ? '#C9D1D9' : isEditorial ? '#1F2937' : '#1E293B'};
      line-height: 1.6;
      padding: 2rem 1rem;
    }
    .container {
      max-width: ${isEditorial ? '780px' : '900px'};
      margin: 0 auto;
    }
    .card {
      background: ${isTerminal ? '#161B22' : '#FFFFFF'};
      border: 1px solid ${isTerminal ? '#30363D' : isEditorial ? '#E5E7EB' : '#F1EDFF'};
      border-radius: ${isTerminal ? '12px' : isEditorial ? '4px' : '20px'};
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: ${isTerminal ? 'none' : isEditorial ? 'none' : '0 10px 25px -5px rgba(108, 60, 225, 0.05)'};
    }
    h1 {
      font-size: 2.25rem;
      color: ${isTerminal ? '#FFFFFF' : isEditorial ? '#111827' : '#0F172A'};
      margin-bottom: 0.5rem;
    }
    .subtitle {
      color: ${isTerminal ? '#10B981' : isEditorial ? '#4B5563' : '#6C3CE1'};
      font-weight: 600;
      margin-bottom: 1rem;
    }
    .bio {
      font-family: ${isEditorial ? "'Poppins', sans-serif" : 'inherit'};
      font-size: 0.95rem;
      color: ${isTerminal ? '#8B949E' : '#475569'};
      margin-bottom: 1.5rem;
    }
    .btn {
      display: inline-block;
      padding: 0.6rem 1.25rem;
      background: ${isTerminal ? '#238636' : isEditorial ? '#111827' : '#6C3CE1'};
      color: #FFFFFF;
      text-decoration: none;
      border-radius: ${isTerminal ? '6px' : isEditorial ? '2px' : '10px'};
      font-size: 0.85rem;
      font-weight: 600;
      margin-right: 0.5rem;
      margin-bottom: 0.5rem;
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.65rem;
      background: ${isTerminal ? '#21262D' : isEditorial ? '#F3F4F6' : '#F4F0FF'};
      color: ${isTerminal ? '#58A6FF' : isEditorial ? '#374151' : '#6C3CE1'};
      border-radius: 6px;
      font-size: 0.75rem;
      margin-right: 0.4rem;
      margin-bottom: 0.4rem;
    }
    .section-title {
      font-size: 1.25rem;
      margin: 1.5rem 0 1rem 0;
      color: ${isTerminal ? '#58A6FF' : isEditorial ? '#111827' : '#6C3CE1'};
    }
    .project-card {
      border: 1px solid ${isTerminal ? '#21262D' : '#F1F5F9'};
      padding: 1.25rem;
      border-radius: 12px;
      margin-bottom: 1rem;
      background: ${isTerminal ? '#0D1117' : '#FFFFFF'};
    }
    .project-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 0.5rem;
    }
    .footer {
      text-align: center;
      font-size: 0.8rem;
      color: #94A3B8;
      margin-top: 3rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>${data.profile.name}</h1>
      <div class="subtitle">${data.profile.title}</div>
      <p class="bio">${data.profile.bio}</p>
      <div>
        <a class="btn" href="mailto:${data.profile.email}">Email Alex</a>
        ${data.profile.github ? `<a class="btn" href="${data.profile.github}" target="_blank">GitHub</a>` : ''}
        ${data.profile.linkedin ? `<a class="btn" href="${data.profile.linkedin}" target="_blank">LinkedIn</a>` : ''}
      </div>
    </div>

    <div class="card">
      <h2 class="section-title">Technical Proficiency</h2>
      ${data.skills.map(s => `
        <div style="margin-bottom: 1rem;">
          <strong style="display:block; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 0.25rem; color: #94A3B8;">${s.category}</strong>
          ${s.items.map(i => `<span class="badge">${i}</span>`).join('')}
        </div>
      `).join('')}
    </div>

    <div class="card">
      <h2 class="section-title">Selected Projects</h2>
      ${data.projects.map(p => `
        <div class="project-card">
          <div class="project-header">
            <strong>${p.title}</strong>
            ${p.metric ? `<span class="badge">${p.metric}</span>` : ''}
          </div>
          <p style="font-size: 0.9rem; margin-bottom: 0.75rem;">${p.description}</p>
          <div>
            ${p.tags.map(t => `<span class="badge">#${t}</span>`).join('')}
          </div>
          <div style="margin-top: 0.75rem; font-size: 0.85rem;">
            ${p.githubUrl ? `<a href="${p.githubUrl}" style="color: ${isTerminal ? '#58A6FF' : '#6C3CE1'}; margin-right: 1rem;">View Source</a>` : ''}
            ${p.liveUrl ? `<a href="${p.liveUrl}" style="color: ${isTerminal ? '#10B981' : '#6C3CE1'}; font-weight: bold;">Live Demo →</a>` : ''}
          </div>
        </div>
      `).join('')}
    </div>

    <div class="footer">
      Generated with CareerWave AI Portfolio Studio • Self-contained offline HTML
    </div>
  </div>
</body>
</html>`;
}
