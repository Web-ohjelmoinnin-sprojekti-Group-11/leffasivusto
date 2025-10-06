import { useMemo, useState, useEffect } from "react";
import { Row, Col, Card, Tab, Tabs, ListGroup, Spinner, Alert } from "react-bootstrap";
import { useAuth } from "../state/AuthContext.jsx";
import Favorites from "../components/profile/Favorites.jsx";
import Reviews from "../components/profile/Reviews.jsx";
import WatchLater from "../components/profile/WatchLater.jsx";
import UpdateProfileForm from "../components/profile/UpdateProfileForm.jsx";
import ChangePasswordForm from "../components/profile/ChangePasswordForm.jsx";
import DeleteAccountCard from "../components/profile/DeleteAccountCard.jsx";
import api from "../services/api";
import { getToken } from "../services/token";
import "../styles/profile.css";

function ProfileHeader({ user }) {
  const email = user?.email ?? "—";
  const name = user?.name ?? user?.username ?? (email?.split("@")[0] || "User");
  const initial = (name?.[0] || "?").toUpperCase();
  return (
    <Card className="mb-3">
      <Card.Body className="d-flex align-items-center gap-3">
        <div className="cc-avatar">{initial}</div>
        <div>
          <h1 className="h4 mb-0">Hi, {name}</h1>
          <div className="text-muted">{email}</div>
        </div>
      </Card.Body>
    </Card>
  );
}

function MyGroupShowtimes() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await api.get("/showtimes/mine", {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const list = (res.data?.showtimes || []).map((s) => ({
          ...s,
          pretty_time: s.pretty_time || new Date(s.showtime).toLocaleString("fi-FI", {
            day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
          }),
        }));
        setItems(list);
      } catch (e) {
        console.error(e);
        setErr(e?.response?.data?.error || "Failed to fetch showtimes");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Spinner animation="border" />;
  if (err) return <Alert variant="warning" className="my-2">{err}</Alert>;
  if (items.length === 0) return <div className="text-muted">No shared showtimes yet.</div>;

  return (
    <Card>
      <ListGroup variant="flush">
        {items.map((s) => (
          <ListGroup.Item key={s.id} className="d-flex justify-content-between align-items-center">
            <div>
              <strong>{s.title}</strong>
              <div className="small text-muted">
                {s.group_name} • {s.theatre_name} — {s.pretty_time}
              </div>
              {s.added_by && <div className="small text-muted">added by {s.added_by}</div>}
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Card>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const [tab, setTab] = useState("favorites");

  const content = useMemo(() => {
    if (tab === "favorites") return <Favorites />;
    if (tab === "reviews") return <Reviews />;
    if (tab === "watchlater") return <WatchLater />;
    if (tab === "showtimes") return <MyGroupShowtimes />;
    return (
      <Row xs={1} md={2} className="g-3">
        <Col><UpdateProfileForm /></Col>
        <Col>
          <ChangePasswordForm />
          <DeleteAccountCard />
        </Col>
      </Row>
    );
  }, [tab]);

  return (
    <>
      <ProfileHeader user={user} />
      <Tabs activeKey={tab} onSelect={(k)=>setTab(k)} className="mb-3" justify>
        <Tab eventKey="favorites"  title="Favorites" />
        <Tab eventKey="reviews"    title="Reviews" />
        <Tab eventKey="watchlater" title="Watch Later" />
        <Tab eventKey="showtimes"  title="Showtimes" />
        <Tab eventKey="settings"   title="Settings" />
      </Tabs>
      {content}
    </>
  );
}
