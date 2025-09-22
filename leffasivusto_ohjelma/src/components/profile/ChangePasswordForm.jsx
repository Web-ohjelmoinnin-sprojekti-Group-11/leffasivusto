import { useState } from "react";
import { Card, Form, Button, Alert } from "react-bootstrap";
import { profileApi } from "../../services/profileService.js";

export default function ChangePasswordForm() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [busy, setBusy] = useState(false); const [ok, setOk] = useState(""); const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault(); setOk(""); setErr("");
    if (form.newPassword !== form.confirm) return setErr("New password and confirmation do not match.");
    if (form.newPassword.length < 8) return setErr("New password must be at least 8 characters.");
    setBusy(true);
    try {
      await profileApi.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setOk("Password changed!");
      setForm({ currentPassword:"", newPassword:"", confirm:"" });
    } catch (e2) { setErr(e2?.message || "Password change failed"); }
    finally { setBusy(false); }
  };

  return (
    <Card>
      <Card.Body>
        <Card.Title className="h6 mb-3">Change Password</Card.Title>
        {ok && <Alert variant="success">{ok}</Alert>}
        {err && <Alert variant="danger">{err}</Alert>}
        <Form onSubmit={onSubmit} autoComplete="off">
          <Form.Group className="mb-3">
            <Form.Label>Current password</Form.Label>
            <Form.Control
              type="password"
              value={form.currentPassword}
              onChange={(e)=>setForm(f=>({...f, currentPassword:e.target.value}))}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>New password</Form.Label>
            <Form.Control
              type="password"
              minLength={8}
              value={form.newPassword}
              onChange={(e)=>setForm(f=>({...f, newPassword:e.target.value}))}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Confirm new password</Form.Label>
            <Form.Control
              type="password"
              minLength={8}
              value={form.confirm}
              onChange={(e)=>setForm(f=>({...f, confirm:e.target.value}))}
              required
            />
          </Form.Group>
          <div className="d-flex justify-content-end">
            <Button type="submit" disabled={busy}>
              {busy ? "Changing…" : "Change password"}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}