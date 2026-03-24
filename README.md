# Spontana AI Chat

A lightweight AI chat application where users can submit prompts, view AI responses, save chat history, and see token usage in the UI. Built as a frontend assessment project with a clean, minimal interface.

## Features

- Prompt input + submit
- AI responses rendered in a readable format
- Chat history saved in localStorage
- Loading and error states
- Token usage display
- Clear chat history

## Tech Stack

- React + TypeScript (Vite)
- Tailwind CSS
- OpenRouter API

## Getting Started

### 1. Install dependencies

```base
  npm install
```

### 2. Add environment variables

Create a .env file in the project root:

```bash
VITE_OPENROUTER_API_KEY=your_key_here
VITE_OPENROUTER_MODEL=arcee-ai/trinity-mini:free
```

### 3. Run the app

```bash
  npm run dev
```

## Usage

- Type a prompt in the input box and click Send
- AI responses appear in the chat window
- Token usage appears near the top of the chat panel.
- Click Clear to reset chat history
