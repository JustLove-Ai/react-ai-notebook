# React AI Notebook

A beautiful, interactive Jupyter-style notebook with AI integration and real-time code execution. Inspired by the aesthetic of modern travel sites, featuring stunning gradients, smooth animations, and an intuitive interface.

![React AI Notebook](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38bdf8?style=for-the-badge&logo=tailwindcss)

## ✨ Features

### 🎨 Beautiful UI
- **Stunning Design**: Gradient backgrounds inspired by travel sites
- **Dark/Light Themes**: Seamless theme switching with smooth transitions
- **Framer Motion**: Smooth, delightful animations throughout
- **Responsive**: Works beautifully on all devices

### 💻 Interactive Code Execution
- **Monaco Editor**: Professional code editing experience (VS Code's editor)
- **Multi-Language Support**: JavaScript, TypeScript, Python
- **Instant Results**: See output immediately after running code
- **Syntax Highlighting**: Beautiful code highlighting in both themes

### 🤖 AI Integration
- **Claude Integration**: Get help from Anthropic's Claude AI
- **OpenAI Support**: Alternative GPT-4 integration
- **Code Assistance**: Explain code, debug errors, get suggestions
- **Context-Aware**: AI understands your code context

### 📝 Rich Markdown
- **Markdown Cells**: Document your work beautifully
- **Live Editing**: Edit and preview markdown inline
- **Formatting**: Support for headings, lists, and more

### 💾 Persistent Storage
- **MongoDB**: All notebooks saved to cloud database
- **Auto-Save**: Changes saved automatically
- **Cell Management**: Add, delete, and reorder cells easily

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB)
- API keys (optional, for AI features):
  - Anthropic API key
  - OpenAI API key

### Installation

1. **Clone and install:**
   ```bash
   cd react-ai-notebook
   npm install
   ```

2. **Set up environment variables** in `.env`:
   ```env
   DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/react-ai-notebook?retryWrites=true&w=majority"

   # Optional - For AI features
   ANTHROPIC_API_KEY="your-anthropic-key"
   OPENAI_API_KEY="your-openai-key"
   ```

3. **Initialize database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Open browser:** Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 15 with App Router |
| **Language** | TypeScript 5.x |
| **Styling** | TailwindCSS 4.x |
| **UI Components** | shadcn/ui (Radix-based) |
| **Animations** | Framer Motion |
| **Code Editor** | Monaco Editor |
| **Database** | MongoDB with Prisma ORM |
| **AI** | Anthropic Claude SDK, OpenAI SDK |
| **Theme** | next-themes |
| **Icons** | Lucide React |

## 📖 Usage Guide

### Creating a Notebook
1. Click "Start Creating" on the homepage
2. Or click "New Notebook" on the notebooks page
3. Your notebook is created with one code cell

### Working with Cells

#### Code Cells
- **Edit**: Click in the Monaco editor and start typing
- **Run**: Click the "Run" button or use Shift+Enter
- **Language**: Select JavaScript, TypeScript, or Python from dropdown
- **AI Help**: Click "Ask AI" to get code explanations and suggestions
- **Delete**: Click the trash icon to remove the cell

#### Markdown Cells
- **Edit**: Click "Edit" button to enter edit mode
- **Preview**: Click "Save" to see rendered markdown
- **Format**: Use markdown syntax (# for headings, - for lists, etc.)
- **Delete**: Click the trash icon to remove the cell

### AI Assistance
1. Write code in a code cell
2. Click "Ask AI" button
3. Get instant explanations, improvements, and debugging help
4. Choose between Claude and GPT-4 models (in code)

### Code Execution
- **JavaScript/TypeScript**: Runs in sandboxed environment
- **Console Output**: Captured `console.log` statements
- **Errors**: Displayed in output area
- **Return Values**: Automatically displayed

## 📁 Project Structure

```
react-ai-notebook/
├── app/
│   ├── api/
│   │   ├── ai/route.ts           # AI integration endpoint
│   │   └── execute/route.ts      # Code execution endpoint
│   ├── notebooks/
│   │   ├── page.tsx              # Notebooks list page
│   │   └── [id]/page.tsx         # Individual notebook page
│   ├── layout.tsx                # Root layout with theme
│   ├── globals.css               # Global styles
│   └── page.tsx                  # Landing page
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── code-cell.tsx             # Code cell component
│   ├── markdown-cell.tsx         # Markdown cell component
│   ├── notebook-interface.tsx    # Main notebook interface
│   ├── theme-provider.tsx        # Theme provider
│   └── theme-toggle.tsx          # Theme toggle button
├── lib/
│   ├── actions/
│   │   └── notebooks.ts          # Server actions for CRUD
│   ├── prisma.ts                 # Prisma client
│   └── utils.ts                  # Utility functions
├── prisma/
│   └── schema.prisma             # Database schema
└── package.json
```

## 🗄️ Database Schema

```prisma
model Notebook {
  id          String         @id @default(auto()) @map("_id") @db.ObjectId
  title       String
  description String?
  cells       NotebookCell[]
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}

model NotebookCell {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  notebookId String   @db.ObjectId
  notebook   Notebook @relation(fields: [notebookId], references: [id], onDelete: Cascade)
  type       String   // "code" or "markdown"
  content    String
  output     String?
  language   String   @default("javascript")
  order      Int
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

## 🎨 Theming

The app supports both light and dark themes with smooth transitions:

- **Auto-detect**: Respects system preferences
- **Manual toggle**: Click theme button in header
- **Persistent**: Saves preference in localStorage
- **All components**: Every component is theme-aware

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `DATABASE_URL`
   - `ANTHROPIC_API_KEY` (optional)
   - `OPENAI_API_KEY` (optional)
4. Deploy!

### Other Platforms

1. Build the project: `npm run build`
2. Set environment variables
3. Deploy the `.next` folder and `public` folder
4. Ensure MongoDB is accessible

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Generate Prisma client
npx prisma generate

# Push schema changes to DB
npx prisma db push

# Open Prisma Studio (DB GUI)
npx prisma studio
```

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - feel free to use this project for your own purposes.

## 🙏 Acknowledgments

- **Design Inspiration**: Wanderlust travel site
- **Concept**: Jupyter notebooks
- **Editor**: Monaco Editor from VS Code
- **UI**: shadcn/ui for beautiful components
- **AI**: Anthropic Claude and OpenAI
