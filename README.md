# Boston Merrimack Wanderer

This is a Next.js 15 application built with React, Tailwind CSS, ShadCN UI, and Google Genkit for AI-powered trip planning.

## Local Development Setup

To run this project on your local computer, follow these steps:

### 1. Prerequisites
- **Node.js**: Ensure you have Node.js v18 or later installed.
- **npm**: Comes with Node.js.

### 2. Download and Extract
1. Click the **Download** button in the Firebase Studio header to export the project.
2. Extract the ZIP file into a folder on your computer.
3. Open the folder in your terminal or IDE (e.g., VS Code).

### 3. Install Dependencies
Run the following command to install all required packages:
```bash
npm install
```

### 4. Configure Environment Variables
Create a file named `.env.local` in the root directory and add your Gemini API key:
```env
GEMINI_API_KEY=AIzaSyCD2fBooXpBz-HrQedAVwaRlJR1ytugCnA
```

### 5. Run the Development Server
Start the local server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

### 6. AI Features (Genkit)
The application uses Genkit for itinerary optimization and food scouting. Locally, it will use the API key provided in your `.env.local` file. 

To explore Genkit's developer UI locally, you can run:
```bash
npx genkit start -- tsx src/ai/dev.ts
```

## Deployment
This project is configured for **Firebase App Hosting**. When you are ready to deploy, you can connect your GitHub repository to a Firebase App Hosting backend via the Firebase Console.
