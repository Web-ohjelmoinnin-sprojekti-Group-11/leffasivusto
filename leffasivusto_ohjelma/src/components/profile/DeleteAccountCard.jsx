import { useState } from "react";
import { Card, Button, Alert, Modal, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../state/AuthContext.jsx";
import { clearToken } from "../../services/token.js";
import { profileApi } from "../../services/profileService.js";

export default function DeleteAccountCard() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [show, setShow] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const email = user?.email ?? "";

  const onDelete = async () => {
    setErr(""); setOk("");
    if (confirmText.trim() !== email) {
      setErr("Type your email to confirm.");
      return;
    }
    setBusy(true);
    try {
      await profileApi.deleteAccount();   // DELETE /auth/delete
      clearToken();
      setUser?.(null);
      setOk("Your account has been deleted.");
      setShow(false);
      navigate("/");
    } catch (e) {
      setErr(e?.message || "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mt-3">
      <Card.Body>
        <Card.Title className="h6 mb-3">Danger zone</Card.Title>
        {ok && <Alert variant="success">{ok}</Alert>}
        {err && !show && <Alert variant="danger">{err}</Alert>}

        <p className="mb-3">
          Deleting your account will remove <strong>all your data</strong>:
          favorites, reviews & comments, watch later, shared links, group
          memberships, and groups you own. This action is irreversible.
        </p>

        <div className="d-flex justify-content-end">
          <Button
            variant="danger"
            onClick={() => { setErr(""); setConfirmText(""); setShow(true); }}
            disabled={busy}
          >
            {busy ? "Deleting…" : "Delete my account"}
          </Button>
        </div>

        <Modal show={show} onHide={() => setShow(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Are you sure?</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="mb-2">
              This will permanently delete your account and all content.
            </p>
            <p className="mb-2">
              To confirm, type your email: <strong>{email}</strong>
            </p>
            <Form.Control
              autoFocus
              value={confirmText}
              onChange={(e)=>setConfirmText(e.target.value)}
              placeholder="your@email.com"
            />
            {err && <Alert className="mt-3" variant="danger">{err}</Alert>}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={()=>setShow(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onDelete} disabled={busy}>
              {busy ? "Deleting…" : "Yes, delete everything"}
            </Button>
          </Modal.Footer>
        </Modal>
      </Card.Body>
    </Card>
  );
}
