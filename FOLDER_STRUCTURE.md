
# EASTUDIO Project Structure

This document provides an overview of the folder and file structure for your EASTUDIO application.

```
.
├── /docs/
│   ├── backend.json        # Defines data models and Firestore structure.
│   └── FOLDER_STRUCTURE.md # This file.
├── /public/                # Static assets (images, fonts, etc.).
├── /src/
│   ├── /ai/
│   │   ├── /flows/         # Contains all Genkit AI flows for specific tasks.
│   │   ├── /tools/         # Reusable tools for AI flows (e.g., API lookups).
│   │   ├── dev.ts          # Development entry point for running Genkit flows locally.
│   │   └── genkit.ts       # Core Genkit AI configuration and initialization.
│   │
│   ├── /app/
│   │   ├── (dashboard)/    # Main application pages requiring authentication.
│   │   │   ├── /dashboard/ # Main dashboard page.
│   │   │   ├── /admin/     # Admin panel for user and site management.
│   │   │   ├── /ea-analyse/ # "EA Analyse & Describe" tool page.
│   │   │   ├── /ea-valuation/ # "EA Valuation" tool page.
│   │   │   ├── /ea-image-pro/ # "EA Image Pro" tool page.
│   │   │   ├── /ea-floor-plan-maestro/ # "EA Floor Plan Pro" tool page.
│   │   │   ├── /ea-360/      # "EA 360" tool page.
│   │   │   ├── /socials/   # "Socials Suite" tool page.
│   │   │   ├── /profile/   # User profile page.
│   │   │   └── ...
│   │   ├── (public)/       # Public-facing pages.
│   │   │   ├── /features/  # Detailed features page.
│   │   │   ├── /pricing/   # Pricing and plans page.
│   │   │   └── page.tsx    # Homepage.
│   │   ├── (auth)/         # Authentication pages.
│   │   │   ├── /login/     # Sign-in page.
│   │   │   ├── /signup/    # Sign-up page.
│   │   │   └── /forgot-password/ # Password reset page.
│   │   ├── globals.css     # Global application styles.
│   │   └── layout.tsx      # Root layout for the entire application.
│   │
│   ├── /components/
│   │   ├── /ui/            # Reusable UI components from ShadCN.
│   │   ├── /dashboard/     # Components specific to the main dashboard.
│   │   ├── /mocks/         # Mock UI components for visual representation.
│   │   ├── app-layout.tsx  # Layout for authenticated app pages.
│   │   ├── header.tsx      # Main application header.
│   │   ├── HeaderHome.tsx  # Header for the homepage.
│   │   ├── Footer.tsx      # Application footer.
│   │   └── ...             # Other shared components.
│   │
│   ├── /context/
│   │   ├── AuthContext.tsx # Manages user authentication state globally.
│   │   └── ...             # Other global state providers.
│   │
│   ├── /firebase/
│   │   ├── /firestore/     # Hooks for interacting with Firestore.
│   │   ├── config.ts       # Firebase project configuration.
│   │   ├── provider.tsx    # Core Firebase context provider.
│   │   ├── errors.ts       # Custom Firebase error types.
│   │   └── index.ts        # Barrel file for exporting Firebase utilities.
│   │
│   ├── /hooks/
│   │   ├── use-toast.ts    # Hook for displaying toast notifications.
│   │   └── ...
│   │
│   └── /lib/
│       ├── utils.ts        # Utility functions (e.g., `cn` for classnames).
│       ├── firebase.ts     # Firebase service initialization.
│       └── ...
│
├── .env                    # Environment variables (API keys, etc.).
├── firebase.json           # Firebase emulator configuration.
├── firestore.rules         # Security rules for your Firestore database.
├── storage.rules           # Security rules for Firebase Storage.
├── next.config.ts          # Next.js configuration file.
├── package.json            # Project dependencies and scripts.
└── tailwind.config.ts      # Tailwind CSS configuration.
```

## Key Folders

-   **`/src/app`**: This is the heart of your Next.js application, using the App Router. Sub-folders inside parentheses `()` are Route Groups, which organize your pages without affecting the URL structure.
-   **`/src/components`**: Contains all your reusable React components. The `/ui` sub-folder holds the components provided by ShadCN.
-   **`/src/ai`**: This directory contains all the server-side logic for interacting with generative AI models using Genkit.
-   **`/src/firebase`**: All Firebase-related code, including configuration, context providers, and custom hooks, is located here.
-   **`/docs`**: Contains non-code documentation, including the `backend.json` file which is a blueprint of your data structure.
