import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { googleProvider } from "../firebase/firebaseConfig";

export const createGoogleCalendarEvent = async (
  title: string,
  description: string,
  startDateTime: string,
  endDateTime: string
): Promise<{ id: string; htmlLink: string }> => {
  const auth = getAuth();
  if (!auth.currentUser) {
    throw new Error("User must be logged in to sync to calendar.");
  }

  try {
    // Re-authenticate to ensure we have a fresh Google access token with calendar scope
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;

    if (!accessToken) {
      throw new Error("Could not retrieve Google access token.");
    }

    const event = {
      summary: title,
      description: description,
      start: {
        dateTime: new Date(startDateTime).toISOString(),
        timeZone: "Asia/Kuala_Lumpur",
      },
      end: {
        dateTime: new Date(endDateTime).toISOString(),
        timeZone: "Asia/Kuala_Lumpur",
      },
    };

    const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to create Google Calendar event.");
    }

    const data = await response.json();
    return {
      id: data.id,
      htmlLink: data.htmlLink,
    };
  } catch (error: any) {
    console.error("Google Calendar API Error:", error);
    throw new Error(error.message || "Failed to sync with Google Calendar.");
  }
};
