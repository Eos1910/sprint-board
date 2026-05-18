# Sprint Board

A Jira-style sprint board built with React, TypeScript, Firebase Authentication, Firestore, and Google Calendar API.

## Features
- **Task Management**: Create, edit, and delete tasks.
- **Kanban Board**: Drag and drop tasks between To Do, In Progress, and Done columns.
- **Google Calendar Sync**: Optionally sync new tasks directly to your primary Google Calendar.
- **Dashboard Summary**: Quick overview of task counts and overdue items.
- **Dark Mode**: Fully supported light/dark theme toggle.
- **Search**: Filter tasks by title or assignee.
- **Secure**: User tasks are isolated using Firebase Authentication and Firestore Security Rules.

## Tech Stack
- Frontend: React 19, TypeScript, Vite
- Styling: Tailwind CSS v4
- Backend/Database: Firebase (Authentication, Firestore)
- API: Google Calendar API (via Firebase Auth Provider)

## Screenshots
*(Add your screenshots here)*
- Dashboard View
- Create Task Modal
- Dark Mode View

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- A Firebase Project (with Authentication and Firestore enabled)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/sprint-board.git
   cd sprint-board
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy the example environment file and fill in your Firebase config:
   ```bash
   cp .env.example .env
   ```
   
   *Required Environment Variables:*
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

4. Run the development server:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`.

### Firebase Setup Notes
1. **Authentication**: Enable Google Sign-In in your Firebase Console under Authentication > Sign-in method.
2. **Google Calendar API**: To enable Calendar sync, ensure the "Google Calendar API" is enabled in the Google Cloud Console for the project associated with your Firebase app.
3. **Firestore**: Create a Firestore database.

### Firestore Security Rules
To secure the database so users can only access their own tasks, deploy or paste the following rules in your Firebase Console -> Firestore -> Rules:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/tasks/{taskId} {
      allow read, create, update, delete: if request.auth != null
        && request.auth.uid == userId;
    }
  }
}
```

## Future Improvements
- [ ] Support for multiple boards/projects
- [ ] Bidirectional Google Calendar sync (update/delete events)
- [ ] Team collaboration and role management
- [ ] Task comments and attachments
- [ ] GitHub Issues integration
