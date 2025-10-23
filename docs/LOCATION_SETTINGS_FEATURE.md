# Location Settings Feature

## Overview
New multi-location management feature that allows users to add and manage multiple work locations, with one designated as primary.

## File Created
`src/app/settings/profile/location.tsx`

## Features

### ✅ Multiple Locations
- Users can add multiple locations where they work
- Each location includes: Province, Municipality, and optional Address
- First location added is automatically set as primary

### ✅ Primary Location
- One location must always be marked as primary
- Primary location is displayed in the format: `"Municipality, Province"` (e.g., "Roma, Lazio")
- This is shown on the user's profile page
- Users can change which location is primary

### ✅ Location Management
- **Add**: Click "Add locations" button to add new locations
- **Edit**: Click on any location card or the pen icon to modify details
- **Remove**: Click trash icon to delete a location (cannot delete primary if it's the only one)
- **Set as Primary**: Non-primary locations have a "Set as primary" button

### ✅ UI/UX Features
- **Unsaved Changes Warning**: Shows modal if user tries to leave without saving
- **Province/Municipality Selector**: Similar UI to registration step-5
  - Popular cities shown first with images
  - Search functionality for both provinces and municipalities
  - Two-step selection (Province → Municipality)
- **Validation**: Ensures at least one location exists and all fields are complete
- **Loading States**: Shows spinners during data fetching and saving

## Database Integration

### Tables Used
- `user_locations`: Stores all user locations
- `provinces`: Reference table for provinces
- `municipalities`: Reference table for municipalities

### Data Structure
```typescript
type LocationItem = {
  id: string;
  provinceId: string;
  provinceName: string;
  municipalityId: string;
  municipalityName: string;
  address?: string;
  isPrimary: boolean;
};
```

## How It Works

### 1. Loading Locations
- Fetches all user locations on mount
- Joins with provinces and municipalities tables to get names
- Orders by `isPrimary` DESC (primary location first)

### 2. Editing Location
- Opens a modal with the same Province/Municipality selector from registration
- Supports:
  - Selecting province from popular cities or full list
  - Selecting municipality from province
  - Adding optional address
- Shows selected province with image preview when selecting municipality

### 3. Saving Changes
- Validates that at least one location exists
- Validates all locations have complete data
- Ensures one location is marked as primary
- Deletes removed locations from database
- Updates existing locations
- Inserts new locations with UUIDs
- Clears profile cache to force refresh

## UI Components

### Location Card
Shows:
- Location icon + "Municipality, Province" text
- Optional address below
- "Displayed as..." badge for primary location
- Edit and Delete buttons
- "Set as primary" button for non-primary locations

### Location Edit Modal
- Header with close button
- Main view:
  - Province/Municipality selector (tap to open)
  - Address input (optional)
  - Save button
- Province/Municipality selection view:
  - Search bar
  - Popular cities grid (6 items with images)
  - Full list of provinces/municipalities
  - Back and Next navigation

## Integration Points

### 1. Profile Display
`src/app/(tabs)/profile.tsx` shows primary location:
```typescript
municipality={data?.location?.municipality?.name}
province={data?.location?.province?.name}
```

### 2. Profile Service
`src/services/profile.service.ts` fetches primary location:
```typescript
location?: {
  id: string;
  address?: string;
  province: { id, name, code };
  municipality: { id, name };
  isPrimary: boolean;
};
```

### 3. Settings Navigation
`src/app/settings/profile/index.tsx` has navigation:
```typescript
router.push("/settings/profile/location" as any);
```

## User Flow

1. User taps "Dove ti trovi" in profile settings
2. Sees list of current locations (or empty state)
3. Can:
   - **Add** new location via "Add locations" button
   - **Edit** any location by tapping it or the pen icon
   - **Delete** non-primary locations
   - **Set primary** for any non-primary location
4. Changes are tracked
5. If user hits back without saving → shows warning modal
6. When user saves → validates, updates database, clears cache, goes back
7. Profile screen now shows updated primary location

## Design Reference

Based on Figma designs:
- Multilocations screen with primary/other locations sections
- Province selection with popular cities and search
- Municipality selection with province header and search

## Empty State

When no locations exist:
- Shows location icon
- "No locations added yet" message
- Helpful description: "Add cities where you work to help clients find you"
- "Add locations" button

## Validation Rules

1. ✅ At least one location must exist
2. ✅ All locations must have province and municipality selected
3. ✅ One and only one location must be marked as primary
4. ✅ Address is optional

## Cache Management

After saving locations:
```typescript
await clearProfileCache(user.id);
```

This ensures the profile page reloads with fresh data showing the updated primary location.

## Error Handling

- Shows toast errors for:
  - Failed to load locations
  - Failed to save locations
  - Validation errors (missing data)
- Gracefully handles:
  - Network errors
  - Database errors
  - Missing data

## Future Enhancements

Potential improvements:
- Drag to reorder locations
- Location-based search radius
- Map view for location selection
- Bulk import from Google Maps
- Location-based notifications for nearby clients

