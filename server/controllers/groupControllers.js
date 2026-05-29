import Group from "../models/Group.js";
import User from "../models/User.js";
import Expense from "../models/Expense.js";
import { sendInvite } from "../utils/email.js";

// 👥 Create Group
export const createGroup = async (req, res) => {
  try {
    const { name, members, emails } = req.body;

    // Start with the creator as the first member
    const memberIds = [req.user._id];

    // If there are members passed directly as IDs, add them
    if (members && Array.isArray(members)) {
      for (const mId of members) {
        if (mId.toString() !== req.user._id.toString() && !memberIds.includes(mId)) {
          memberIds.push(mId);
        }
      }
    }

    const group = await Group.create({
      name,
      members: memberIds,
      createdBy: req.user._id,
      invitations: []
    });

    // If there are emails to invite, process them as pending invitations
    if (emails && Array.isArray(emails)) {
      for (const emailStr of emails) {
        if (!emailStr) continue;
        const cleanEmail = emailStr.toLowerCase().trim();
        if (cleanEmail === req.user.email.toLowerCase().trim()) continue;

        // Check if user already exists
        const existingUser = await User.findOne({ email: cleanEmail });
        const memberName = existingUser ? existingUser.name : cleanEmail.split("@")[0];

        // Ensure not already invited
        const hasInvitation = group.invitations.some(
          (invite) => invite.email.toLowerCase().trim() === cleanEmail
        );

        if (!hasInvitation) {
          group.invitations.push({
            name: memberName,
            email: cleanEmail,
            status: "pending"
          });

          // Send SMTP invitation email asynchronously in the background so it doesn't block the request
          sendInvite(cleanEmail, req.user.name, group.name).catch((err) =>
            console.error(`[SMTP] Error sending invite email to ${cleanEmail}:`, err)
          );
        }
      }
      await group.save();
    }

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

// 👥 Get User Groups
export const getGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      $or: [
        { createdBy: req.user._id },
        { members: req.user._id }
      ]
    }).populate("members", "name email");

    res.json(groups);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

// 👥 Update/Edit Group Details and Add/Invite/Remove Member
export const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, newMember, newMembers, removeMemberId, removeInvitationEmail } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Update group name if provided
    if (name) {
      group.name = name;
    }

    // Remove member if provided
    if (removeMemberId) {
      group.members = group.members.filter(
        (mId) => mId.toString() !== removeMemberId.toString()
      );
    }

    // Remove pending invitation if provided
    if (removeInvitationEmail) {
      group.invitations = group.invitations.filter(
        (invite) => invite.email.toLowerCase().trim() !== removeInvitationEmail.toLowerCase().trim()
      );
    }

    // Add / Invite new members (supports both single and batch invitations)
    const membersToProcess = [];
    if (newMembers && Array.isArray(newMembers)) {
      membersToProcess.push(...newMembers);
    } else if (newMember && newMember.email) {
      membersToProcess.push(newMember);
    }

    for (const member of membersToProcess) {
      if (!member.email) continue;
      const { name: memberName, email, mobile } = member;
      const cleanEmail = email.toLowerCase().trim();

      // Check if user already exists
      const existingUser = await User.findOne({ email: cleanEmail });

      if (existingUser) {
        // If they exist, check if they are already in members
        const isMember = group.members.some(
          (mId) => mId.toString() === existingUser._id.toString()
        );

        if (!isMember) {
          // Do not add directly to members on invitation, add to group.invitations instead
          const hasInvitation = group.invitations.some(
            (invite) => invite.email.toLowerCase().trim() === cleanEmail
          );

          if (!hasInvitation) {
            group.invitations.push({
              name: existingUser.name || memberName || cleanEmail.split("@")[0],
              email: cleanEmail,
              mobile: mobile || "",
              status: "pending"
            });
            // Send SMTP invitation email to join asynchronously in the background so it doesn't block the request
            sendInvite(cleanEmail, req.user.name, group.name).catch((err) =>
              console.error(`[SMTP] Error sending invite email to ${cleanEmail}:`, err)
            );
          }
        }
      } else {
        // If they do not exist, check if they already have a pending invitation
        const hasInvitation = group.invitations.some(
          (invite) => invite.email.toLowerCase().trim() === cleanEmail
        );

        if (!hasInvitation) {
          group.invitations.push({
            name: memberName || cleanEmail.split("@")[0],
            email: cleanEmail,
            mobile: mobile || "",
            status: "pending"
          });
          // Send SMTP invitation email to join asynchronously in the background so it doesn't block the request
          sendInvite(cleanEmail, req.user.name, group.name).catch((err) =>
            console.error(`[SMTP] Error sending invite email to ${cleanEmail}:`, err)
          );
        }
      }
    }

    await group.save();
    
    // Populate members list to return updated group details
    const updatedGroup = await Group.findById(groupId).populate("members", "name email");
    res.json(updatedGroup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👥 Get Pending Invitations for Logged-In User
export const getPendingInvitations = async (req, res) => {
  try {
    const userEmail = req.user.email.toLowerCase().trim();
    
    // Find groups where the user has a pending invitation
    const invitations = await Group.find({
      "invitations.email": userEmail,
      "invitations.status": "pending"
    }).populate("createdBy", "name email");

    res.json(invitations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👥 Accept Request / Invitation to Join Group
export const acceptInvitation = async (req, res) => {
  try {
    const { groupId } = req.body;
    const userEmail = req.user.email.toLowerCase().trim();

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Find the pending invitation
    const invitationIndex = group.invitations.findIndex(
      (invite) => invite && invite.email && invite.email.toLowerCase().trim() === userEmail && invite.status === "pending"
    );

    if (invitationIndex === -1) {
      console.log("No pending invitation found for userEmail:", userEmail, "Invitations list:", group.invitations);
      return res.status(400).json({ message: "No pending invitation found for this group" });
    }

    // Mark invitation as accepted
    group.invitations[invitationIndex].status = "accepted";
    group.markModified("invitations");

    // Add user to the members array if not already present
    const isMember = group.members.some(
      (mId) => mId.toString() === req.user._id.toString()
    );
    if (!isMember) {
      group.members.push(req.user._id);
    }

    await group.save();
    res.json({ success: true, message: "Invitation accepted successfully!" });
  } catch (error) {
    console.error("acceptInvitation controller exception:", error);
    res.status(500).json({ error: error.message });
  }
};

// 👥 Delete Group (Creator Only)
export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Only the group creator can delete this workspace
    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the group creator can delete this workspace." });
    }

    // Delete associated expenses
    await Expense.deleteMany({ group: groupId });

    // Delete the group itself
    await Group.findByIdAndDelete(groupId);

    res.json({ success: true, message: "Group and its associated expenses deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};