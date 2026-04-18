import React, { useEffect, useState } from "react";

const CLIENT_ID = "<YOUR CLIENT ID>"
const API_KEY = "<YOUR API KEY>";

const DISCOVERY_DOC = "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

function GoogleCalendar() {
  const [gapiInited, setGapiInited] = useState(false);
  const [gisInited, setGisInited] = useState(false);
  const [tokenClient, setTokenClient] = useState(null);
  const [events, setEvents] = useState([]);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Load external Google scripts
  useEffect(() => {
    const loadScript = (src, onload) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.defer = true;
      script.onload = onload;
      document.body.appendChild(script);
    };

    loadScript("https://apis.google.com/js/api.js", gapiLoaded);
    loadScript("https://accounts.google.com/gsi/client", gisLoaded);
  }, []);

  /** --- GOOGLE API INITIALIZATION --- **/

  const gapiLoaded = () => {
    window.gapi.load("client", initializeGapiClient);
  };

  const initializeGapiClient = async () => {
    await window.gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: [DISCOVERY_DOC],
    });
    setGapiInited(true);
  };

  const gisLoaded = () => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: "", // Will be defined later
    });
    setTokenClient(client);
    setGisInited(true);
  };

  useEffect(() => {
    if (gapiInited && gisInited) {
      console.log("Google API initialized and ready!");
    }
  }, [gapiInited, gisInited]);

  /** --- AUTHENTICATION HANDLERS --- **/

  const handleAuthClick = () => {
    if (!tokenClient) return;

    tokenClient.callback = async (resp) => {
      if (resp.error !== undefined) {
        console.error(resp);
        return;
      }
      setIsAuthorized(true);
      await listUpcomingEvents();
    };

    if (window.gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: "consent" });
    } else {
      tokenClient.requestAccessToken({ prompt: "" });
    }
  };

  const handleSignoutClick = () => {
    const token = window.gapi.client.getToken();
    if (token !== null) {
      window.google.accounts.oauth2.revoke(token.access_token);
      window.gapi.client.setToken("");
      setIsAuthorized(false);
      setEvents([]);
    }
  };

  /** --- FETCH CALENDAR EVENTS --- **/

  const listUpcomingEvents = async () => {
    try {
      const request = {
        calendarId: "primary",
        timeMin: new Date().toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults: 2,
        orderBy: "startTime",
      };
      const response = await window.gapi.client.calendar.events.list(request);
      const events = response.result.items || [];
      setEvents(events);
    } catch (err) {
      console.error("Error fetching events:", err.message);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Google Calendar API with React</h2>

      {!isAuthorized ? (
        <button onClick={handleAuthClick} disabled={!gapiInited || !gisInited}>
          Authorize
        </button>
      ) : (
        <>
          <button onClick={handleAuthClick}>Refresh Events</button>
          <button onClick={handleSignoutClick} style={{ marginLeft: "10px" }}>
            Sign Out
          </button>
        </>
      )}

      <div style={{ marginTop: "20px", whiteSpace: "pre-wrap" }}>
        {events.length === 0 ? (
          <p>No events found.</p>
        ) : (
          <div>
            <h3>Upcoming Events:</h3>
            <ul>
              {events.map((event, i) => (
                <li key={i}>
                  {event.summary} (
                  {event.start.dateTime || event.start.date})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default GoogleCalendar;
