# React Query Integration Guide

This document describes the React Query integration for the Sitemendr frontend.

## Overview

React Query (TanStack Query) provides:
- **Automatic caching** - Data is cached and reused
- **Background updates** - Stale data is refetched in background
- **Loading states** - Built-in loading indicators
- **Error handling** - Consistent error states
- **Optimistic updates** - Update UI before server confirms

## Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. QueryProvider

The app is wrapped with QueryProvider in `src/app/layout.tsx`:

```tsx
import QueryProvider from '@/lib/query-provider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
```

## Using React Query Hooks

### Fetching Data

```tsx
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';

function MyComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['myData'],
    queryFn: () => fetchApi('/api/data'),
  });

  if (isLoading) return <Loading />;
  if (error) return <Error />;
  
  return <div>{data}</div>;
}
```

### Using Pre-built Hooks

We provide custom hooks in `src/hooks/use-api.ts`:

```tsx
import { 
  useCurrentUser,
  useSubscriptions, 
  useAssessments,
  useCreateAssessment 
} from '@/hooks/use-api';

// Fetch user's subscriptions
const { data: subscriptions } = useSubscriptions();

// Fetch assessments
const { data: assessments } = useAssessments();

// Create new assessment (mutation)
const mutation = useCreateAssessment();
mutation.mutate({ 
  businessName: 'My Business', 
  businessType: 'ecommerce' 
});
```

## Available Hooks

### Authentication
- `useLogin()` - Login mutation
- `useLogout()` - Logout mutation
- `useCurrentUser()` - Get current user

### Subscriptions
- `useSubscriptions()` - Get user's subscriptions
- `useSubscription(id)` - Get subscription by ID
- `useCreateSubscription()` - Create subscription mutation

### Assessments
- `useAssessments()` - Get user's assessments
- `useAssessment(id)` - Get assessment by ID (with auto-polling)
- `useCreateAssessment()` - Submit assessment mutation

### Support
- `useSupportTickets()` - Get user's tickets
- `useCreateTicket()` - Create ticket mutation

### Blog
- `useBlogPosts()` - Get all blog posts
- `useBlogPost(slug)` - Get post by slug

## Example: Dashboard Component

See `src/components/DashboardOverview.tsx` for a complete example.

```tsx
'use client';

import { useSubscriptions, useAssessments, useCurrentUser } from '@/hooks/use-api';
import { Loader2 } from 'lucide-react';

export function Dashboard() {
  const { data: user } = useCurrentUser();
  const { data: subscriptions, isLoading } = useSubscriptions();
  
  if (isLoading) {
    return <Loader2 className="animate-spin" />;
  }
  
  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      <p>You have {subscriptions?.length} subscriptions</p>
    </div>
  );
}
```

## Mutation Example

```tsx
import { useCreateAssessment } from '@/hooks/use-api';

function AssessmentForm() {
  const createAssessment = useCreateAssessment();
  
  const handleSubmit = (data) => {
    createAssessment.mutate(data, {
      onSuccess: () => {
        // Show success message
        toast.success('Assessment submitted!');
      },
      onError: (error) => {
        toast.error(error.message);
      }
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}
```

## Configuration

Edit `src/lib/query-provider.tsx` to customize:

- `staleTime` - How long data is considered fresh
- `cacheTime` - How long unused data stays in cache
- `retry` - Number of retry attempts on failure
- `refetchOnWindowFocus` - Refetch when window gains focus

## Migration from useEffect

### Before (useEffect)

```tsx
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch('/api/data')
    .then(res => res.json())
    .then(setData)
    .finally(() => setLoading(false));
}, []);
```

### After (React Query)

```tsx
const { data, isLoading } = useQuery({
  queryKey: ['myData'],
  queryFn: () => fetch('/api/data').then(res => res.json()),
});
```

Benefits:
- Automatic deduplication
- Caching
- Error handling
- Loading states
- Refetch on interval (optional)
