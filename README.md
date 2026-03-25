# Easy Profile

A lightweight personal profile template system using HTML, CSS, JS, and Markdown/YML files. No build tools or package managers required - just serve the files and customize.

## Features

- **No Build Process**: Just serve static files, no npm install or webpack needed
- **CDN Libraries**: Uses marked.js and js-yaml loaded from CDN
- **Configuration-Driven**: All structure and content defined in YAML
- **Markdown Support**: Write content in Markdown with YAML front matter
- **Multi-Page Support**: Create multiple pages with client-side routing
- **Multiple Themes**: 4 distinct themes (light, midnight, ocean, ocean-dark)
- **Skills Progress Bars**: Visual skill levels with animated progress bars
- **Project Detail Pages**: Full project pages with features, challenges, and screenshots
- **Extensible**: Plugin architecture with hooks for custom functionality
- **SEO-Friendly**: Meta tags, Open Graph, and Twitter Card support
- **Responsive**: Mobile-first design with responsive layouts

## Quick Start

### 1. Serve Locally

```bash
# Using Python
python -m http.server 8000

# Using VS Code Live Server extension
# Just right-click index.html and select "Open with Live Server"

# Using Node.js
npx serve

# Using PHP
php -S localhost:8000
```

### 2. Open in Browser

Navigate to `http://localhost:8000` (or your Live Server URL)

### 3. Customize

Edit `config.yml` and the content files in `content/sections/` and `content/pages/`.

## Dependencies

The project uses two CDN-loaded libraries (no installation required):

- **marked.js** (v12.0.0) - Markdown parser
- **js-yaml** (v4.1.0) - YAML parser

Both are loaded from jsDelivr CDN. If you prefer to host them locally:
1. Download the minified files
2. Place them in `assets/js/vendor/`
3. Update the script tags in `index.html`

## Project Structure

```
easy-profile/
├── index.html              # Main entry point
├── config.yml              # Central configuration
├── assets/
│   ├── css/
│   │   ├── core.css       # Core styles and utilities
│   │   ├── theme-default.css  # Light theme (warm ivory)
│   │   ├── theme-midnight.css # Midnight theme (deep purple)
│   │   └── theme-ocean.css    # Ocean theme (teal + ocean-dark)
│   └── js/
│       ├── core/
│       │   ├── app.js     # Main orchestrator
│       │   ├── parser.js  # YAML/Markdown parser
│       │   ├── loader.js  # File loader
│       │   ├── renderer.js # Template engine
│       │   └── router.js  # Client-side routing
│       ├── extensions/
│       │   ├── extension-manager.js
│       │   └── registry.js
│       └── utils/
│           ├── dom.js     # DOM utilities
│           └── markdown.js # Markdown utilities
├── content/
│   ├── sections/          # Reusable content sections
│   │   ├── hero.md
│   │   ├── about.md
│   │   ├── experience.md
│   │   ├── projects.md
│   │   ├── skills.md
│   │   └── blog-posts.md
│   ├── pages/             # Custom pages
│   │   ├── about.md
│   │   ├── projects.md
│   │   ├── contact.md
│   ├── posts/             # Blog posts (Markdown)
│   │   └── hello-world.md
│   └── projects/          # Project detail pages
│       └── project-alpha.md
├── templates/
│   ├── layouts/
│   │   └── main.html      # Main layout template
│   ├── pages/
│   │   ├── post.html      # Blog post template
│   │   └── project.html   # Project detail template
│   └── components/
│       ├── section.html   # Section component
│       ├── timeline.html  # Timeline component
│       ├── gallery.html   # Gallery component
│       ├── hero.html     # Hero banner component
│       └── skills.html   # Skills progress bar component
└── extensions/            # Custom extensions
    ├── analytics.js
    └── reading-time.js
```

## Configuration

### Basic Configuration (config.yml)

```yaml
site:
  title: "Your Name"
  description: "Personal profile and portfolio"
  author: "Your Name"
  lang: "en"
  footer: "© 2026 Your Name. All rights reserved."

social:
  - label: GitHub
    url: https://github.com/yourusername
    icon: "📦"
  - label: LinkedIn
    url: https://linkedin.com/in/yourusername
    icon: "💼"

home:
  title: "Your Name - Personal Profile"
  description: "Welcome to my personal profile"
  sections:
    - about
    - experience
    - projects
    - skills
    - contact

pages:
  /about:
    label: "About"
    title: "About Me"
    content: "content/pages/about.md"
    showInNav: true

  /projects:
    label: "Projects"
    title: "My Projects"
    content: "content/pages/projects.md"
    showInNav: true
```

## Creating Content

### Section with Front Matter

Create a file `content/sections/your-section.md`:

```markdown
---
title: "Section Title"
type: "section"
id: "section-id"
gridColumns: 2
---

# Section Content

Write your **markdown** content here.

items:
  - title: "Item 1"
    description: "Description for item 1"
    tags:
      - "Tag1"
      - "Tag2"
  - title: "Item 2"
    description: "Description for item 2"
    tags:
      - "Tag3"
```

### Section Types

- `section`: Basic section with cards (grid layout)
- `timeline`: Timeline-style section for experience/history
- `gallery`: Image gallery grid
- `hero`: Hero banner for page top
- `skills`: Skills with animated progress bars (supports groups + levels)

### Timeline Section

```markdown
---
title: "Experience"
type: "timeline"
id: "experience"
---

items:
  - date: "2022 - Present"
    title: "Job Title"
    subtitle: "Company"
    description: "Description of role"
    tags:
      - "React"
      - "Node.js"
```

