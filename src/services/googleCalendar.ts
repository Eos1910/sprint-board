export const createGoogleCalendarEvent = async (
  accessToken: string,
  title: string,
  description: string,
  startDateTime: string,
  endDateTime: string
): Promise<{ id: string; htmlLink: string }> => {
  try {

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

    if (response.status === 401) {
      throw new Error("Calendar permission expired. Please reconnect Google Calendar.");
    }

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
