const { v4: uuidv4 } = require('uuid');

const rooms = new Map(); // roomId -> room object

function createRoom({ hostId, hostName, title, tags, type, accessCode }) {
    const id = uuidv4();
    const room = {
        id,
        title: title || 'Untitled Room',
        tags: Array.isArray(tags) ? tags.map(t => t.toLowerCase().trim()).filter(Boolean) : [],
        type: type || 'public', // 'public' or 'private'
        accessCode: accessCode ? accessCode.trim() : null,
        hostId,
        hostName,
        settings: {
            speakersAllowed: true,
        },
        participants: [
            { id: hostId, name: hostName, isMuted: false, hasRaisedHand: false, peerId: null }
        ],
        messages: [],
        createdAt: Date.now(),
    };
    rooms.set(id, room);
    return room;
}

function getRoom(roomId) {
    return rooms.get(roomId) || null;
}

function getRoomByCode(code) {
    if (!code) return null;
    return Array.from(rooms.values()).find(r => r.accessCode === code) || null;
}

function joinRoom(roomId, user) {
    const room = rooms.get(roomId);
    if (!room) throw new Error('Room not found');

    const existing = room.participants.find(p => p.id === user.id);
    if (existing) return room; // already in room

    // Check if speakers are allowed
    const initialMute = !room.settings.speakersAllowed && user.id !== room.hostId;

    const participant = {
        id: user.id,
        name: user.username,
        isMuted: initialMute,
        hasRaisedHand: false,
        peerId: null,
    };
    room.participants.push(participant);
    return room;
}

function leaveRoom(roomId, userId) {
    const room = rooms.get(roomId);
    if (!room) return null;

    room.participants = room.participants.filter(p => p.id !== userId);

    // Auto-close if empty
    if (room.participants.length === 0) {
        rooms.delete(roomId);
        return { ...room, closed: true };
    }

    // If host left, transfer to first remaining participant
    if (room.hostId === userId && room.participants.length > 0) {
        room.hostId = room.participants[0].id;
        room.hostName = room.participants[0].name;
    }

    return room;
}

function endRoom(roomId) {
    const room = rooms.get(roomId);
    if (!room) return null;
    rooms.delete(roomId);
    return room;
}

function listRooms(tagFilter) {
    let result = Array.from(rooms.values());

    if (tagFilter && tagFilter.length > 0) {
        const filterTags = tagFilter.map(t => t.toLowerCase().trim());
        result = result.filter(room =>
            room.tags.some(tag => filterTags.includes(tag))
        );
    }

    // Hide private rooms
    result = result.filter(r => r.type !== 'private');

    // Sort newest first
    result.sort((a, b) => b.createdAt - a.createdAt);

    // Return without messages for the feed
    return result.map(room => ({
        id: room.id,
        title: room.title,
        tags: room.tags,
        hostId: room.hostId,
        hostName: room.hostName,
        participantCount: room.participants.length,
        participants: room.participants.map(p => ({ id: p.id, name: p.name })),
        createdAt: room.createdAt,
    }));
}

function setParticipantPeerId(roomId, userId, peerId) {
    const room = rooms.get(roomId);
    if (!room) return;
    const participant = room.participants.find(p => p.id === userId);
    if (participant) participant.peerId = peerId;
}

function muteParticipant(roomId, userId) {
    const room = rooms.get(roomId);
    if (!room) return null;
    const participant = room.participants.find(p => p.id === userId);
    if (participant) participant.isMuted = true;
    return room;
}

function unmuteParticipant(roomId, userId) {
    const room = rooms.get(roomId);
    if (!room) return null;
    const participant = room.participants.find(p => p.id === userId);
    if (participant) participant.isMuted = false;
    return room;
}

function kickParticipant(roomId, userId) {
    const room = rooms.get(roomId);
    if (!room) return null;
    room.participants = room.participants.filter(p => p.id !== userId);
    if (room.participants.length === 0) {
        rooms.delete(roomId);
        return { ...room, closed: true };
    }
    return room;
}

function raiseHand(roomId, userId) {
    const room = rooms.get(roomId);
    if (!room) return null;
    const participant = room.participants.find(p => p.id === userId);
    if (participant) participant.hasRaisedHand = true;
    return room;
}

function lowerHand(roomId, userId) {
    const room = rooms.get(roomId);
    if (!room) return null;
    const participant = room.participants.find(p => p.id === userId);
    if (participant) participant.hasRaisedHand = false;
    return room;
}

function addMessage(roomId, message) {
    const room = rooms.get(roomId);
    if (!room) return null;
    const msg = {
        id: uuidv4(),
        userId: message.userId,
        username: message.username,
        text: message.text,
        timestamp: Date.now(),
    };
    room.messages.push(msg);
    // Keep last 200 messages
    if (room.messages.length > 200) {
        room.messages = room.messages.slice(-200);
    }
    return msg;
}

function updateRoomSettings(roomId, settings) {
    const room = rooms.get(roomId);
    if (!room) return null;
    room.settings = { ...room.settings, ...settings };
    return room;
}

function muteAllParticipants(roomId, exceptUserId) {
    const room = rooms.get(roomId);
    if (!room) return [];
    const mutedUsers = [];
    room.participants.forEach(p => {
        if (p.id !== exceptUserId && !p.isMuted) {
            p.isMuted = true;
            mutedUsers.push(p.id);
        }
    });
    return mutedUsers;
}

function getAllTags() {
    const tagSet = new Set();
    rooms.forEach(room => {
        room.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet);
}

module.exports = {
    createRoom, getRoom, getRoomByCode, joinRoom, leaveRoom, endRoom, listRooms,
    setParticipantPeerId, muteParticipant, unmuteParticipant,
    kickParticipant, raiseHand, lowerHand, addMessage, getAllTags,
    updateRoomSettings, muteAllParticipants,
};
