import { useEffect, useMemo, useState } from "react";
import { Card, Form, Button, Spinner } from "react-bootstrap";
import finnkinoApi from "../../services/finnkinoService.js";

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function isoDate(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function SidebarShowtimes() {
  const [cities, setCities] = useState([]);
  const [theaters, setTheaters] = useState([]);

  const [city, setCity] = useState("");        // area id
  const [theatreId, setTheatreId] = useState("");
  const [date, setDate] = useState(isoDate());

  const [shows, setShows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // Load cities on mount
  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const data = await finnkinoApi.getCities();
        if (!on) return;
        setCities(data);
        // Autoselect first non-zero area
        const first = data.find(a => a.id && a.id !== 0);
        if (first) setCity(String(first.id));
      } catch (e) {
        if (on) setErr(e?.message || "Failed to load cities");
      }
    })();
    return () => { on = false; };
  }, []);

  // Load theaters when city changes
  useEffect(() => {
    if (!city) { setTheaters([]); setTheatreId(""); return; }
    let on = true;
    (async () => {
      try {
        const data = await finnkinoApi.getTheaters(Number(city));
        if (!on) return;
        setTheaters(data);
        setTheatreId(""); // reset theatre on city change
      } catch (e) {
        if (on) setErr(e?.message || "Failed to load theaters");
      }
    })();
    return () => { on = false; };
  }, [city]);

  // Load showtimes when filters change
  useEffect(() => {
    if (!city && !theatreId) return;
    let on = true;
    (async () => {
      setBusy(true); setErr("");
      try {
        const data = await finnkinoApi.getShowtimes({
          area: Number(city || 0) || undefined,
          theatreId: theatreId ? Number(theatreId) : undefined,
          date,
        });
        if (on) setShows(data);
      } catch (e) {
        if (on) setErr(e?.message || "Failed to load showtimes");
      } finally {
        if (on) setBusy(false);
      }
    })();
    return () => { on = false; };
  }, [city, theatreId, date]);

  const list = useMemo(() => {
    if (!shows.length) return <div className="text-muted">No showtimes.</div>;
    return (
      <div className="d-grid gap-2">
        {shows.map(s => {
          const href = s.id ? `https://www.finnkino.fi/websales/show/${s.id}/` : (s.eventUrl || "#");
          return (
            <div key={s.id} className="pb-2 border-bottom">
              <div className="fw-semibold">{s.title} — {s.theatre}</div>
              <div className="text-muted small">
                {formatTime(s.start)}{s.auditorium ? ` — ${s.auditorium}` : ""}{s.price ? ` — ${s.price}` : ""}
              </div>
              <div className="mt-2">
                <Button size="sm" className="rounded-pill" href={href} target="_blank" rel="noreferrer">
                  Book
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [shows]);

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title className="h6">Finnkino Showtimes & Filters</Card.Title>

        <Form.Group className="mb-2">
          <Form.Label className="small">Select city</Form.Label>
          <Form.Select value={city} onChange={(e)=>setCity(e.target.value)}>
            <option value="" disabled>Select city</option>
            {cities.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label className="small">Select theater (optional)</Form.Label>
          <Form.Select value={theatreId} onChange={(e)=>setTheatreId(e.target.value)} disabled={!theaters.length}>
            <option value="">All theaters in city</option>
            {theaters.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label className="small">Date</Form.Label>
          <Form.Control type="date" value={date} onChange={(e)=>setDate(e.target.value)} />
        </Form.Group>

        <div className="fw-semibold mb-2">Today’s showtimes</div>

        {busy ? (
          <div className="py-2">
            <Spinner animation="border" size="sm" /> <span className="ms-2">Loading…</span>
          </div>
        ) : err ? (
          <div className="text-danger small">{err}</div>
        ) : (
          list
        )}
      </Card.Body>
    </Card>
  );
}
/* import { Card, Form, ListGroup, Button } from 'react-bootstrap'

// Placeholder – kutsutaan myöhemmin Finnkino-backendiin controllerin kautta
export default function SidebarShowtimes() {
  return (
    <Card className="mb-3">
      <Card.Header>Finnkino Showtimes & Filters</Card.Header>
      <Card.Body className="d-grid gap-3">
        <Form.Select><option>Select city</option></Form.Select>
        <Form.Select><option>Select theater</option></Form.Select>
        <Form.Control type="date" />
        <div>
          <div className="fw-semibold mb-2">Today’s showtimes</div>
          <ListGroup variant="flush">
            <ListGroup.Item className="small">Dune Part Two — Tennispalatsi — 18:30 — €12.50 — <Button size="sm">Book</Button></ListGroup.Item>
            <ListGroup.Item className="small">Oppenheimer — Kinopalatsi — 20:00 — €14.00 — <Button size="sm">Book</Button></ListGroup.Item>
            <ListGroup.Item className="small">Barbie — Sello — 19:15 — €11.50 — <Button size="sm">Book</Button></ListGroup.Item>
          </ListGroup>
        </div>
      </Card.Body>
    </Card>
  )
}
 */