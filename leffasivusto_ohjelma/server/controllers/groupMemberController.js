// server/controllers/groupMemberController.js
import {
  getOwnerId,
  hasAnyMembership,
  isMember,
  getRole,
  insertPending,
  acceptPending,
  rejectPending,
  leaveGroup,
  removeMemberByOwner,
  listMembers,
} from "../models/groupMemberModel.js";

/** POST /api/group_members/:groupId/join */
export async function join(req, res) {
  const { groupId } = req.params;
  const userId = req.user.user_id;

  try {
    const exists = await hasAnyMembership({ userId, groupId });
    if (exists) {
      return res.status(400).json({ error: "You are already a member of this group" });
    }
    await insertPending({ userId, groupId });
    return res.json({ message: "Join request sent" });
  } catch (err) {
    console.error("Join request error:", err);
    return res.status(500).json({ error: "Failed to send join request" });
  }
}

/** POST /api/group_members/:groupId/requests/:userId  body: { action: 'accept'|'reject' } */
export async function handleRequest(req, res) {
  const { groupId, userId: memberId } = req.params;
  const ownerId = req.user.user_id;
  const { action } = req.body;

  try {
    const owner = await getOwnerId(groupId);
    if (!owner) return res.status(404).json({ error: "Group not found" });
    if (owner !== ownerId) {
      return res.status(403).json({ error: "Only the owner can manage join requests" });
    }

    if (action === "accept") {
      await acceptPending({ memberId, groupId });
      return res.json({ message: "Request accepted" });
    }
    if (action === "reject") {
      await rejectPending({ memberId, groupId });
      return res.json({ message: "Request rejected" });
    }
    return res.status(400).json({ error: "Invalid action" });
  } catch (err) {
    console.error("Request handle error:", err);
    return res.status(500).json({ error: "Failed to process join request" });
  }
}

/** DELETE /api/group_members/:groupId/leave */
export async function leave(req, res) {
  const { groupId } = req.params;
  const userId = req.user.user_id;

  try {
    const owner = await getOwnerId(groupId);
    if (!owner) return res.status(404).json({ error: "Group not found" });
    if (owner === userId) {
      return res.status(400).json({
        error:
          "The owner cannot leave their own group. Delete the group or transfer ownership.",
      });
    }

    const n = await leaveGroup({ userId, groupId });
    if (!n) return res.status(404).json({ error: "You are not a member of this group" });

    return res.json({ message: "You have left the group" });
  } catch (err) {
    console.error("Leave error:", err);
    return res.status(500).json({ error: "Failed to leave group" });
  }
}

/** DELETE /api/group_members/:groupId/members/:userId */
export async function removeMember(req, res) {
  const { groupId, userId: memberId } = req.params;
  const ownerId = req.user.user_id;

  try {
    const owner = await getOwnerId(groupId);
    if (!owner) return res.status(404).json({ error: "Group not found" });
    if (owner !== ownerId) {
      return res.status(403).json({ error: "Only the owner can remove members" });
    }

    await removeMemberByOwner({ memberId, groupId });
    return res.json({ message: "Member removed" });
  } catch (err) {
    console.error("Remove member error:", err);
    return res.status(500).json({ error: "Failed to remove member" });
  }
}

/** GET /api/group_members/:groupId */
export async function list(req, res) {
  const { groupId } = req.params;
  const requesterId = req.user.user_id;

  try {
    const member = await isMember({ userId: requesterId, groupId });
    if (!member) {
      // sallitaan myös pending? alkuperäinen koodi vaati vain jäsenyyden (myös pending kävi koska SELECT role …)
      const role = await getRole({ userId: requesterId, groupId });
      if (!role) return res.status(403).json({ error: "You are not a member of this group" });
    }

    const rows = await listMembers({ groupId });
    const myRole = await getRole({ userId: requesterId, groupId });

    return res.json({ members: rows, myRole });
  } catch (err) {
    console.error("Members list error:", err);
    return res.status(500).json({ error: "Failed to fetch members" });
  }
}
