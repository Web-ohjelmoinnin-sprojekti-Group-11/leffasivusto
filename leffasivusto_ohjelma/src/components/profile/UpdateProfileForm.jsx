import { useEffect, useState } from "react";
import { Card, Form, Button, Alert } from "react-bootstrap";
import { useAuth } from "../../state/AuthContext.jsx";
import { profileApi } from "../../services/profileService.js";

export default function UpdateProfileForm() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: "", email: "" });
  const [busy, setBusy] = useState(false); const [ok, setOk] = useState(""); const [err, setErr] = useState("");

  useEffect(() => {
    setForm({ name: user?.name ?? user?.username ?? "", email: user?.email ?? "" });
  }, [user]);

  const onSubmit = async (e) => {
    e.preventDefault(); setBusy(true); setOk(""); setErr("");
    try {
      const updated = await profileApi.updateProfile(form);
      setOk("Profile updated!");
      setUser?.({ ...(updated?.user ?? user ?? {}), ...form }); // WHY: keep UI in sync
    } catch (e2) { setErr(e2?.message || "Update failed"); }
    finally { setBusy(false); }
  };

  return (
    <Card>
      <Card.Body>
        <Card.Title className="h6 mb-3">Profile</Card.Title>
        {ok && <Alert variant="success">{ok}</Alert>}
        {err && <Alert variant="danger">{err}</Alert>}
        <Form onSubmit={onSubmit} autoComplete="on">
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              name="name"
              value={form.name}
              maxLength={60}
              onChange={(e)=>setForm(f=>({...f, name:e.target.value}))}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={form.email}
              onChange={(e)=>setForm(f=>({...f, email:e.target.value}))}
              required
            />
          </Form.Group>
          <div className="d-flex justify-content-end">
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}
