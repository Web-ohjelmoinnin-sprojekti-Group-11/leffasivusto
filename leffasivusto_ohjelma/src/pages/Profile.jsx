import { useMemo, useState } from "react";
import { Row, Col, Card, Tab, Tabs } from "react-bootstrap";
import { useAuth } from "../state/AuthContext.jsx";
import Favorites from "../components/profile/Favorites.jsx";
import Reviews from "../components/profile/Reviews.jsx";
import History from "../components/profile/History.jsx";
import WatchLater from "../components/profile/WatchLater.jsx"
import UpdateProfileForm from "../components/profile/UpdateProfileForm.jsx";
import ChangePasswordForm from "../components/profile/ChangePasswordForm.jsx";
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

export default function Profile() {
  const { user } = useAuth();
  const [tab, setTab] = useState("favorites");

  const content = useMemo(() => {
    if (tab === "favorites") return <Favorites />;
    if (tab === "reviews") return <Reviews />;
    if (tab === "history") return <History />;
    if (tab === "watchlater") return <WatchLater />;
    return (
      <Row xs={1} md={2} className="g-3">
        <Col><UpdateProfileForm /></Col>
        <Col><ChangePasswordForm /></Col>
      </Row>
    );
  }, [tab]);

  return (
    <>
      <ProfileHeader user={user} />
      <Tabs activeKey={tab} onSelect={(k)=>setTab(k)} className="mb-3" justify>
        <Tab eventKey="favorites" title="Favorites" />
        <Tab eventKey="reviews"   title="Reviews" />
        <Tab eventKey="history"   title="Recently Watched" />
        <Tab eventKey="watchlater" title="Watch Later" />
        <Tab eventKey="settings"  title="Settings" />
      </Tabs>
      {content}
    </>
  );
}