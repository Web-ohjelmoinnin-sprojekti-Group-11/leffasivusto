// src/components/picker/RandomPickerModal.jsx
import { Modal } from "react-bootstrap";
import RandomPicker from "./RandomPicker";

export default function RandomPickerModal({ show, onHide }) {
  return (
    <Modal show={show} onHide={onHide} centered size="lg" scrollable>
      <Modal.Header closeButton>
        <Modal.Title>Random Movie Picker</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <RandomPicker />
      </Modal.Body>
    </Modal>
  );
}
