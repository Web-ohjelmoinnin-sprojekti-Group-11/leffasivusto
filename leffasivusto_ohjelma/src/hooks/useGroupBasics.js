// src/hooks/useGroupBasics.js
import { useState, useEffect, useMemo } from "react";
import api from "../services/api";
import { getToken } from "../services/token";

export default function useGroupBasics(id, navigate) {
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const auth = useMemo(
    () => ({ headers: { Authorization: `Bearer ${getToken()}` } }),
    []
  );

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const g = await api.get(`/groups/${id}`, auth);
        setGroup(g.data.group);
        setMembership(g.data.membership || null);

        try {
          const m = await api.get(`/group_members/${id}`, auth);
          setMembers(m.data.members || []);
        } catch {
          setMembers([]);
        }
      } catch (err) {
        if (err?.response?.status === 403) {
          navigate("/groups");
          return;
        }
        console.error(err);
        setError("Failed to load group");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate, auth]);

  // actions
  const removeMember = async (userId) => {
    try {
      await api.delete(`/group_members/${id}/members/${userId}`, auth);
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    } catch (err) {
      console.error("Failed to remove member:", err);
      setError("Failed to remove member");
    }
  };

  const accept = async (userId) => {
    try {
      await api.post(`/group_members/${id}/requests/${userId}`, { action: "accept" }, auth);
      setMembers((prev) => prev.map((m) => (m.user_id === userId ? { ...m, role: "member" } : m)));
    } catch (err) {
      console.error("Accept failed:", err);
      setError("Failed to accept request");
    }
  };

  const reject = async (userId) => {
    try {
      await api.post(`/group_members/${id}/requests/${userId}`, { action: "reject" }, auth);
      setMembers((prev) => prev.filter((m) => !(m.user_id === userId && m.role === "pending")));
    } catch (err) {
      console.error("Reject failed:", err);
      setError("Failed to reject request");
    }
  };

  const deleteGroup = async () => {
    if (!group) return;
    if (!window.confirm(`Delete group "${group.group_name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/groups/${id}`, auth);
      navigate("/groups");
    } catch (err) {
      console.error("Group delete error:", err);
      setError("Failed to delete group");
    }
  };

  const leaveGroup = async () => {
    if (!window.confirm("Leave this group?")) return;
    try {
      await api.delete(`/group_members/${id}/leave`, auth);
      navigate("/groups");
    } catch (err) {
      console.error("Leave group error:", err);
      setError(err?.response?.data?.error || "Failed to leave group");
    }
  };

  return {
    state: { group, members, membership, loading, error },
    actions: { removeMember, accept, reject, deleteGroup, leaveGroup },
  };
}
