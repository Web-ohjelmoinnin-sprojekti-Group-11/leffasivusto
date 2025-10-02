// server/controllers/groupController.js
import {
  createGroup,
  listAllGroups,
  listMyGroups,
  getGroupById,
  getMembership,
  getOwnerId,
  deleteGroup,
} from "../models/groupModel.js";

/** POST /api/groups  (create) */
export async function create(req, res) {
  const rawName = req.body?.group_name ?? "";
  const groupName = String(rawName).trim();
  const ownerId = req.user?.user_id;

  if (!ownerId) return res.status(401).json({ error: "Unauthorized" });
  if (!groupName) return res.status(400).json({ error: "Group name is required" });

  try {
    const group = await createGroup({ ownerId, groupName });
    return res.status(201).json({ group });
  } catch (err) {
    console.error("Group create error:", err);
    return res.status(500).json({ error: "Ryhmän luonti epäonnistui" });
  }
}

/** GET /api/groups  (public list) */
export async function listAll(_req, res) {
  try {
    const groups = await listAllGroups();
    return res.json({ groups });
  } catch (err) {
    console.error("Group list error:", err);
    return res.status(500).json({ error: "Ryhmien haku epäonnistui" });
  }
}

/** GET /api/groups/mine  (own groups) */
export async function listMine(req, res) {
  const userId = req.user.user_id;
  try {
    const groups = await listMyGroups({ userId });
    return res.json({ groups });
  } catch (err) {
    console.error("My groups fetch error:", err);
    return res.status(500).json({ error: "Failed to fetch your groups" });
  }
}

/** GET /api/groups/:id  (members only) */
export async function getOne(req, res) {
  const groupId = req.params.id;
  const userId = req.user.user_id;

  try {
    const group = await getGroupById({ groupId });
    if (!group) return res.status(404).json({ error: "Ryhmä ei löytynyt" });

    const membership = await getMembership({ userId, groupId });
    if (!membership) {
      return res.status(403).json({ error: "Et ole tämän ryhmän jäsen" });
    }

    return res.json({ group, membership });
  } catch (err) {
    console.error("Group fetch error:", err);
    return res.status(500).json({ error: "Ryhmän haku epäonnistui" });
  }
}

/** DELETE /api/groups/:id  (owner only) */
export async function remove(req, res) {
  const groupId = req.params.id;
  const userId = req.user.user_id;

  try {
    const ownerId = await getOwnerId({ groupId });
    if (!ownerId) return res.status(404).json({ error: "Ryhmä ei löytynyt" });
    if (ownerId !== userId) {
      return res.status(403).json({ error: "Vain omistaja voi poistaa ryhmän" });
    }

    await deleteGroup({ groupId });
    return res.json({ message: "Ryhmä poistettu" });
  } catch (err) {
    console.error("Group delete error:", err);
    return res.status(500).json({ error: "Ryhmän poisto epäonnistui" });
  }
}