### Skills Section (Progress Bars)

```markdown
---
title: "Skills & Technologies"
type: "skills"
id: "skills"
gridColumns: 3
---

groups:
  - name: "Frontend"
    skills:
      - name: "React"
        level: 90
        tags: ["Hooks", "Server Components"]
      - name: "TypeScript"
        level: 85
        tags: ["Generics", "Utility Types"]
```

Or without groups (flat list):

```markdown
---
type: "skills"
id: "skills"
gridColumns: 3
---

items:
  - name: "React"
    level: 90
    description: "Building responsive UIs"
    tags: ["Hooks", "Server Components"]
```

### Project Detail Pages

Create a file in `content/projects/your-project.md`:

```markdown
---
title: "Project Name"
subtitle: "A short tagline"
date: "2024-01"
status: "completed"  # active | completed | archived
image: ""            # optional hero image URL
tags:
  - "React"
  - "Node.js"
link: "https://project-url.com"
github: "https://github.com/you/project"
---

Your project description in **Markdown**.
```

Then link to it from your projects section:

```markdown
link: "#/projects/your-project"
```

### Page Content

Create a file `content/pages/your-page.md`:

```markdown
# Page Title

Page content in **Markdown** format.

## Section Heading

More content here...
```

## Theming

### CSS Variables

Customize the theme in `assets/css/theme-default.css`:

```css
:root {
    --color-primary: #3498db;
    --color-bg-primary: #ffffff;
    --color-text-primary: #2c3e50;
    /* ... */
}

[data-theme="dark"] {
    --color-bg-primary: #1a1a2e;
    --color-text-primary: #eaeaea;
    /* ... */
}
```

### Custom Theme

Create a new theme file and include it after the default:

```html
<link rel="stylesheet" href="assets/css/theme-default.css">
<link rel="stylesheet" href="assets/css/theme-custom.css">
```

## Extensions

### Creating an Extension

Create a file `extensions/your-extension.js`:

```javascript
return {
    name: 'YourExtension',

    async init() {
        console.log('Extension initialized');

        // Register hooks
        ExtensionManager.on('afterNavigate', ({ to, from }) => {
            console.log(`Navigated to ${to}`);
        });
    },

    async destroy() {
        console.log('Extension destroyed');
    }
};
```

### Registering Extensions

Add to `config.yml`:

```yaml
extensions:
  your-extension:
    enabled: true
    url: "extensions/your-extension.js"
```

### Available Hooks

- `beforeInit` - Before app initialization
- `afterInit` - After app initialization
- `beforeRender` - Before rendering
- `afterRender` - After rendering
- `beforeNavigate` - Before navigation
- `afterNavigate` - After navigation
- `onThemeChange` - When theme changes
- `onError` - On errors

### Custom Section Types

Register custom section types in your extension:

```javascript
ExtensionManager.registerSectionType('custom-type', (config) => {
    return `<div class="custom-section">${config.content}</div>`;
});
```

## API Reference

### Parser

```javascript
// Parse YAML
const config = Parser.parseYAML(yamlString);

// Parse Markdown
const html = Parser.parseMarkdown(markdownString);

// Parse front matter
const { frontMatter, content } = Parser.parseFrontMatter(markdownWithFrontMatter);
```

### Loader

```javascript
// Load file
const content = await Loader.load('path/to/file');

// Load and parse YAML
const config = await Loader.loadYAML('config.yml');

// Load and parse Markdown
const { frontMatter, content } = await Loader.loadMarkdown('content.md');
```

### Renderer

```javascript
// Register template
Renderer.registerTemplate('template-name', templateString);

// Render template
const html = Renderer.render('template-name', context);
```

### Router

```javascript
// Navigate
Router.navigate('/path');

// Get current path
const path = Router.getCurrentPath();

// Get params
const params = Router.getParams();
```

### App

```javascript
// Initialize
await App.init();

// Toggle theme
App.toggleTheme();

// Get config
const config = App.config;
```

## Deployment

### Static Hosting

Copy all files to any static hosting service:

- GitHub Pages
- Netlify
- Vercel
- AWS S3
- Any web server

### No Build Required

The site works without any build process. Just serve the files as-is.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Customization Examples

### Add a New Section

1. Create `content/sections/new-section.md`
2. Add to `config.yml`:

```yaml
home:
  sections:
    - about
    - new-section  # Add reference
```

### Add a New Page

1. Create `content/pages/new-page.md`
2. Add to `config.yml`:

```yaml
pages:
  /new-page:
    label: "New Page"
    title: "New Page"
    content: "content/pages/new-page.md"
    showInNav: true
```

### Customize Styles

Edit `assets/css/core.css` or create a custom stylesheet:

```css
/* Override styles */
.section-title {
    border-bottom-color: var(--color-secondary);
}

.card {
    border-radius: var(--border-radius-xl);
}
```

## Troubleshooting

### Site not loading?

1. Check browser console for errors
2. Ensure you're serving via HTTP (not file://)
3. Verify `config.yml` syntax
4. Check that all referenced files exist

### CORS errors?

Use a local development server, not file:// protocol.

### Styles not applying?

Clear browser cache and hard refresh (Cmd+Shift+R / Ctrl+Shift+F5).

## License

MIT License - feel free to use for personal or commercial projects.

## Contributing

Contributions welcome! Please read the code structure and maintain consistency with existing patterns.
