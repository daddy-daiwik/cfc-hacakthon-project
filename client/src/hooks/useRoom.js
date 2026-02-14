import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export function useRoom(roomId) {
    const { socket } = useSocket();
    const { user } = useAuth();
    const [room, setRoom] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [messages, setMessages] = useState([]);
    const [isHost, setIsHost] = useState(false);
    const [ended, setEnded] = useState(false);
    const [kicked, setKicked] = useState(false);

    useEffect(() => {
        if (!socket || !roomId) return;

        // Fetch current room state
        socket.emit('room:get', { roomId }, ({ success, room: r }) => {
            if (success && r) {
                setRoom(r);
                setParticipants(r.participants);
                setMessages(r.messages || []);
                setIsHost(r.hostId === user?.id);
            }
        });

        // Listen for room events
        const onUserJoined = ({ participants: p }) => {
            setParticipants(p);
        };

        const onUserLeft = ({ participants: p }) => {
            setParticipants(p);
        };

        const onParticipantsUpdate = ({ participants: p }) => {
            setParticipants(p);
        };

        const onHostChanged = ({ hostId, hostName }) => {
            setIsHost(hostId === user?.id);
            setRoom(prev => prev ? { ...prev, hostId, hostName } : prev);
        };

        const onRoomEnded = ({ roomId: endedRoomId }) => {
            if (endedRoomId === roomId) {
                setEnded(true);
            }
        };

        const onNewMessage = (msg) => {
            setMessages(prev => [...prev, msg]);
        };

        const onUserMuted = ({ participants: p }) => {
            setParticipants(p);
        };

        const onUserUnmuted = ({ participants: p }) => {
            setParticipants(p);
        };

        const onUserKicked = ({ userId: kickedId }) => {
            if (kickedId === user?.id) {
                setKicked(true);
            }
        };

        const onHandRaised = ({ participants: p }) => {
            setParticipants(p);
        };

        const onHandLowered = ({ participants: p }) => {
            setParticipants(p);
        };

        const onSettingsUpdate = (settings) => {
            setRoom(prev => prev ? { ...prev, settings: { ...prev.settings, ...settings } } : prev);
        };

        socket.on('room:user-joined', onUserJoined);
        socket.on('room:user-left', onUserLeft);
        socket.on('room:participants-update', onParticipantsUpdate);
        socket.on('room:settings-update', onSettingsUpdate);
        socket.on('room:host-changed', onHostChanged);
        socket.on('room:ended', onRoomEnded);
        socket.on('chat:new-message', onNewMessage);
        // socket.on('mod:user-muted', onUserMuted); // Handled by room:participants-update and RoomPage
        // socket.on('mod:user-unmuted', onUserUnmuted);
        socket.on('mod:user-kicked', onUserKicked);
        socket.on('hand:raised', onHandRaised);
        socket.on('hand:lowered', onHandLowered);

        return () => {
            socket.off('room:user-joined', onUserJoined);
            socket.off('room:user-left', onUserLeft);
            socket.off('room:participants-update', onParticipantsUpdate);
            socket.off('room:settings-update', onSettingsUpdate);
            socket.off('room:host-changed', onHostChanged);
            socket.off('room:ended', onRoomEnded);
            socket.off('chat:new-message', onNewMessage);
            // socket.off('mod:user-muted', onUserMuted); // Removed to fix crash
            // socket.off('mod:user-unmuted', onUserUnmuted); // Removed to fix crash
            socket.off('mod:user-kicked', onUserKicked);
            socket.off('hand:raised', onHandRaised);
            socket.off('hand:lowered', onHandLowered);
        };
    }, [socket, roomId, user?.id]);

    const sendMessage = useCallback((text) => {
        if (!socket || !text.trim()) return;
        socket.emit('chat:message', { roomId, text }, () => { });
    }, [socket, roomId]);

    const raiseHand = useCallback(() => {
        if (!socket) return;
        socket.emit('hand:raise', { roomId });
    }, [socket, roomId]);

    const lowerHand = useCallback(() => {
        if (!socket) return;
        socket.emit('hand:lower', { roomId });
    }, [socket, roomId]);

    const muteUser = useCallback((targetUserId) => {
        if (!socket) return;
        socket.emit('mod:mute', { roomId, userId: targetUserId });
    }, [socket, roomId]);

    const unmuteUser = useCallback((targetUserId) => {
        if (!socket) return;
        socket.emit('mod:unmute', { roomId, userId: targetUserId });
    }, [socket, roomId]);

    const kickUser = useCallback((targetUserId) => {
        if (!socket) return;
        socket.emit('mod:kick', { roomId, userId: targetUserId });
    }, [socket, roomId]);

    const endRoom = useCallback((callback) => {
        if (!socket) return;
        socket.emit('room:end', (res) => {
            callback?.(res);
        });
    }, [socket]);

    const leaveRoom = useCallback((callback) => {
        if (!socket) return;
        socket.emit('room:leave', (res) => {
            callback?.(res);
        });
    }, [socket]);

    const muteAll = useCallback(() => {
        if (!socket) return;
        socket.emit('mod:mute-all', { roomId });
    }, [socket, roomId]);

    const setSpeakersAllowed = useCallback((allowed) => {
        if (!socket) return;
        socket.emit('mod:toggle-speakers', { roomId, allowed });
    }, [socket, roomId]);

    return {
        room,
        participants,
        messages,
        isHost,
        ended,
        kicked,
        sendMessage,
        raiseHand,
        lowerHand,
        muteUser,
        unmuteUser,
        kickUser,
        endRoom,
        leaveRoom,
        muteAll,
        setSpeakersAllowed,
    };
}
